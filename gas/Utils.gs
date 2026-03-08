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
