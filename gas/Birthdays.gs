// Birthdays.gs — Birthday handlers
// Sheet: Birthdays
// Columns: key | employeeId | name | role | monthIdx | date | fallbackIdx | imgUrl
//
// Sheet: BirthdayWishes
// Columns: id | birthdayKey | fromName | fromAvIdx | msg | time | year | fromImgId

/**
 * RUN ONCE from GAS editor: adminInitBirthdayWishesSheet()
 * Adds missing fromImgId column to BirthdayWishes sheet.
 * Safe to run multiple times.
 */
function adminInitBirthdayWishesSheet() {
  var sheet   = getSheet('BirthdayWishes');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('fromImgId') >= 0) {
    Logger.log('fromImgId column already exists'); return;
  }
  // Append as last column
  var newCol = headers.length + 1;
  sheet.getRange(1, newCol).setValue('fromImgId');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, newCol, lastRow - 1, 1).setValue('');
  Logger.log('Added fromImgId at column ' + newCol + '. Final headers: ' +
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].join(' | '));
}

function getBirthdays(params) {
  var rows = cachedSheetRead('Birthdays', 300); // 5 min cache

  var monthIdx = params.monthIdx;
  if (monthIdx !== undefined && monthIdx !== '') {
    var m = parseInt(monthIdx, 10);
    rows = rows.filter(function(r) { return parseInt(r.monthIdx, 10) === m; });
  }

  // Pre-load employees for imgUrl fallback
  var empMap = {};
  try {
    cachedSheetRead('Employees', 600).forEach(function(e) { empMap[String(e.id)] = e; });
  } catch(e) {}

  function resolveImg(rawUrl, employeeId) {
    var raw = String(rawUrl || '');
    if (!raw && employeeId) {
      var emp = empMap[String(employeeId)];
      if (emp) raw = String(emp.imgUrl || '');
    }
    if (raw.indexOf('drive:') === 0) return { imgUrl: '', imgId: raw.slice(6) };
    return { imgUrl: raw, imgId: '' };
  }

  var result = rows.map(function(r) {
    var img = resolveImg(r.imgUrl, r.employeeId);
    return {
      key:         String(r.key || ''),
      employeeId:  String(r.employeeId || ''),
      name:        String(r.name || ''),
      role:        String(r.role || ''),
      monthIdx:    parseInt(r.monthIdx, 10) || 0,
      date:        String(r.date || ''),
      fallbackIdx: parseInt(r.fallbackIdx, 10) || 0,
      imgUrl:      img.imgUrl,
      imgId:       img.imgId,
    };
  });

  return ok(result);
}

function getBirthdayWishes(params) {
  var birthdayKey = params.birthdayKey;
  if (!birthdayKey) return err('birthdayKey required');

  // Build employee name → imgId map for fallback lookup
  var empImgMap = {};
  try {
    cachedSheetRead('Employees', 600).forEach(function(e) {
      var name = String(e.name || '').trim().toLowerCase();
      if (name) {
        var imgId = String(e.imgId || '');
        // imgUrl may use "drive:XXXX" convention
        if (!imgId && e.imgUrl && String(e.imgUrl).indexOf('drive:') === 0) {
          imgId = String(e.imgUrl).slice(6);
        }
        if (imgId) empImgMap[name] = imgId;
      }
    });
  } catch(ex) {}

  var rows = sheetToObjects('BirthdayWishes');
  var filtered = rows.filter(function(r) { return r.birthdayKey === birthdayKey; });

  var wishes = filtered.map(function(r) {
    var fromImgId = String(r.fromImgId || '');
    // Fallback: look up by sender name in Employees sheet
    if (!fromImgId) {
      var key = String(r.fromName || '').trim().toLowerCase();
      fromImgId = empImgMap[key] || '';
    }
    return {
      id:          String(r.id || ''),
      birthdayKey: String(r.birthdayKey || ''),
      fromName:    String(r.fromName || ''),
      fromAvIdx:   parseInt(r.fromAvIdx, 10) || 0,
      fromImgId:   fromImgId,
      msg:         String(r.msg || ''),
      time:        String(r.time || ''),
      year:        parseInt(r.year, 10) || new Date().getFullYear(),
    };
  });

  return ok(wishes);
}

function addBirthdayWish(params) {
  var birthdayKey = params.birthdayKey;
  var fromName    = params.fromName;
  var fromAvIdx   = parseInt(params.fromAvIdx, 10) || 0;
  var fromImgId   = String(params.fromImgId || '');
  var msg         = params.msg || '';

  if (!birthdayKey) return err('birthdayKey required');
  if (!fromName)    return err('fromName required');

  var id   = uuid();
  var time = formatDate(new Date());
  var year = new Date().getFullYear();

  appendRow('BirthdayWishes', [id, birthdayKey, fromName, fromAvIdx, msg, time, year, fromImgId]);

  // Award points for sending a birthday wish
  try { addPoints(fromName, 'birthday_wish', 'อวยพรวันเกิด'); } catch(ex) {}

  return ok({ id: id, birthdayKey: birthdayKey, fromName: fromName, fromAvIdx: fromAvIdx, fromImgId: fromImgId, msg: msg, time: time, year: year });
}
