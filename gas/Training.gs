// Training.gs — Training courses + registrations
//
// แต่ละ category มี sheet ของตัวเอง:
//   AnnualTrainings      id | title | description | instructor | section | createdAt
//   IdpTrainings         id | title | description | instructor | section | createdAt
//   ExternalTrainings    id | title | description | instructor | section | createdAt
//   CompulsoryTrainings  id | title | description | instructor | section | createdAt
//   SuperskillsTrainings id | title | description | instructor | section | createdAt
//   LeadershipTrainings  id | title | description | instructor | section | createdAt
//   BlogTrainings        id | title | description | instructor | section | createdAt
//
// Site Visit (แยกต่างหาก):
//   SiteVisits  id | title | description | instructor | color | createdAt
//   SiteVotes   id | siteId | employeeId | employeeName | votedAt
//
// ลงทะเบียน / รีวิว (ใช้ trainingId UUID ข้ามทุก sheet ได้):
//   TrainingRegistrations  id | trainingId | employeeId | employeeName | registeredAt
//   TrainingReviews        id | trainingId | employeeId | employeeName | stars | comment | createdAt

// ── Category ↔ Sheet mapping ──────────────────────────────────────────────────
var CAT_TO_SHEET = {
  annual:      'AnnualTrainings',
  idp:         'IdpTrainings',
  external:    'ExternalTrainings',
  compulsory:  'CompulsoryTrainings',
  superskills: 'SuperskillsTrainings',
  leadership:  'LeadershipTrainings',
  blog:        'BlogTrainings',
};

var SHEET_TO_CAT = (function() {
  var m = {};
  Object.keys(CAT_TO_SHEET).forEach(function(k) { m[CAT_TO_SHEET[k]] = k; });
  return m;
})();

var TRAINING_HEADERS = ['id','title','description','instructor','section','createdAt'];

function _mapRow(r, category) {
  return {
    id:          String(r.id          || ''),
    category:    category,
    title:       String(r.title       || ''),
    description: String(r.description || ''),
    instructor:  String(r.instructor  || ''),
    section:     String(r.section     || ''),
    createdAt:   String(r.createdAt   || ''),
  };
}

/**
 * getTrainings — อ่านหลักสูตร
 * params.category (optional) = 'annual'|'idp'|... → อ่านเฉพาะ sheet นั้น
 * ไม่ส่ง category = merge ทุก sheet
 */
function getTrainings(params) {
  var cat = ((params && params.category) || '').trim();

  if (cat && CAT_TO_SHEET[cat]) {
    // อ่าน sheet เดียว
    var rows = [];
    try { rows = sheetToObjects(CAT_TO_SHEET[cat]); } catch(e) {}
    return ok(rows.map(function(r) { return _mapRow(r, cat); }));
  }

  // ไม่ระบุ category → merge ทุก sheet
  var all = [];
  Object.keys(CAT_TO_SHEET).forEach(function(c) {
    var rows = [];
    try { rows = sheetToObjects(CAT_TO_SHEET[c]); } catch(e) {}
    rows.forEach(function(r) { all.push(_mapRow(r, c)); });
  });
  return ok(all);
}

function registerTraining(params) {
  var trainingId   = params.trainingId;
  var employeeId   = params.employeeId;
  var employeeName = params.employeeName || 'ไม่ระบุ';

  if (!trainingId || !employeeId) return err('trainingId and employeeId required');

  var regSheet;
  try {
    regSheet = getSheet('TrainingRegistrations');
  } catch(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    regSheet = ss.insertSheet('TrainingRegistrations');
    regSheet.appendRow(['id','trainingId','employeeId','employeeName','registeredAt']);
  }

  var regs = sheetToObjects('TrainingRegistrations');
  var already = regs.some(function(r) {
    return String(r.trainingId) === String(trainingId) && String(r.employeeId) === String(employeeId);
  });
  if (already) return err('already_registered');

  var id           = uuid();
  var registeredAt = formatDate(new Date());
  appendRow('TrainingRegistrations', [id, trainingId, employeeId, employeeName, registeredAt]);

  return ok({ id: id, trainingId: trainingId, employeeId: employeeId, registeredAt: registeredAt });
}

function cancelRegistration(params) {
  var trainingId = params.trainingId;
  var employeeId = params.employeeId;
  if (!trainingId || !employeeId) return err('trainingId and employeeId required');

  var sheet;
  try { sheet = getSheet('TrainingRegistrations'); } catch(e) { return ok({ cancelled: true }); }
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  var tidIdx = headers.indexOf('trainingId');
  var eidIdx = headers.indexOf('employeeId');

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][tidIdx]) === String(trainingId) && String(data[i][eidIdx]) === String(employeeId)) {
      sheet.deleteRow(i + 1);
      return ok({ cancelled: true });
    }
  }
  return err('registration not found');
}

