// Idp.gs — IDP Posters & Videos
// Sheet: IdpPosters  columns: id | title | imageUrl | description | date | createdAt
// Sheet: IdpVideos   columns: id | title | videoUrl | description | createdAt

var IDP_POSTER_SHEET = 'IdpPosters';
var IDP_VIDEO_SHEET  = 'IdpVideos';

// ── Posters ───────────────────────────────────────────────────────────────────

function getIdpPosters() {
  var rows = sheetToObjects(IDP_POSTER_SHEET);
  rows.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return ok(rows);
}

function adminAddIdpPoster(params) {
  verifyToken(params.token);
  var title       = (params.title       || '').trim();
  var imageUrl    = (params.imageUrl    || '').trim();
  var description = (params.description || '').trim();
  var date        = (params.date        || '').trim();

  if (!title)    return err('title required');
  if (!imageUrl) return err('imageUrl required');

  var id  = uuid();
  var now = new Date().toISOString();
  appendRow(IDP_POSTER_SHEET, [id, title, imageUrl, description, date, now]);
  return ok({ id: id, title: title, imageUrl: imageUrl, description: description, date: date, createdAt: now });
}

function adminUpdateIdpPoster(params) {
  verifyToken(params.token);
  var id      = params.id;
  var sheet   = getSheet(IDP_POSTER_SHEET);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var row    = i + 1;
      var fields = { title: params.title, imageUrl: params.imageUrl, description: params.description, date: params.date };
      Object.keys(fields).forEach(function(key) {
        if (fields[key] !== undefined) {
          var col = headers.indexOf(key);
          if (col !== -1) sheet.getRange(row, col + 1).setValue(fields[key]);
        }
      });
      return ok({ updated: id });
    }
  }
  return err('not found');
}

function adminDeleteIdpPoster(params) {
  verifyToken(params.token);
  var id    = params.id;
  var sheet = getSheet(IDP_POSTER_SHEET);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: id });
    }
  }
  return err('not found');
}

// ── Videos ────────────────────────────────────────────────────────────────────

function getIdpVideos() {
  var rows = sheetToObjects(IDP_VIDEO_SHEET);
  rows.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return ok(rows);
}

function adminAddIdpVideo(params) {
  verifyToken(params.token);
  var title       = (params.title       || '').trim();
  var videoUrl    = (params.videoUrl    || '').trim();
  var description = (params.description || '').trim();

  if (!title)    return err('title required');
  if (!videoUrl) return err('videoUrl required');

  var id  = uuid();
  var now = new Date().toISOString();
  appendRow(IDP_VIDEO_SHEET, [id, title, videoUrl, description, now]);
  return ok({ id: id, title: title, videoUrl: videoUrl, description: description, createdAt: now });
}

function adminUpdateIdpVideo(params) {
  verifyToken(params.token);
  var id      = params.id;
  var sheet   = getSheet(IDP_VIDEO_SHEET);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var row    = i + 1;
      var fields = { title: params.title, videoUrl: params.videoUrl, description: params.description };
      Object.keys(fields).forEach(function(key) {
        if (fields[key] !== undefined) {
          var col = headers.indexOf(key);
          if (col !== -1) sheet.getRange(row, col + 1).setValue(fields[key]);
        }
      });
      return ok({ updated: id });
    }
  }
  return err('not found');
}

function adminDeleteIdpVideo(params) {
  verifyToken(params.token);
  var id    = params.id;
  var sheet = getSheet(IDP_VIDEO_SHEET);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: id });
    }
  }
  return err('not found');
}
