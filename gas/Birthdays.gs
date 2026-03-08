// Birthdays.gs — Birthday handlers
// Sheet: Birthdays
// Columns: key | employeeId | name | role | monthIdx | date | fallbackIdx | imgUrl
//
// Sheet: BirthdayWishes
// Columns: id | birthdayKey | fromName | fromAvIdx | msg | time | year

function getBirthdays(params) {
  var rows = sheetToObjects('Birthdays');

  // Optional: filter by monthIdx
  var monthIdx = params.monthIdx;
  if (monthIdx !== undefined && monthIdx !== '') {
    var m = parseInt(monthIdx, 10);
    rows = rows.filter(function(r) { return parseInt(r.monthIdx, 10) === m; });
  }

  // Pre-load employees for imgUrl fallback (birthday row may have no photo)
  var empRows = sheetToObjects('Employees');
  var empMap = {};
  empRows.forEach(function(e) { empMap[String(e.id)] = e; });

  function resolveImgUrl(rawUrl, employeeId) {
    var imgUrl = String(rawUrl || '');
    // Fall back to employee's imgUrl if birthday has none
    if (!imgUrl && employeeId) {
      var emp = empMap[String(employeeId)];
      if (emp) imgUrl = String(emp.imgUrl || '');
    }
    // Convert drive:fileId → base64 inline
    if (imgUrl.indexOf('drive:') === 0) {
      var fileId = imgUrl.slice(6);
      try {
        var bytes = DriveApp.getFileById(fileId).getBlob().getBytes();
        imgUrl = 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes);
      } catch (e) { imgUrl = ''; }
    }
    return imgUrl;
  }

  var result = rows.map(function(r) {
    return {
      key:         String(r.key || ''),
      employeeId:  String(r.employeeId || ''),
      name:        String(r.name || ''),
      role:        String(r.role || ''),
      monthIdx:    parseInt(r.monthIdx, 10) || 0,
      date:        String(r.date || ''),
      fallbackIdx: parseInt(r.fallbackIdx, 10) || 0,
      imgUrl:      resolveImgUrl(r.imgUrl, r.employeeId),
    };
  });

  return ok(result);
}

function getBirthdayWishes(params) {
  var birthdayKey = params.birthdayKey;
  if (!birthdayKey) return err('birthdayKey required');

  var rows = sheetToObjects('BirthdayWishes');
  var filtered = rows.filter(function(r) { return r.birthdayKey === birthdayKey; });

  var wishes = filtered.map(function(r) {
    return {
      id:          String(r.id || ''),
      birthdayKey: String(r.birthdayKey || ''),
      fromName:    String(r.fromName || ''),
      fromAvIdx:   parseInt(r.fromAvIdx, 10) || 0,
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
  var msg         = params.msg || '';

  if (!birthdayKey) return err('birthdayKey required');
  if (!fromName)    return err('fromName required');

  var id   = uuid();
  var time = formatDate(new Date());
  var year = new Date().getFullYear();

  appendRow('BirthdayWishes', [id, birthdayKey, fromName, fromAvIdx, msg, time, year]);

  return ok({ id: id, birthdayKey: birthdayKey, fromName: fromName, fromAvIdx: fromAvIdx, msg: msg, time: time, year: year });
}
