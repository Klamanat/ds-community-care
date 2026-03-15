// Mental.gs — Mental Health Advisors
// Sheet: MentalAdvisors       — id | name | role | employeeId | url | order
// Sheet: ConsultationRequests — id | counselorEmployeeId | message | createdAt | isRead

function getMentalAdvisors() {
  try {
    var rows = cachedSheetRead('MentalAdvisors', 300);
    rows.sort(function(a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
    return ok(rows.map(function(r) {
      return {
        id:         String(r.id         || ''),
        name:       String(r.name       || ''),
        role:       String(r.role       || ''),
        employeeId: String(r.employeeId || ''),
        url:        String(r.url        || ''),
        order:      Number(r.order)     || 0,
      };
    }));
  } catch(e) {
    return ok([]); // sheet ยังไม่มี → คืน empty
  }
}

function adminAddMentalAdvisor(params) {
  verifyToken(params.token);
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MentalAdvisors');
  if (!sheet) {
    sheet = ss.insertSheet('MentalAdvisors');
    sheet.appendRow(['id', 'name', 'role', 'employeeId', 'url', 'order']);
  }
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];

  var id = uuid();
  var row = headers.map(function(h) {
    if (h === 'id')         return id;
    if (h === 'name')       return String(params.name       || '');
    if (h === 'role')       return String(params.role       || '');
    if (h === 'employeeId') return String(params.employeeId || '');
    if (h === 'url')        return '';
    if (h === 'order')      return Number(params.order)     || 0;
    return '';
  });
  sheet.appendRow(row);
  invalidateSheet('MentalAdvisors');
  return ok({ created: true, id: id });
}

function adminUpdateMentalAdvisor(params) {
  verifyToken(params.token);
  var id = String(params.id || '').trim();
  if (!id) return err('id required');

  var sheet   = getSheet('MentalAdvisors');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx   = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === id) {
      var fields = ['name', 'role', 'employeeId', 'url', 'order'];
      fields.forEach(function(col) {
        if (params[col] === undefined) return;
        var ci = headers.indexOf(col);
        if (ci < 0) return;
        sheet.getRange(i + 1, ci + 1).setValue(col === 'order' ? Number(params[col]) : String(params[col]));
      });
      invalidateSheet('MentalAdvisors');
      return ok({ updated: true });
    }
  }
  return err('Advisor not found: ' + id);
}

function adminDeleteMentalAdvisor(params) {
  verifyToken(params.token);
  var id = String(params.id || '').trim();
  if (!id) return err('id required');

  var sheet   = getSheet('MentalAdvisors');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx   = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === id) {
      sheet.deleteRow(i + 1);
      invalidateSheet('MentalAdvisors');
      return ok({ deleted: true });
    }
  }
  return err('Advisor not found: ' + id);
}

// ── Consultation Requests ─────────────────────────────────────────────────

function submitConsultRequest(params) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) {
      sheet = ss.insertSheet('ConsultationRequests');
      sheet.appendRow(['id', 'counselorEmployeeId', 'senderEmployeeId', 'message', 'createdAt', 'isRead', 'reply', 'repliedAt']);
    }
    // Ensure new columns exist (migrate old schema)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    ['senderEmployeeId', 'reply', 'repliedAt'].forEach(function(col) {
      if (headers.indexOf(col) < 0) {
        headers.push(col);
        sheet.getRange(1, headers.length).setValue(col);
      }
    });
    var id = uuid();
    var row = headers.map(function(h) {
      if (h === 'id')                  return id;
      if (h === 'counselorEmployeeId') return String(params.counselorEmployeeId || '');
      if (h === 'senderEmployeeId')    return String(params.senderEmployeeId    || '');
      if (h === 'message')             return String(params.message             || '');
      if (h === 'createdAt')           return new Date().toISOString();
      if (h === 'isRead')              return 'false';
      return '';
    });
    sheet.appendRow(row);
    return ok({ id: id });
  } catch(e) {
    return err(e.message);
  }
}

function getMyConsultRequests(params) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) return ok([]);
    var rows     = sheetToObjects('ConsultationRequests');
    var senderId = String(params.senderEmployeeId || '');
    var filtered = rows.filter(function(r) {
      return String(r.senderEmployeeId || '') === senderId;
    });
    filtered.sort(function(a, b) { return a.createdAt > b.createdAt ? -1 : 1; });
    // Enrich with counselor name
    var advisorMap = {};
    try {
      sheetToObjects('MentalAdvisors').forEach(function(a) {
        if (a.employeeId) advisorMap[String(a.employeeId)] = String(a.name || '');
      });
    } catch(e) {}
    return ok(filtered.map(function(r) {
      return {
        id:                  String(r.id                  || ''),
        counselorEmployeeId: String(r.counselorEmployeeId || ''),
        counselorName:       advisorMap[String(r.counselorEmployeeId)] || '—',
        message:             String(r.message             || ''),
        createdAt:           String(r.createdAt           || ''),
        reply:               String(r.reply               || ''),
        repliedAt:           String(r.repliedAt           || ''),
      };
    }));
  } catch(e) {
    return err(e.message);
  }
}