function getMyTrainings(params) {
  var employeeId = params.employeeId;
  if (!employeeId) return err('employeeId required');
  var regs = [];
  try { regs = sheetToObjects('TrainingRegistrations'); } catch(e) {}
  var ids = regs
    .filter(function(r) { return String(r.employeeId) === String(employeeId); })
    .map(function(r) { return String(r.trainingId); });
  return ok(ids);
}

function adminGetTrainingRegistrations(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var trainingId = params.trainingId;
  if (!trainingId) return err('trainingId required');
  var regs = [];
  try { regs = sheetToObjects('TrainingRegistrations'); } catch(e) {}
  var result = regs
    .filter(function(r) { return String(r.trainingId) === String(trainingId); })
    .map(function(r) { return {
      id:           String(r.id || ''),
      employeeId:   String(r.employeeId || ''),
      employeeName: String(r.employeeName || ''),
      registeredAt: String(r.registeredAt || ''),
    }; });
  return ok(result);
}

// ── Admin CRUD (category-aware) ───────────────────────────────────────────────

function adminAddTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var category = (params.category || '').trim();
  var sheetName = CAT_TO_SHEET[category];
  if (!sheetName) return err('Invalid category: ' + category);

  var id          = uuid();
  var title       = (params.title       || '').trim();
  var description = (params.description || '').trim();
  var instructor  = (params.instructor  || '').trim();
  var section     = (params.section     || '').trim();
  var createdAt   = formatDate(new Date());

  if (!title) return err('title required');

  appendRow(sheetName, [id, title, description, instructor, section, createdAt]);
  return ok({ id: id, category: category, title: title, description: description, instructor: instructor, section: section, createdAt: createdAt });
}

function adminUpdateTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var category  = (params.category || '').trim();
  var sheetName = CAT_TO_SHEET[category];
  if (!sheetName) return err('Invalid category: ' + category);

  var id = params.id;
  if (!id) return err('id required');

  var sheet   = getSheet(sheetName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var EDITABLE = ['title','description','instructor','section'];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(id)) {
      EDITABLE.forEach(function(col) {
        var idx = headers.indexOf(col);
        if (idx >= 0 && params[col] !== undefined) sheet.getRange(i + 1, idx + 1).setValue(params[col]);
      });
      return ok({ updated: true });
    }
  }
  return err('not found');
}

function adminDeleteTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var category  = (params.category || '').trim();
  var sheetName = CAT_TO_SHEET[category];
  if (!sheetName) return err('Invalid category: ' + category);

  var id = params.id;
  if (!id) return err('id required');

  var sheet   = getSheet(sheetName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: true });
    }
  }
  return err('not found');
}

// ── Site Visits ───────────────────────────────────────────────────────────────
// Sheet: SiteVisits | Columns: id | title | description | instructor | color | createdAt
// Sheet: SiteVotes  | Columns: id | siteId | employeeId | employeeName | votedAt

function getSiteVisits() {
  var sites = [];
  try { sites = sheetToObjects('SiteVisits'); } catch(e) { return ok([]); }

  var votes = [];
  try { votes = sheetToObjects('SiteVotes'); } catch(e) {}

  // นับคะแนนโหวตต่อ site
  var voteCounts = {};
  votes.forEach(function(v) {
    var sid = String(v.siteId || '');
    voteCounts[sid] = (voteCounts[sid] || 0) + 1;
  });

  return ok(sites.map(function(s) {
    return {
      id:          String(s.id          || ''),
      title:       String(s.title       || ''),
      description: String(s.description || ''),
      instructor:  String(s.instructor  || ''),
      color:       String(s.color       || ''),
      createdAt:   String(s.createdAt   || ''),
      voteCount:   voteCounts[String(s.id)] || 0,
    };
  }));
}

