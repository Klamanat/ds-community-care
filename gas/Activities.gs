// Activities.gs — Monthly activities management
// Sheet "Activities": id | monthIdx | name | emoji | date | loc | desc | steps | joinUrl | imgUrl | imgId | createdAt

/**
 * GET: getActivities
 * params: { monthIdx? } — ถ้าไม่ส่งจะ return ทุกเดือน
 * ถ้า row มี imgId (Drive file ID) จะ fetch รูปจาก Drive แล้ว inline เป็น base64 ใน imgUrl
 */
function getActivities(params) {
  // cachedSheetRead: shared cache → 200 users share one sheet read per 5 min
  var data = cachedSheetRead('Activities');
  if (params.monthIdx !== undefined && params.monthIdx !== '') {
    var m = String(params.monthIdx);
    data = data.filter(function(r) { return String(r.monthIdx) === m; });
  }
  // imgId passed as-is — frontend batch-fetches via getImages after page renders
  return ok(data);
}

/**
 * POST: adminAddActivity (token-gated)
 * params: { token, monthIdx, name, emoji, date, loc, desc, steps, joinUrl, imgUrl, imgId }
 */
function adminAddActivity(params) {
  verifyToken(params.token);
  var sheet   = getSheet('Activities');
  var id      = uuid();
  var now     = new Date().toISOString();
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
    if (h === 'joinOpen')  return params.joinOpen  !== undefined ? params.joinOpen  : true;
    if (h === 'joinLabel') return params.joinLabel || 'stamp';
    if (h === 'imgUrl')    return params.imgId ? '' : (params.imgUrl || ''); // ถ้ามี imgId ไม่ต้องเก็บ base64
    if (h === 'imgId')     return params.imgId     || '';
    if (h === 'createdAt') return now;
    return '';
  });
  sheet.appendRow(row);
  invalidateSheet('Activities');
  return ok({ id: id });
}

/**
 * POST: adminUpdateActivity (token-gated)
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

  var EDITABLE = ['monthIdx','name','emoji','date','loc','desc','steps','joinUrl','joinOpen','joinLabel','imgUrl','imgId'];
  EDITABLE.forEach(function(field) {
    if (params[field] !== undefined) {
      var col = headers.indexOf(field) + 1;
      if (col > 0) {
        // ถ้ามี imgId ให้ clear imgUrl (Drive เป็น source of truth)
        if (field === 'imgId' && params.imgId) {
          var imgUrlCol = headers.indexOf('imgUrl') + 1;
          if (imgUrlCol > 0) sheet.getRange(rowNum, imgUrlCol).setValue('');
        }
        sheet.getRange(rowNum, col).setValue(params[field]);
      }
    }
  });
  invalidateSheet('Activities');
  return ok({ updated: true });
}

/**
 * GET: joinActivity — stamp ความตั้งใจเข้าร่วมกิจกรรม (ไม่ต้อง token)
 * params: { activityId, activityName, employeeName }
 */
function joinActivity(params) {
  var activityId   = String(params.activityId   || '').trim();
  var activityName = String(params.activityName || '').trim();
  var employeeName = String(params.employeeName || 'ไม่ระบุชื่อ').trim();

  if (!activityId) return err('activityId required');

  var sheet   = getSheet('ActivityJoins');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0] || ['id','activityId','activityName','employeeName','stampedAt'];
  var aidIdx  = headers.indexOf('activityId');
  var nameIdx = headers.indexOf('employeeName');

  // ตรวจว่า stamp แล้วหรือยัง
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][aidIdx]) === activityId && String(data[i][nameIdx]) === employeeName) {
      return ok({ alreadyJoined: true, joinCount: countJoins(data, aidIdx, activityId) });
    }
  }

  var id        = uuid();
  var stampedAt = formatDate(new Date());
  sheet.appendRow([id, activityId, activityName, employeeName, stampedAt]);
  invalidateSheet('ActivityJoins');

  return ok({ alreadyJoined: false, joinCount: countJoins(data, aidIdx, activityId) + 1 });
}

function countJoins(data, aidIdx, activityId) {
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][aidIdx]) === activityId) count++;
  }
  return count;
}

/**
 * GET: getMyStamps
 * params: { employeeName }
 */
function getMyStamps(params) {
  var employeeName = String(params.employeeName || '').trim();
  if (!employeeName) return ok([]);
  var data = cachedSheetRead('ActivityJoins', 120); // 2 min — stamps update often
  var myStamps = data.filter(function(r) {
    return String(r.employeeName || '').trim() === employeeName;
  });
  return ok(myStamps);
}

/**
 * GET: claimActivityReward
 * params: { activityId, employeeName, rewardType }
 * Requires columns rewardClaimed and rewardType in ActivityJoins sheet
 */
function claimActivityReward(params) {
  var activityId   = String(params.activityId   || '').trim();
  var employeeName = String(params.employeeName || '').trim();
  var rewardType   = String(params.rewardType   || '').trim();
  if (!activityId || !employeeName) return err('activityId and employeeName required');

  var sheet   = getSheet('ActivityJoins');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return err('ยังไม่มีข้อมูล');

  var headers       = data[0];
  var aidIdx        = headers.indexOf('activityId');
  var nameIdx       = headers.indexOf('employeeName');
  var claimedIdx    = headers.indexOf('rewardClaimed');
  var rewardTypeIdx = headers.indexOf('rewardType');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][aidIdx]) === activityId && String(data[i][nameIdx]) === employeeName) {
      if (claimedIdx >= 0 && data[i][claimedIdx] === true) return ok({ alreadyClaimed: true });
      if (claimedIdx    >= 0) sheet.getRange(i + 1, claimedIdx    + 1).setValue(true);
      if (rewardTypeIdx >= 0) sheet.getRange(i + 1, rewardTypeIdx + 1).setValue(rewardType);
      invalidateSheet('ActivityJoins');
      return ok({ claimed: true, rewardType: rewardType });
    }
  }
  return err('ยังไม่ได้ join กิจกรรมนี้');
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
      invalidateSheet('Activities');
      return ok({ deleted: true });
    }
  }
  return err('ไม่พบ activity id: ' + params.id);
}
