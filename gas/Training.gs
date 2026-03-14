// Training.gs — Training courses + registrations
// Sheet: Trainings
// Columns: id | category | title | description | instructor | location | date | capacity | status | createdAt
//
// Sheet: TrainingRegistrations
// Columns: id | trainingId | employeeId | employeeName | registeredAt

function getTrainings(params) {
  var rows = sheetToObjects('Trainings');

  var category = (params && params.category) || '';
  if (category && category !== 'all') {
    rows = rows.filter(function(r) { return r.category === category; });
  }

  rows = rows.filter(function(r) { return r.status !== 'cancelled'; });
  rows.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  var regs = [];
  try { regs = sheetToObjects('TrainingRegistrations'); } catch(e) {}

  return ok(rows.map(function(r) {
    var count = regs.filter(function(reg) { return String(reg.trainingId) === String(r.id); }).length;
    return {
      id:          String(r.id || ''),
      category:    String(r.category || ''),
      title:       String(r.title || ''),
      description: String(r.description || ''),
      instructor:  String(r.instructor || ''),
      location:    String(r.location || ''),
      date:        String(r.date || ''),
      capacity:    Number(r.capacity || 0),
      joinCount:   count,
      status:      String(r.status || 'open'),
      courseUrl:   String(r.courseUrl || ''),
      createdAt:   String(r.createdAt || ''),
    };
  }));
}

function registerTraining(params) {
  var trainingId   = params.trainingId;
  var employeeId   = params.employeeId;
  var employeeName = params.employeeName || 'ไม่ระบุ';

  if (!trainingId || !employeeId) return err('trainingId and employeeId required');

  var regs = [];
  try { regs = sheetToObjects('TrainingRegistrations'); } catch(e) { return err('registration_unavailable'); }
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
  try { appendRow('TrainingRegistrations', [id, trainingId, employeeId, employeeName, registeredAt]); } catch(e) { return err('registration_unavailable'); }

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

// ── Admin CRUD ───────────────────────────────────────────────────────────────

function adminAddTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var id = uuid();
  var category    = (params.category    || '').trim();
  var title       = (params.title       || '').trim();
  var description = (params.description || '').trim();
  var instructor  = (params.instructor  || '').trim();
  var location    = (params.location    || '').trim();
  var date        = (params.date        || '').trim();
  var capacity    = Number(params.capacity || 0);
  var status      = (params.status      || 'open').trim();
  var courseUrl   = (params.courseUrl   || '').trim();
  var createdAt   = formatDate(new Date());

  if (!title) return err('title required');

  appendRow('Trainings', [id, category, title, description, instructor, location, date, capacity, status, courseUrl, createdAt]);
  return ok({ id: id, category: category, title: title, description: description, instructor: instructor, location: location, date: date, capacity: capacity, status: status, courseUrl: courseUrl, createdAt: createdAt });
}

function adminUpdateTraining(params) {
  if (!checkAdminToken(params.token)) return err('Unauthorized');

  var id = params.id;
  if (!id) return err('id required');

  var sheet   = getSheet('Trainings');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var EDITABLE = ['category','title','description','instructor','location','date','capacity','status','courseUrl'];

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

// ── Helper ───────────────────────────────────────────────────────────────────

function checkAdminToken(token) {
  if (!token) return false;
  var admins = sheetToObjects('Admins');
  var now    = new Date().getTime();
  return admins.some(function(a) {
    return a.token === token && new Date(a.tokenExpires).getTime() > now;
  });
}
