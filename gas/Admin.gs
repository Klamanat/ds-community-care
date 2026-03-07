// Admin.gs — Admin authentication and CRUD management
// Sheet: Admins
// Columns: username | passwordHash | name | token | tokenExpires

// ─── SHA-256 helper ───────────────────────────────────────────────────────────
function sha256hex(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return bytes.map(function(b) {
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}

/**
 * Run this ONCE in GAS editor to create the initial admin account.
 * Change username/password/name before running.
 */
function setupAdmin() {
  var sheet = getSheet('Admins');
  var data  = sheet.getDataRange().getValues();
  // If headers not set, write them first
  if (!data[0] || data[0][0] !== 'username') {
    sheet.clearContents();
    sheet.appendRow(['username','passwordHash','name','token','tokenExpires']);
  }
  var hash = sha256hex('ds2026');
  sheet.appendRow(['admin', hash, 'Administrator', '', '']);
  Logger.log('Admin created. Hash of ds2026: ' + hash);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * login — POST body: { action, username, password }
 * Returns { token, name } on success.
 */
function login(params) {
  var username = String(params.username || '').trim();
  var password = String(params.password || '');
  if (!username || !password) return err('username and password required');

  var sheet   = getSheet('Admins');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var uIdx    = headers.indexOf('username');
  var hIdx    = headers.indexOf('passwordHash');
  var nIdx    = headers.indexOf('name');
  var tIdx    = headers.indexOf('token');
  var eIdx    = headers.indexOf('tokenExpires');

  var hash = sha256hex(password);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][uIdx]).toLowerCase() === username.toLowerCase()
        && String(data[i][hIdx]) === hash) {
      // Generate session token valid 24 h
      var token   = uuid();
      var expires = Date.now() + 24 * 60 * 60 * 1000;
      sheet.getRange(i + 1, tIdx + 1).setValue(token);
      sheet.getRange(i + 1, eIdx + 1).setValue(expires);
      return ok({ token: token, name: String(data[i][nIdx]) });
    }
  }
  return err('Invalid credentials');
}

/**
 * verifyToken — internal helper.
 * Returns the admin row or throws a GAS error (which doGet catches).
 */
function verifyToken(token) {
  if (!token) throw new Error('token required');
  var sheet   = getSheet('Admins');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var tIdx    = headers.indexOf('token');
  var eIdx    = headers.indexOf('tokenExpires');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][tIdx]) === String(token)) {
      var expires = Number(data[i][eIdx]);
      if (Date.now() > expires) throw new Error('Token expired');
      return data[i];
    }
  }
  throw new Error('Invalid token');
}

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

/**
 * adminGetAll — return all rows from a sheet (token-gated).
 * params: token, sheetName
 */
function adminGetAll(params) {
  verifyToken(params.token);
  var rows = sheetToObjects(params.sheetName);
  return ok(rows);
}

/**
 * adminUpdateRow — update one row identified by keyCol=keyVal.
 * params: token, sheetName, keyCol, keyVal, + any column=value pairs to update
 * Reserved param names (excluded from updates): token, sheetName, keyCol, keyVal, action
 */
function adminUpdateRow(params) {
  verifyToken(params.token);
  var sheetName = params.sheetName;
  var keyCol    = params.keyCol || 'id';
  var keyVal    = String(params.keyVal || '');

  var RESERVED = ['token','sheetName','keyCol','keyVal','action'];
  var updates  = {};
  Object.keys(params).forEach(function(k) {
    if (RESERVED.indexOf(k) < 0) updates[k] = params[k];
  });

  var sheet   = getSheet(sheetName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyIdx  = headers.indexOf(keyCol);
  if (keyIdx < 0) return err('Column not found: ' + keyCol);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyIdx]) === keyVal) {
      Object.keys(updates).forEach(function(col) {
        var cIdx = headers.indexOf(col);
        if (cIdx >= 0) sheet.getRange(i + 1, cIdx + 1).setValue(updates[col]);
      });
      return ok({ updated: true, key: keyVal });
    }
  }
  return err('Row not found: ' + keyVal);
}

/**
 * adminDeleteRow — delete a row identified by keyCol=keyVal.
 * params: token, sheetName, keyCol, keyVal
 */
function adminDeleteRow(params) {
  verifyToken(params.token);
  var keyCol = params.keyCol || 'id';
  var keyVal = String(params.keyVal || '');

  var sheet   = getSheet(params.sheetName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyIdx  = headers.indexOf(keyCol);
  if (keyIdx < 0) return err('Column not found: ' + keyCol);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyIdx]) === keyVal) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: true, key: keyVal });
    }
  }
  return err('Row not found: ' + keyVal);
}

/**
 * adminAddEmployee — append a new employee row.
 * params: token, id, name, role, dept, imgUrl, grad, inTeam, inStarGang, starGangName, starGangRole
 */
function adminAddEmployee(params) {
  verifyToken(params.token);
  var sheet   = getSheet('Employees');
  var headers = sheet.getDataRange().getValues()[0];

  var id = params.id || uuid();
  var row = headers.map(function(h) {
    if (h === 'id')          return id;
    if (h === 'name')        return params.name        || '';
    if (h === 'role')        return params.role        || '';
    if (h === 'dept')        return params.dept        || '';
    if (h === 'imgUrl')      return params.imgUrl      || '';
    if (h === 'grad')        return params.grad        || '';
    if (h === 'inTeam')      return params.inTeam === 'true' || params.inTeam === true;
    if (h === 'inStarGang')  return params.inStarGang === 'true' || params.inStarGang === true;
    if (h === 'starGangName') return params.starGangName || '';
    if (h === 'starGangRole') return params.starGangRole || '';
    return '';
  });
  sheet.appendRow(row);
  return ok({ created: true, id: id });
}

/**
 * adminUpdateIdea — update status (and optionally other fields) of an idea.
 * params: token, id, status (pending|approved|rejected)
 */
function adminUpdateIdea(params) {
  verifyToken(params.token);
  var allowed = ['pending','approved','rejected'];
  if (allowed.indexOf(params.status) < 0) return err('Invalid status');

  var sheet   = getSheet('Ideas');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx     = headers.indexOf('id');
  var statIdx   = headers.indexOf('status');
  if (idIdx < 0 || statIdx < 0) return err('Column not found');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(params.id)) {
      sheet.getRange(i + 1, statIdx + 1).setValue(params.status);
      return ok({ updated: true, id: params.id, status: params.status });
    }
  }
  return err('Idea not found: ' + params.id);
}

/**
 * adminDeletePost — delete an EmpathyPost and cascade-delete its Comments and Likes.
 * params: token, postId
 */
function adminDeletePost(params) {
  verifyToken(params.token);
  var postId = String(params.postId || '');
  if (!postId) return err('postId required');

  // Delete from EmpathyPosts
  _deleteRowsByCol('EmpathyPosts', 'id', postId);

  // Cascade: delete comments
  _deleteRowsByCol('EmpathyComments', 'postId', postId);

  // Cascade: delete likes
  _deleteRowsByCol('EmpathyLikes', 'postId', postId);

  return ok({ deleted: true, postId: postId });
}

/** Internal: delete all rows where col === val (reverse order to avoid index shift) */
function _deleteRowsByCol(sheetName, col, val) {
  try {
    var sheet   = getSheet(sheetName);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var cIdx    = headers.indexOf(col);
    if (cIdx < 0) return;
    // Traverse bottom-up so row deletion doesn't shift indices
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][cIdx]) === String(val)) sheet.deleteRow(i + 1);
    }
  } catch(e) { /* sheet might not exist yet */ }
}
