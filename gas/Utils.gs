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
//
// CacheService limit: 100KB per key, ~1MB total.
// Chunked cache splits large JSON across multiple 90KB keys to handle 10K+ rows.
// ─────────────────────────────────────────────────────────────────────────────

var CACHE_TTL_SHEET = 300;   // 5 min  — read-heavy sheets
var CACHE_TTL_IMAGE = 3600;  // 60 min — Drive images rarely change
var CACHE_CHUNK_SIZE = 90000; // 90KB per chunk — below 100KB CacheService limit

/**
 * Read sheet with chunked shared script cache.
 * Splits JSON across multiple cache keys to handle 10K+ rows (>100KB).
 */
function cachedSheetRead(sheetName, ttl) {
  if (ttl === 0) return sheetToObjects(sheetName); // bypass cache explicitly

  var cache   = CacheService.getScriptCache();
  var metaKey = 'sht_' + sheetName;

  // Try reading chunked cache
  var meta = cache.get(metaKey);
  if (meta) {
    try {
      var m = JSON.parse(meta);
      if (m.n === 0) return []; // empty sheet cached
      var parts = [];
      var keys  = [];
      for (var i = 0; i < m.n; i++) keys.push(metaKey + '_' + i);
      var got = cache.getAll(keys);
      var ok  = true;
      for (var j = 0; j < keys.length; j++) {
        if (!got[keys[j]]) { ok = false; break; }
        parts.push(got[keys[j]]);
      }
      if (ok) return JSON.parse(parts.join(''));
    } catch(e) {}
  }

  // Cache miss — read from Sheets
  var data = sheetToObjects(sheetName);
  var json = JSON.stringify(data);
  var n    = Math.ceil(json.length / CACHE_CHUNK_SIZE) || 0;
  var ttlVal = ttl || CACHE_TTL_SHEET;

  try {
    var toStore = {};
    toStore[metaKey] = JSON.stringify({ n: n });
    for (var k = 0; k < n; k++) {
      toStore[metaKey + '_' + k] = json.slice(k * CACHE_CHUNK_SIZE, (k + 1) * CACHE_CHUNK_SIZE);
    }
    cache.putAll(toStore, ttlVal);
  } catch(e) {}

  return data;
}

/**
 * Invalidate sheet cache — call after any write to a cached sheet.
 */
function invalidateSheet(sheetName) {
  var cache   = CacheService.getScriptCache();
  var metaKey = 'sht_' + sheetName;
  var meta    = cache.get(metaKey);
  var toRemove = [metaKey];
  if (meta) {
    try {
      var m = JSON.parse(meta);
      for (var i = 0; i < m.n; i++) toRemove.push(metaKey + '_' + i);
    } catch(e) {}
  }
  cache.removeAll(toRemove);
}

/**
 * Cache a computed result — chunked to handle results larger than 100KB.
 * Uses same chunk strategy as cachedSheetRead.
 */
function cacheResult(key, val, ttl) {
  var cache    = CacheService.getScriptCache();
  var metaKey  = 'res_' + key;
  var json     = JSON.stringify(val);
  var n        = Math.ceil(json.length / CACHE_CHUNK_SIZE) || 0;
  var ttlVal   = ttl || 600;
  try {
    var toStore  = {};
    toStore[metaKey] = JSON.stringify({ n: n });
    for (var k = 0; k < n; k++) {
      toStore[metaKey + '_' + k] = json.slice(k * CACHE_CHUNK_SIZE, (k + 1) * CACHE_CHUNK_SIZE);
    }
    cache.putAll(toStore, ttlVal);
  } catch(e) {}
}

function getCachedResult(key) {
  var cache   = CacheService.getScriptCache();
  var metaKey = 'res_' + key;
  var meta    = cache.get(metaKey);
  if (!meta) return null;
  try {
    var m = JSON.parse(meta);
    if (m.n === 0) return null;
    var parts = [];
    var keys  = [];
    for (var i = 0; i < m.n; i++) keys.push(metaKey + '_' + i);
    var got   = cache.getAll(keys);
    for (var j = 0; j < keys.length; j++) {
      if (!got[keys[j]]) return null;
      parts.push(got[keys[j]]);
    }
    return JSON.parse(parts.join(''));
  } catch(e) { return null; }
}