function voteSite(params) {
  var siteId       = String(params.siteId       || '').trim();
  var employeeId   = String(params.employeeId   || '').trim();
  var employeeName = String(params.employeeName || 'ไม่ระบุ').trim();
  if (!siteId || !employeeId) return err('siteId and employeeId required');

  var sheet;
  try { sheet = getSheet('SiteVotes'); } catch(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet  = ss.insertSheet('SiteVotes');
    sheet.appendRow(['id','siteId','employeeId','employeeName','votedAt']);
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var sidIdx  = headers.indexOf('siteId');
  var eidIdx  = headers.indexOf('employeeId');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][sidIdx]) === siteId && String(data[i][eidIdx]) === employeeId) {
      return err('already_voted');
    }
  }

  var id      = uuid();
  var votedAt = formatDate(new Date());
  sheet.appendRow([id, siteId, employeeId, employeeName, votedAt]);
  return ok({ id: id, siteId: siteId, employeeId: employeeId, votedAt: votedAt });
}

function cancelSiteVote(params) {
  var siteId     = String(params.siteId     || '').trim();
  var employeeId = String(params.employeeId || '').trim();
  if (!siteId || !employeeId) return err('siteId and employeeId required');

  var sheet;
  try { sheet = getSheet('SiteVotes'); } catch(e) { return ok({ cancelled: true }); }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var sidIdx  = headers.indexOf('siteId');
  var eidIdx  = headers.indexOf('employeeId');

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][sidIdx]) === siteId && String(data[i][eidIdx]) === employeeId) {
      sheet.deleteRow(i + 1);
      return ok({ cancelled: true });
    }
  }
  return err('vote not found');
}

function getMySiteVotes(params) {
  var employeeId = String(params.employeeId || '').trim();
  if (!employeeId) return ok([]);
  var votes = [];
  try { votes = sheetToObjects('SiteVotes'); } catch(e) {}
  var ids = votes
    .filter(function(v) { return String(v.employeeId) === employeeId; })
    .map(function(v) { return String(v.siteId); });
  return ok(ids);
}

function adminAddSiteVisit(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var id          = uuid();
  var title       = (params.title       || '').trim();
  var description = (params.description || '').trim();
  var instructor  = (params.instructor  || '').trim();
  var color       = (params.color       || '').trim();
  var createdAt   = formatDate(new Date());
  if (!title) return err('title required');
  appendRow('SiteVisits', [id, title, description, instructor, color, createdAt]);
  return ok({ id: id, title: title, description: description, instructor: instructor, color: color, createdAt: createdAt });
}

function adminUpdateSiteVisit(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var id = params.id;
  if (!id) return err('id required');
  var sheet   = getSheet('SiteVisits');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var EDITABLE = ['title','description','instructor','color'];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(id)) {
      EDITABLE.forEach(function(col) {
        var idx = headers.indexOf(col);
        if (idx >= 0 && params[col] !== undefined) sheet.getRange(i + 1, idx + 1).setValue(params[col]);
      });
      return ok({ updated: true });
    }
  }
  return err('not found');
}

function adminDeleteSiteVisit(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var id = params.id;
  if (!id) return err('id required');
  var sheet   = getSheet('SiteVisits');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: true });
    }
  }
  return err('not found');
}

function adminGetSiteVotes(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var votes = [];
  try { votes = sheetToObjects('SiteVotes'); } catch(e) {}
  return ok(votes.map(function(v) {
    return {
      id:           String(v.id           || ''),
      siteId:       String(v.siteId       || ''),
      employeeId:   String(v.employeeId   || ''),
      employeeName: String(v.employeeName || ''),
      votedAt:      String(v.votedAt      || ''),
    };
  }));
}

// ── Site Suggestions (อื่นๆ) ─────────────────────────────────────────────────
// Sheet: SiteSuggestions
// Columns: id | employeeId | employeeName | suggestion | createdAt

/**
 * Upsert: one suggestion per employee. Pass suggestion='' to clear (cancel).
 */
function submitSiteSuggestion(params) {
  var employeeId   = String(params.employeeId   || '').trim();
  var employeeName = String(params.employeeName || 'ไม่ระบุ').trim();
  var suggestion   = String(params.suggestion   || '').trim();
  if (!employeeId) return err('employeeId required');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;
  try {
    sheet = getSheet('SiteSuggestions');
  } catch(e) {
    sheet = ss.insertSheet('SiteSuggestions');
    sheet.appendRow(['id','employeeId','employeeName','suggestion','createdAt']);
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var eidIdx  = headers.indexOf('employeeId');

  // Update if exists
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][eidIdx]) === employeeId) {
      if (!suggestion) {
        sheet.deleteRow(i + 1);
        return ok({ cancelled: true });
      }
      sheet.getRange(i + 1, headers.indexOf('suggestion') + 1).setValue(suggestion);
      sheet.getRange(i + 1, headers.indexOf('employeeName') + 1).setValue(employeeName);
      sheet.getRange(i + 1, headers.indexOf('createdAt') + 1).setValue(formatDate(new Date()));
      return ok({ updated: true });
    }
  }

  if (!suggestion) return ok({ cancelled: true });

  sheet.appendRow([uuid(), employeeId, employeeName, suggestion, formatDate(new Date())]);
  return ok({ created: true });
}

