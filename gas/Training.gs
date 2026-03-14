// Training.gs — Training courses + registrations
// Sheet: Trainings
// Columns: id | category | title | description | instructor | section | capacity | color | createdAt
//
// Sheet: TrainingRegistrations
// Columns: id | trainingId | employeeId | employeeName | registeredAt
//
// Sheet: TrainingReviews
// Columns: id | trainingId | employeeId | employeeName | stars | comment | createdAt

/**
 * Run once from GAS editor to create all Training sheets.
 * Safe to re-run — skips sheets that already exist.
 */
function setupTrainingSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var schemas = [
    { name: 'Trainings',              headers: ['id','category','title','description','instructor','section','capacity','color','createdAt'] },
    { name: 'TrainingRegistrations',  headers: ['id','trainingId','employeeId','employeeName','registeredAt'] },
    { name: 'TrainingReviews',        headers: ['id','trainingId','employeeId','employeeName','stars','comment','createdAt'] },
  ];

  schemas.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      // Style header row
      sheet.getRange(1, 1, 1, s.headers.length)
        .setFontWeight('bold')
        .setBackground('#E8F0FE');
      sheet.setFrozenRows(1);
      Logger.log('Created: ' + s.name);
    } else {
      // Ensure color column exists in Trainings
      if (s.name === 'Trainings') {
        var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (existing.indexOf('color') < 0) {
          var capIdx = existing.indexOf('capacity');
          if (capIdx >= 0) {
            sheet.insertColumnAfter(capIdx + 1);
            sheet.getRange(1, capIdx + 2).setValue('color').setFontWeight('bold');
            Logger.log('Added color column to Trainings');
          }
        }
      }
      Logger.log('Already exists: ' + s.name);
    }
  });

  Logger.log('setupTrainingSheets done');
}

function getTrainings(params) {
  var rows = sheetToObjects('Trainings');

  var category = (params && params.category) || '';
  if (category && category !== 'all') {
    rows = rows.filter(function(r) { return r.category === category; });
  }

  return ok(rows.map(function(r) {
    return {
      id:          String(r.id || ''),
      category:    String(r.category || ''),
      title:       String(r.title || ''),
      description: String(r.description || ''),
      instructor:  String(r.instructor || ''),
      section:     String(r.section || ''),
      capacity:    Number(r.capacity) || 0,
      color:       String(r.color || ''),
      createdAt:   String(r.createdAt || ''),
    };
  }));
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
  var already = regs.filter(function(r) {
    return String(r.trainingId) === String(trainingId) && String(r.employeeId) === String(employeeId);
  });
  if (already.length > 0) return err('already_registered');

  var trainings = sheetToObjects('Trainings');
  var course = null;
  for (var i = 0; i < trainings.length; i++) {
    if (String(trainings[i].id) === String(trainingId)) { course = trainings[i]; break; }
  }
  if (!course) return err('training not found');

  var count = regs.filter(function(r) { return String(r.trainingId) === String(trainingId); }).length;
  if (Number(course.capacity) > 0 && count >= Number(course.capacity)) return err('full');

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

// ── Schema migration ─────────────────────────────────────────────────────────

/**
 * Run once from GAS editor: adds 'color' column after 'capacity' in Trainings sheet.
 * Safe to run multiple times — skips if column already exists.
 */
function migrateTrainingsAddColor() {
  var sheet   = getSheet('Trainings');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.indexOf('color') >= 0) {
    Logger.log('color column already exists — nothing to do');
    return;
  }

  var capIdx = headers.indexOf('capacity'); // 0-based
  if (capIdx < 0) {
    Logger.log('capacity column not found — aborting');
    return;
  }

  // Insert a blank column AFTER capacity (GAS insertColumnAfter is 1-based)
  sheet.insertColumnAfter(capIdx + 1);
  sheet.getRange(1, capIdx + 2).setValue('color');
  Logger.log('Done: color column inserted at position ' + (capIdx + 2));
}

// ── Admin CRUD ───────────────────────────────────────────────────────────────

function adminAddTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var id = uuid();
  var category    = (params.category    || '').trim();
  var title       = (params.title       || '').trim();
  var description = (params.description || '').trim();
  var instructor  = (params.instructor  || '').trim();
  var section     = (params.section     || '').trim();
  var capacity    = Number(params.capacity) || 0;
  var color       = (params.color       || '').trim();
  var createdAt   = formatDate(new Date());

  if (!title) return err('title required');

  appendRow('Trainings', [id, category, title, description, instructor, section, capacity, color, createdAt]);
  return ok({ id: id, category: category, title: title, description: description, instructor: instructor, section: section, capacity: capacity, color: color, createdAt: createdAt });
}

function adminUpdateTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var id = params.id;
  if (!id) return err('id required');

  var sheet   = getSheet('Trainings');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var EDITABLE = ['category','title','description','instructor','section','capacity','color'];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][headers.indexOf('id')]) === String(id)) {
      EDITABLE.forEach(function(col) {
        var idx = headers.indexOf(col);
        if (idx >= 0 && params[col] !== undefined) {
          sheet.getRange(i + 1, idx + 1).setValue(params[col]);
        }
      });
      return ok({ updated: true });
    }
  }
  return err('not found');
}

function adminDeleteTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var id = params.id;
  if (!id) return err('id required');

  var sheet   = getSheet('Trainings');
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
