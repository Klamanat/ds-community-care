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
