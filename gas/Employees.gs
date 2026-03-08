// Employees.gs — Employees sheet handlers

/**
 * uploadImage — store a base64 image string into any sheet's imgUrl column.
 *
 * params:
 *   sheetName   {string}  — target sheet, e.g. 'Employees' or 'Birthdays'
 *   keyCol      {string}  — column name used to find the row (default 'id')
 *   keyVal      {string}  — value to match in keyCol
 *   imgCol      {string}  — column to write into (default 'imgUrl')
 *   imageBase64 {string}  — data:image/jpeg;base64,... string (≤ 50 000 chars)
 */
function uploadImage(params) {
  var sheetName   = params.sheetName;
  var keyCol      = params.keyCol  || 'id';
  var keyVal      = String(params.keyVal || '');
  var imgCol      = params.imgCol  || 'imgUrl';
  var imageBase64 = params.imageBase64;

  if (!sheetName)   return err('sheetName required');
  if (!keyVal)      return err('keyVal required');
  if (!imageBase64) return err('imageBase64 required');
  if (imageBase64.length > 50000) return err('image too large (max 50 000 chars)');

  var sheet   = getSheet(sheetName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyIdx  = headers.indexOf(keyCol);
  var imgIdx  = headers.indexOf(imgCol);

  if (keyIdx < 0) return err('Column not found: ' + keyCol);
  if (imgIdx < 0) return err('Column not found: ' + imgCol);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyIdx]) === keyVal) {
      sheet.getRange(i + 1, imgIdx + 1).setValue(imageBase64);
      return ok({ updated: true, sheet: sheetName, key: keyVal });
    }
  }

  return err('Row not found: ' + keyVal + ' in ' + sheetName);
}


// Sheet: Employees
// Columns: id | name | role | dept | imgUrl | grad | inTeam | inStarGang | starGangName | starGangRole

function getEmployees(params) {
  var rows = sheetToObjects('Employees');

  var inTeam     = params.inTeam;
  var inStarGang = params.inStarGang;

  if (inTeam === 'true') {
    rows = rows.filter(function(r) { return r.inTeam === true || r.inTeam === 'TRUE'; });
  }
  if (inStarGang === 'true') {
    rows = rows.filter(function(r) { return r.inStarGang === true || r.inStarGang === 'TRUE'; });
  }

  var employees = rows.map(function(r) {
    var imgUrl = String(r.imgUrl || '');

    // ถ้า imgUrl มี prefix "drive:" → fetch จาก Drive แล้ว inline เป็น base64
    if (imgUrl.indexOf('drive:') === 0) {
      var fileId = imgUrl.slice(6);
      try {
        var bytes = DriveApp.getFileById(fileId).getBlob().getBytes();
        imgUrl = 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes);
      } catch (e) {
        imgUrl = '';
      }
    }

    return {
      id:           String(r.id      || ''),
      empCode:      String(r.empCode || ''),
      name:         String(r.name    || ''),
      role:         String(r.role    || ''),
      dept:         String(r.dept    || ''),
      imgUrl:       imgUrl,
      imgId:        String(r.imgId   || ''),
      grad:         String(r.grad    || ''),
      inTeam:       r.inTeam === true || r.inTeam === 'TRUE',
      inStarGang:   r.inStarGang === true || r.inStarGang === 'TRUE',
      starGangName: String(r.starGangName || ''),
      starGangRole: String(r.starGangRole || ''),
    };
  });

  return ok(employees);
}

function addTeamMember(params) {
  var id   = params.id;
  var name = params.name;
  var role = params.role || '';
  var dept = params.dept || '';

  if (!id || !name) return err('id and name required');

  var sheet = getSheet('Employees');
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');

  // Check if already exists
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      // Update inTeam = TRUE
      var inTeamIdx = headers.indexOf('inTeam');
      if (inTeamIdx >= 0) sheet.getRange(i + 1, inTeamIdx + 1).setValue(true);
      return ok({ id: id, updated: true });
    }
  }

  // New employee row
  var row = headers.map(function(h) {
    if (h === 'id')     return id;
    if (h === 'name')   return name;
    if (h === 'role')   return role;
    if (h === 'dept')   return dept;
    if (h === 'inTeam') return true;
    return '';
  });
  sheet.appendRow(row);
  return ok({ id: id, created: true });
}

function updateEmployeeSelf(params) {
  var id     = params.id;
  var name   = (params.name   || '').trim();
  var role   = (params.role   || '').trim();
  var dept   = (params.dept   || '').trim();
  var imgUrl = (params.imgUrl || '').trim();
  var imgId  = (params.imgId  || '').trim();

  if (!id) return err('id required');

  var sheet   = getSheet('Employees');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx   = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      var nameIdx   = headers.indexOf('name');
      var roleIdx   = headers.indexOf('role');
      var deptIdx   = headers.indexOf('dept');
      var imgUrlIdx = headers.indexOf('imgUrl');
      var imgIdIdx  = headers.indexOf('imgId');
      if (name   && nameIdx   >= 0) sheet.getRange(i + 1, nameIdx   + 1).setValue(name);
      if (role   && roleIdx   >= 0) sheet.getRange(i + 1, roleIdx   + 1).setValue(role);
      if (dept   && deptIdx   >= 0) sheet.getRange(i + 1, deptIdx   + 1).setValue(dept);
      if (imgId  && imgUrlIdx >= 0) {
        // เก็บ Drive file ID ด้วย prefix "drive:" ใน imgUrl column เดิม — ไม่ต้องเพิ่ม column ใหม่
        sheet.getRange(i + 1, imgUrlIdx + 1).setValue('drive:' + imgId);
      } else if (imgUrl && imgUrlIdx >= 0) {
        sheet.getRange(i + 1, imgUrlIdx + 1).setValue(imgUrl);
      }
      return ok({ id: id, updated: true });
    }
  }
  return err('Employee not found: ' + id);
}

function joinStarGang(params) {
  var name = params.name;
  var role = params.role || '';

  if (!name) return err('name required');

  var sheet   = getSheet('Employees');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var nameIdx      = headers.indexOf('name');
  var inStarGangIdx = headers.indexOf('inStarGang');

  if (inStarGangIdx < 0) return err('inStarGang column not found');

  // Find by name and set inStarGang = TRUE
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][nameIdx]).toLowerCase() === String(name).toLowerCase()) {
      sheet.getRange(i + 1, inStarGangIdx + 1).setValue(true);
      return ok({ name: name, joined: true });
    }
  }

  // Not found: append new row
  var row = headers.map(function(h) {
    if (h === 'name')        return name;
    if (h === 'role')        return role;
    if (h === 'inStarGang')  return true;
    if (h === 'id')          return uuid();
    return '';
  });
  sheet.appendRow(row);
  return ok({ name: name, joined: true, created: true });
}
