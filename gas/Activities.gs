// Activities.gs — Monthly activities management
// Sheet "Activities": id | monthIdx | name | emoji | date | loc | desc | steps | joinUrl | imgUrl | createdAt

/**
 * GET: getActivities
 * params: { monthIdx? } — ถ้าไม่ส่งจะ return ทุกเดือน
 */
function getActivities(params) {
  var data = sheetToObjects('Activities');
  if (params.monthIdx !== undefined && params.monthIdx !== '') {
    var m = String(params.monthIdx);
    data = data.filter(function(r) { return String(r.monthIdx) === m; });
  }
  return ok(data);
}

/**
 * GET: adminAddActivity (token-gated)
 * params: { token, monthIdx, name, emoji, date, loc, desc, joinUrl, imgUrl }
 */
function adminAddActivity(params) {
  verifyToken(params.token);
  var sheet = getSheet('Activities');
  var id    = uuid();
  var now   = new Date().toISOString();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    if (h === 'id')        return id;
    if (h === 'monthIdx')  return params.monthIdx  || '';
    if (h === 'name')      return params.name      || '';
    if (h === 'emoji')     return params.emoji     || '🎉';
    if (h === 'date')      return params.date      || '';
    if (h === 'loc')       return params.loc       || '';
    if (h === 'desc')      return params.desc      || '';
    if (h === 'steps')     return params.steps     || '';
    if (h === 'joinUrl')   return params.joinUrl   || '';
    if (h === 'imgUrl')    return params.imgUrl    || '';
    if (h === 'createdAt') return now;
    return '';
  });
  sheet.appendRow(row);
  return ok({ id: id });
}

/**
 * GET: adminUpdateActivity (token-gated)
 * params: { token, id, ...fields }
 */
function adminUpdateActivity(params) {
  verifyToken(params.token);
  var sheet   = getSheet('Activities');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return err('ไม่พบข้อมูล');

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var rowNum = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(params.id)) { rowNum = i + 2; break; }
  }
  if (rowNum < 0) return err('ไม่พบ activity id: ' + params.id);

  var EDITABLE = ['monthIdx','name','emoji','date','loc','desc','steps','joinUrl','imgUrl'];
  EDITABLE.forEach(function(field) {
    if (params[field] !== undefined) {
      var col = headers.indexOf(field) + 1;
      if (col > 0) sheet.getRange(rowNum, col).setValue(params[field]);
    }
  });
  return ok({ updated: true });
}

/**
 * GET: adminDeleteActivity (token-gated)
 * params: { token, id }
 */
function adminDeleteActivity(params) {
  verifyToken(params.token);
  var sheet   = getSheet('Activities');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return err('ไม่พบข้อมูล');

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(params.id)) {
      sheet.deleteRow(i + 2);
      return ok({ deleted: true });
    }
  }
  return err('ไม่พบ activity id: ' + params.id);
}
