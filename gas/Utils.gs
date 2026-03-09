// Utils.gs — shared helpers

/**
 * Generate a UUID v4-like string using Utilities.getUuid()
 */
function uuid() {
  return Utilities.getUuid();
}

/**
 * Get a sheet by name; throws if not found
 */
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/**
 * Append a row of values to the named sheet
 */
function appendRow(sheetName, values) {
  var sheet = getSheet(sheetName);
  sheet.appendRow(values);
}

/**
 * Read all rows from a sheet and return as array of objects
 * (first row = headers)
 */
function sheetToObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * Format a Date as Thai-locale string "DD/MM/YYYY HH:MM"
 */
function formatDate(date) {
  if (!date) return '';
  var d = new Date(date);
  return Utilities.formatDate(d, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
}

/**
 * Safely parse JSON parameter; return null if invalid
 */
function safeJson(str) {
  try { return JSON.parse(str); } catch(e) { return null; }
}

// ─── CacheService helpers ─────────────────────────────────────────────────────
// ScriptCache is SHARED across all GAS instances → 200 users share one cache.
// First request warms the cache; subsequent users get ~10ms response.
// ─────────────────────────────────────────────────────────────────────────────

var CACHE_TTL_SHEET = 300;   // 5 min  — read-heavy sheets
var CACHE_TTL_IMAGE = 3600;  // 60 min — Drive images rarely change

/**
 * Read sheet with shared script cache.
 * Falls back to direct sheetToObjects() on cache miss or parse error.
 */
function cachedSheetRead(sheetName, ttl) {
  var cache = CacheService.getScriptCache();
  var key   = 'sht_' + sheetName;
  var hit   = cache.get(key);
  if (hit) {
    try { return JSON.parse(hit); } catch(e) {}
  }
  var data = sheetToObjects(sheetName);
  try { cache.put(key, JSON.stringify(data), ttl || CACHE_TTL_SHEET); } catch(e) {}
  return data;
}

/**
 * Invalidate sheet cache — call after any write to a cached sheet.
 */
function invalidateSheet(sheetName) {
  CacheService.getScriptCache().remove('sht_' + sheetName);
}

/**
 * Cache a full computed result (e.g. getEmpathyPeople after joining sheets + images).
 * Avoids re-doing expensive multi-step computation on every request.
 */
function cacheResult(key, val, ttl) {
  try { CacheService.getScriptCache().put('res_' + key, JSON.stringify(val), ttl || 600); } catch(e) {}
}
function getCachedResult(key) {
  var hit = CacheService.getScriptCache().get('res_' + key);
  if (!hit) return null;
  try { return JSON.parse(hit); } catch(e) { return null; }
}
function invalidateResult(key) {
  CacheService.getScriptCache().remove('res_' + key);
}

/**
 * Fetch Drive image as base64, cached for 60 min per imgId.
 * Avoids re-fetching the same image on every request.
 */
function cachedDriveImage(imgId) {
  if (!imgId) return '';
  var cache = CacheService.getScriptCache();
  var key   = 'img_' + imgId;
  var hit   = cache.get(key);
  if (hit) return hit;
  try {
    var bytes = DriveApp.getFileById(imgId).getBlob().getBytes();
    var b64   = 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes);
    try { cache.put(key, b64, CACHE_TTL_IMAGE); } catch(e) {}
    return b64;
  } catch(e) { return ''; }
}

/**
 * App version — update this string when deploying new GAS builds
 */
var APP_VERSION = '2.1.0';

function getVersion() {
  return ok({ version: APP_VERSION });
}

/**
 * Success response wrapper
 */
function ok(data) {
  return { ok: true, data: data };
}

/**
 * Error response wrapper
 */
function err(msg) {
  return { ok: false, error: msg };
}
