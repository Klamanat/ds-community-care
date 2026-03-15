// Birthdays.gs — Birthday handlers
// Sheet: Birthdays
// Columns: key | employeeId | name | role | monthIdx | date | fallbackIdx | imgUrl
//
// Sheet: BirthdayWishes
// Columns: id | birthdayKey | fromName | fromAvIdx | msg | time | year | fromImgId

// Use addMissingColumns() in Setup.gs to add missing columns

/** Run in GAS editor to verify birthday data before deploying */
function testGetBirthdays() {
  var rows = sheetToObjects('Employees');
  Logger.log('Total employees: ' + rows.length);
  var hasBday = 0;
  rows.forEach(function(r) {
    var m = _bdayMonthIdx(r);
    if (m >= 0) {
      hasBday++;
      Logger.log('✓ ' + r.name + ' | bdDate=[' + r.bdDate + '] | monthIdx col=[' + r.monthIdx + '] | derived=' + m);
    }
  });
  Logger.log('Employees with birthday: ' + hasBday);
  Logger.log('--- getBirthdays() result ---');
  var result = getBirthdays({});
  Logger.log(JSON.stringify(result));
}

// Thai month abbreviations — index = 0-based month (0=Jan … 11=Dec)
var BDAY_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/**
 * Derive 0-based month index from an employee row.
 * Primary source: bdDate string (e.g. "14 ก.ค." → 6)  ← always correct
 * Fallback:       monthIdx column                       ← may be out of sync
 * Returns -1 if no birthday data found.
 */
function _bdayMonthIdx(r) {
  var bdDate = String(r.bdDate || '').trim();
  for (var i = 0; i < BDAY_MONTHS.length; i++) {
    if (bdDate.indexOf(BDAY_MONTHS[i]) >= 0) return i;
  }
  var m = parseInt(r.monthIdx, 10);
  return isNaN(m) ? -1 : m;
}

function getBirthdays(params) {
  // Birthday data lives on the Employees sheet (columns: monthIdx, bdDate, fallbackIdx)
  var rows = sheetToObjects('Employees');

  // Keep only employees that have birthday data (bdDate or valid monthIdx)
  rows = rows.filter(function(r) { return _bdayMonthIdx(r) >= 0; });

  // Filter by specific month when requested (0-based: 0=Jan … 11=Dec)
  if (params.monthIdx !== undefined && params.monthIdx !== '') {
    var target = parseInt(params.monthIdx, 10);
    rows = rows.filter(function(r) { return _bdayMonthIdx(r) === target; });
  }

  var result = rows.map(function(r) {
    var imgUrl = String(r.imgUrl || '');
    var imgId  = String(r.imgId  || '');
    if (imgUrl.indexOf('drive:') === 0) { imgId = imgUrl.slice(6); imgUrl = ''; }
    return {
      key:         String(r.id   || ''),
      employeeId:  String(r.id   || ''),
      name:        String(r.name || ''),
      role:        String(r.role || ''),
      monthIdx:    _bdayMonthIdx(r),   // derived from bdDate (always correct)
      date:        String(r.bdDate || ''),
      fallbackIdx: parseInt(r.fallbackIdx, 10) || 0,
      imgUrl:      imgUrl,
      imgId:       imgId,
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
  try { addPoints(fromName, 'birthday_wish', '', 'อวยพรวันเกิด'); } catch(ex) {}

  return ok({ id: id, birthdayKey: birthdayKey, fromName: fromName, fromAvIdx: fromAvIdx, fromImgId: fromImgId, msg: msg, time: time, year: year });
}
