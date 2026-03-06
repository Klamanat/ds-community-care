// Employees.gs — Employees sheet handlers
// Sheet: Employees
// Columns: id | name | role | dept | imgUrl | grad | inTeam | inStarGang | starGangName | starGangRole

function getEmployees(params) {
  var rows = sheetToObjects('Employees');

  // Optional filters
  var inTeam      = params.inTeam;
  var inStarGang  = params.inStarGang;

  if (inTeam === 'true') {
    rows = rows.filter(function(r) { return r.inTeam === true || r.inTeam === 'TRUE'; });
  }
  if (inStarGang === 'true') {
    rows = rows.filter(function(r) { return r.inStarGang === true || r.inStarGang === 'TRUE'; });
  }

  var employees = rows.map(function(r) {
    return {
      id:           String(r.id || ''),
      name:         String(r.name || ''),
      role:         String(r.role || ''),
      dept:         String(r.dept || ''),
      imgUrl:       String(r.imgUrl || ''),
      grad:         String(r.grad || ''),
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
