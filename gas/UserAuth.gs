// UserAuth.gs — Employee login & first-time password setup
// Sheet "UserAuth": employeeId | passwordHash | token | tokenExpires

/**
 * POST: userLogin
 * params: { employeeId, password }
 * Returns: { token, employeeId, name, role }
 */
function userLogin(params) {
  var empId    = String(params.employeeId || '').trim();
  var password = String(params.password   || '').trim();
  if (!empId || !password) return err('กรุณากรอกข้อมูลให้ครบ');

  // Verify employee exists
  var emp = _getEmployee(empId);
  if (!emp) return err('ไม่พบพนักงาน');

  // Get auth row
  var authSheet = getSheet('UserAuth');
  var authData  = sheetToObjects(authSheet);
  var authRow   = null;
  for (var i = 0; i < authData.length; i++) {
    if (String(authData[i].employeeId) === empId) { authRow = authData[i]; break; }
  }

  if (!authRow || !authRow.passwordHash) return err('ยังไม่ได้ตั้งรหัสผ่าน');
  if (authRow.passwordHash !== sha256hex(password)) return err('รหัสผ่านไม่ถูกต้อง');

  // Generate token
  var token   = uuid();
  var expires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  // Write token back to sheet row
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var tokenCol   = headers.indexOf('token')        + 1;
  var expiresCol = headers.indexOf('tokenExpires') + 1;
  var rowNum     = _findAuthRow(authSheet, empId);
  if (rowNum > 0) {
    authSheet.getRange(rowNum, tokenCol).setValue(token);
    authSheet.getRange(rowNum, expiresCol).setValue(expires);
  }

  return ok({ token: token, employeeId: empId, name: emp.name, role: emp.role });
}

/**
 * POST: userSetPassword
 * params: { employeeId, password }
 * Allowed only if no password set yet.
 */
function userSetPassword(params) {
  var empId    = String(params.employeeId || '').trim();
  var password = String(params.password   || '').trim();
  if (!empId || !password) return err('กรุณากรอกข้อมูลให้ครบ');
  if (password.length < 6)  return err('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

  var emp = _getEmployee(empId);
  if (!emp) return err('ไม่พบพนักงาน');

  var authSheet = getSheet('UserAuth');
  var rowNum    = _findAuthRow(authSheet, empId);

  if (rowNum > 0) {
    // Check existing password
    var headers  = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    var hashCol  = headers.indexOf('passwordHash') + 1;
    var existing = authSheet.getRange(rowNum, hashCol).getValue();
    if (existing && existing !== '') return err('ตั้งรหัสผ่านไปแล้ว กรุณา login ด้วยรหัสเดิม');
    // Update
    authSheet.getRange(rowNum, hashCol).setValue(sha256hex(password));
  } else {
    // Append new row
    appendRow(authSheet, {
      employeeId:   empId,
      passwordHash: sha256hex(password),
      token:        '',
      tokenExpires: '',
    });
  }

  return ok({ message: 'ตั้งรหัสผ่านสำเร็จ' });
}

/**
 * GET: userCheckPassword
 * params: { employeeId }
 * Returns: { hasPassword: true/false }
 */
function userCheckPassword(params) {
  var empId = String(params.employeeId || '').trim();
  if (!empId) return err('ไม่ระบุ employeeId');

  var authSheet = getSheet('UserAuth');
  var rowNum    = _findAuthRow(authSheet, empId);
  if (rowNum <= 0) return ok({ hasPassword: false });

  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var hashCol = headers.indexOf('passwordHash') + 1;
  var hash    = authSheet.getRange(rowNum, hashCol).getValue();
  return ok({ hasPassword: !!hash });
}

/**
 * Internal: verify user token. Throws on invalid/expired.
 */
function verifyUserToken(token) {
  if (!token) throw new Error('ไม่มี token');
  var authSheet = getSheet('UserAuth');
  var data = sheetToObjects(authSheet);
  for (var i = 0; i < data.length; i++) {
    if (data[i].token === token) {
      if (Date.now() > Number(data[i].tokenExpires)) throw new Error('Token หมดอายุ กรุณา login ใหม่');
      return data[i];
    }
  }
  throw new Error('Token ไม่ถูกต้อง');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _getEmployee(empId) {
  var sheet = getSheet('Employees');
  var data  = sheetToObjects(sheet);
  for (var i = 0; i < data.length; i++) {
    if (String(data[i].id) === empId) return data[i];
  }
  return null;
}

function _findAuthRow(authSheet, empId) {
  if (authSheet.getLastRow() < 2) return -1;
  var values  = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === empId) return i + 2;
  }
  return -1;
}

function sha256hex(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return bytes.map(function(b) {
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}
