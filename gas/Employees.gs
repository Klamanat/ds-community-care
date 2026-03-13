// Employees.gs — Employees sheet handlers
// uploadImage() is defined in DriveUpload.gs

// Sheet: Employees
// Columns: id | name | role | dept | imgUrl | grad | inTeam | inStarGang | starGangName | starGangRole | starGangSlogan

function getEmployees(params) {
  var rows = cachedSheetRead('Employees', 600); // 10 min — employees change rarely

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

    // ถ้า imgUrl มี prefix "drive:" → ส่ง imgId กลับ ให้ frontend batch-fetch ผ่าน getImages
    var imgId2 = String(r.imgId || '');
    if (imgUrl.indexOf('drive:') === 0) {
      imgId2 = imgUrl.slice(6);
      imgUrl  = '';
    }

    return {
      id:           String(r.id      || ''),
      empCode:      String(r.empCode || ''),
      name:         String(r.name    || ''),
      role:         String(r.role    || ''),
      dept:         String(r.dept    || ''),
      imgUrl:       imgUrl,
      imgId:        imgId2,
      grad:         String(r.grad    || ''),
      inTeam:       r.inTeam === true || r.inTeam === 'TRUE',
      inStarGang:   r.inStarGang === true || r.inStarGang === 'TRUE',
      starGangName:   String(r.starGangName   || ''),
      starGangRole:   String(r.starGangRole   || ''),
      starGangSlogan: String(r.starGangSlogan || ''),
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
      invalidateSheet('Employees');
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
  invalidateSheet('Employees');
  return ok({ id: id, created: true });
}

function updateEmployeeSelf(params) {
  var id             = params.id;
  var name           = (params.name           || '').trim();
  var role           = (params.role           || '').trim();
  var dept           = (params.dept           || '').trim();
  var imgUrl         = (params.imgUrl         || '').trim();
  var imgId          = (params.imgId          || '').trim();
  var starGangSlogan = (params.starGangSlogan || '').trim();

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
        sheet.getRange(i + 1, imgUrlIdx + 1).setValue('drive:' + imgId);
      } else if (imgUrl && imgUrlIdx >= 0) {
        sheet.getRange(i + 1, imgUrlIdx + 1).setValue(imgUrl);
      }
      var sloganIdx = headers.indexOf('starGangSlogan');
      if (starGangSlogan !== '' && sloganIdx >= 0) sheet.getRange(i + 1, sloganIdx + 1).setValue(starGangSlogan);
      invalidateSheet('Employees');
      invalidateResult('people'); // profile image อาจเปลี่ยน
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