function addConsultReply(params) {
  try {
    var reply = String(params.reply || '').trim();
    if (!reply) return err('reply required');
    var requestId = String(params.requestId || '').trim();
    if (!requestId) return err('requestId required');
    // Validate counselor
    try {
      var advisors = sheetToObjects('MentalAdvisors');
      var ok_ = advisors.some(function(a) {
        return String(a.employeeId || '') === String(params.counselorEmployeeId || '');
      });
      if (!ok_) return err('Not authorized');
    } catch(e) {}
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) return err('Sheet not found');
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    // Ensure reply + repliedAt columns
    var replyIdx     = headers.indexOf('reply');
    var repliedAtIdx = headers.indexOf('repliedAt');
    if (replyIdx < 0) {
      replyIdx = headers.length;
      headers.push('reply');
      sheet.getRange(1, replyIdx + 1).setValue('reply');
    }
    if (repliedAtIdx < 0) {
      repliedAtIdx = headers.length;
      headers.push('repliedAt');
      sheet.getRange(1, repliedAtIdx + 1).setValue('repliedAt');
    }
    var idIdx     = headers.indexOf('id');
    var isReadIdx = headers.indexOf('isRead');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || '').trim() === requestId) {
        sheet.getRange(i + 1, replyIdx     + 1).setValue(reply);
        sheet.getRange(i + 1, repliedAtIdx + 1).setValue(new Date().toISOString());
        if (isReadIdx >= 0) sheet.getRange(i + 1, isReadIdx + 1).setValue('true');
        return ok({ ok: true });
      }
    }
    return err('Not found');
  } catch(e) {
    return err(e.message);
  }
}

function getConsultRequests(params) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) return ok([]);
    var rows        = sheetToObjects('ConsultationRequests');
    var counselorId = String(params.counselorEmployeeId || '');
    var filtered    = rows.filter(function(r) {
      return String(r.counselorEmployeeId || '') === counselorId;
    });
    filtered.sort(function(a, b) { return a.createdAt > b.createdAt ? -1 : 1; });
    // Never expose senderEmployeeId to counselor — keep anonymous
    return ok(filtered.map(function(r) {
      return {
        id:        String(r.id        || ''),
        message:   String(r.message   || ''),
        createdAt: String(r.createdAt || ''),
        isRead:    String(r.isRead    || 'false'),
        reply:     String(r.reply     || ''),
        repliedAt: String(r.repliedAt || ''),
      };
    }));
  } catch(e) {
    return err(e.message);
  }
}

function adminGetAllConsultRequests(params) {
  verifyToken(params.token);
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) return ok([]);
    var rows = sheetToObjects('ConsultationRequests');
    rows.sort(function(a, b) { return a.createdAt > b.createdAt ? -1 : 1; });
    // Enrich with advisor name
    var advisorMap = {};
    try {
      sheetToObjects('MentalAdvisors').forEach(function(a) {
        if (a.employeeId) advisorMap[String(a.employeeId)] = String(a.name || '');
      });
    } catch(e) {}
    return ok(rows.map(function(r) {
      return {
        id:                  String(r.id                  || ''),
        counselorEmployeeId: String(r.counselorEmployeeId || ''),
        counselorName:       advisorMap[String(r.counselorEmployeeId)] || '—',
        message:             String(r.message             || ''),
        createdAt:           String(r.createdAt           || ''),
        isRead:              String(r.isRead              || 'false'),
      };
    }));
  } catch(e) {
    return err(e.message);
  }
}

function markConsultRead(params) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ConsultationRequests');
    if (!sheet) return err('Sheet not found');
    var data      = sheet.getDataRange().getValues();
    var headers   = data[0];
    var idIdx     = headers.indexOf('id');
    var isReadIdx = headers.indexOf('isRead');
    if (isReadIdx < 0) return err('isRead column missing');
    var id = String(params.id || '');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]).trim() === id) {
        sheet.getRange(i + 1, isReadIdx + 1).setValue('true');
        return ok({ ok: true });
      }
    }
    return err('Not found');
  } catch(e) {
    return err(e.message);
  }
}