function invalidateResult(key) {
  var cache   = CacheService.getScriptCache();
  var metaKey = 'res_' + key;
  var meta    = cache.get(metaKey);
  var toRemove = [metaKey];
  if (meta) {
    try {
      var m = JSON.parse(meta);
      for (var i = 0; i < m.n; i++) toRemove.push(metaKey + '_' + i);
    } catch(e) {}
  }
  cache.removeAll(toRemove);
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
 * getImages — batch proxy for Drive images. Called by frontend after page renders.
 * params: { imgIds: "id1,id2,id3" }
 * Uses cachedDriveImage (ScriptCache 60 min) per image — fast after first load.
 */
function getImages(params) {
  var ids = String(params.imgIds || '').split(',')
    .map(function(s) { return s.trim(); }).filter(Boolean);
  var result = {};
  ids.forEach(function(imgId) { result[imgId] = cachedDriveImage(imgId); });
  return ok(result);
}

/**
 * saveAnnouncement — upserts ann_* keys in the "Settings" sheet.
 * Params (GET): token, enabled ('TRUE'/'FALSE'), id, title, video, desc
 * Auto-creates the Settings sheet with key/value columns if missing.
 */
function saveAnnouncement(params) {
  verifyToken(params.token);

  var updates = {
    ann_enabled: String(params.enabled || 'FALSE'),
    ann_id:      String(params.id      || ''),
    ann_title:   String(params.title   || ''),
    ann_video:   String(params.video   || ''),
    ann_desc:    String(params.desc    || ''),
  };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Settings');

  // Auto-create sheet if missing
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['key', 'value']);
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyIdx  = headers.indexOf('key');
  var valIdx  = headers.indexOf('value');

  // Ensure columns exist
  if (keyIdx < 0) { sheet.getRange(1, 1).setValue('key');   keyIdx = 0; }
  if (valIdx < 0) { sheet.getRange(1, 2).setValue('value'); valIdx = 1; }

  var touched = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][keyIdx] || '').trim();
    if (k in updates) {
      sheet.getRange(i + 1, valIdx + 1).setValue(updates[k]);
      touched[k] = true;
    }
  }

  // Append keys not yet in sheet
  Object.keys(updates).forEach(function(k) {
    if (!touched[k]) {
      var row = [];
      row[keyIdx] = k;
      row[valIdx] = updates[k];
      sheet.appendRow(row);
    }
  });

  invalidateSheet('Settings');
  return ok({ saved: true });
}

/**
 * getAnnouncement — reads key-value rows from "Settings" sheet.
 * Expected rows (column A = key, column B = value):
 *   ann_enabled  | TRUE
 *   ann_id       | ann_2026_03_13
 *   ann_title    | หัวข้อประกาศ
 *   ann_video    | https://youtu.be/xxxxx
 *   ann_desc     | รายละเอียด...
 *
 * Returns null data if ann_enabled != TRUE or sheet missing.
 */
function getAnnouncement() {
  try {
    var rows = sheetToObjects('Settings');
    var kv   = {};
    rows.forEach(function(r) {
      var k = String(r['key'] || r['Key'] || '').trim();
      var v = String(r['value'] || r['Value'] || '').trim();
      if (k) kv[k] = v;
    });

    if (String(kv['ann_enabled'] || '').toUpperCase() !== 'TRUE') return ok(null);

    return ok({
      id:       kv['ann_id']    || '',
      title:    kv['ann_title'] || '',
      videoUrl: kv['ann_video'] || '',
      desc:     kv['ann_desc']  || '',
    });
  } catch(e) {
    return ok(null); // Settings sheet not found → no announcement
  }
}

/**
 * getVideoUrl — แปลง Drive file ID เป็น direct download URL
 * params: { fileId }
 * Drive ออก URL ที่ browser โหลดได้โดยตรงโดยไม่ผ่านหน้า confirm
 */
function getVideoUrl(params) {
  var fileId = String(params.fileId || '').trim();
  if (!fileId) return err('fileId required');
  try {
    var file = DriveApp.getFileById(fileId);
    var url  = 'https://drive.google.com/uc?id=' + fileId + '&export=download&confirm=t';
    return ok({ url: url, name: file.getName(), mimeType: file.getMimeType() });
  } catch(e) {
    return err('ไม่สามารถเข้าถึงไฟล์: ' + e.message);
  }
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
