// Blog.gs — Internal Blog
// Sheet: BlogPosts  columns: id | title | body | category | authorName | authorId | createdAt

var BLOG_SHEET = 'BlogPosts';

// ── Read ─────────────────────────────────────────────────────────────────────

function getBlogPosts(params) {
  var rows = sheetToObjects(BLOG_SHEET);
  var category = params.category || '';
  if (category) {
    rows = rows.filter(function(r) { return r.category === category; });
  }
  rows.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return ok(rows);
}

// ── Write ─────────────────────────────────────────────────────────────────────

function addBlogPost(params) {
  var title      = (params.title      || '').trim();
  var body       = (params.body       || '').trim();
  var category   = (params.category   || 'other').trim();
  var authorName = (params.authorName || '').trim();
  var authorId   = (params.authorId   || '').trim();

  if (!title)  return err('title required');
  if (!body)   return err('body required');
  if (!authorId) return err('authorId required');

  var id  = uuid();
  var now = new Date().toISOString();
  appendRow(BLOG_SHEET, [id, title, body, category, authorName, authorId, now]);
  return ok({ id: id, title: title, body: body, category: category, authorName: authorName, authorId: authorId, createdAt: now });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

function adminDeleteBlogPost(params) {
  verifyToken(params.token);
  var id    = params.id;
  var sheet = getSheet(BLOG_SHEET);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ok({ deleted: id });
    }
  }
  return err('not found');
}

function adminUpdateBlogPost(params) {
  verifyToken(params.token);
  var id    = params.id;
  var sheet = getSheet(BLOG_SHEET);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var row = i + 1;
      var fields = { title: params.title, body: params.body, category: params.category };
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

function adminGetBlogPosts(params) {
  verifyToken(params.token);
  var rows = sheetToObjects(BLOG_SHEET);
  rows.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return ok(rows);
}