function getMySiteSuggestion(params) {
  var employeeId = String(params.employeeId || '').trim();
  if (!employeeId) return ok(null);
  var rows = [];
  try { rows = sheetToObjects('SiteSuggestions'); } catch(e) {}
  var found = rows.find(function(r) { return String(r.employeeId) === employeeId; });
  return ok(found ? { suggestion: String(found.suggestion || '') } : null);
}

function adminGetSiteSuggestions(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');
  var rows = [];
  try { rows = sheetToObjects('SiteSuggestions'); } catch(e) {}
  return ok(rows.map(function(r) {
    return {
      id:           String(r.id           || ''),
      employeeId:   String(r.employeeId   || ''),
      employeeName: String(r.employeeName || ''),
      suggestion:   String(r.suggestion   || ''),
      createdAt:    String(r.createdAt    || ''),
    };
  }));
}

// ── Reviews ──────────────────────────────────────────────────────────────────
// Sheet: TrainingReviews
// Columns: id | trainingId | employeeId | employeeName | stars | comment | createdAt

/**
 * GET: submitTrainingReview
 * params: { trainingId, employeeId, employeeName, stars, comment }
 * Upserts — one review per employee per course.
 */
function submitTrainingReview(params) {
  var trainingId   = String(params.trainingId   || '').trim();
  var employeeId   = String(params.employeeId   || '').trim();
  var employeeName = String(params.employeeName || 'ไม่ระบุ').trim();
  var stars        = parseInt(params.stars, 10);
  var comment      = String(params.comment || '').trim();

  if (!trainingId || !employeeId)   return err('trainingId and employeeId required');
  if (isNaN(stars) || stars < 1 || stars > 5) return err('stars must be 1–5');

  var sheet;
  try { sheet = getSheet('TrainingReviews'); } catch(e) {
    // Auto-create sheet with headers
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet  = ss.insertSheet('TrainingReviews');
    sheet.appendRow(['id','trainingId','employeeId','employeeName','stars','comment','createdAt']);
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var tidIdx  = headers.indexOf('trainingId');
  var eidIdx  = headers.indexOf('employeeId');

  // Update if exists
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][tidIdx]) === trainingId && String(data[i][eidIdx]) === employeeId) {
      var sIdx  = headers.indexOf('stars');
      var cIdx  = headers.indexOf('comment');
      var tsIdx = headers.indexOf('createdAt');
      if (sIdx  >= 0) sheet.getRange(i + 1, sIdx  + 1).setValue(stars);
      if (cIdx  >= 0) sheet.getRange(i + 1, cIdx  + 1).setValue(comment);
      if (tsIdx >= 0) sheet.getRange(i + 1, tsIdx + 1).setValue(formatDate(new Date()));
      invalidateSheet('TrainingReviews');
      return ok({ updated: true, stars: stars });
    }
  }

  // Insert new
  var id = uuid();
  sheet.appendRow([id, trainingId, employeeId, employeeName, stars, comment, formatDate(new Date())]);
  invalidateSheet('TrainingReviews');
  return ok({ id: id, stars: stars, created: true });
}

/**
 * GET: getTrainingReviews
 * params: { trainingId? } — omit to get all
 */
function getTrainingReviews(params) {
  try {
    var rows = cachedSheetRead('TrainingReviews', 120);
    var tid  = String(params.trainingId || '').trim();
    if (tid) rows = rows.filter(function(r) { return String(r.trainingId) === tid; });
    return ok(rows.map(function(r) {
      return {
        id:           String(r.id           || ''),
        trainingId:   String(r.trainingId   || ''),
        employeeId:   String(r.employeeId   || ''),
        employeeName: String(r.employeeName || ''),
        stars:        parseInt(r.stars, 10) || 0,
        comment:      String(r.comment      || ''),
        createdAt:    String(r.createdAt    || ''),
      };
    }));
  } catch(e) { return ok([]); }
}

// ── Helper ───────────────────────────────────────────────────────────────────

function checkAdminToken(token) {
  if (!token) return false;
  var admins = sheetToObjects('Admins');
  var now    = new Date().getTime();
  return admins.some(function(a) {
    return a.token === token && new Date(a.tokenExpires).getTime() > now;
  });
}
