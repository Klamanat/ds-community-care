// Ideas.gs — Ideas sheet handlers
// Sheet: Ideas
// Columns: id | category | title | detail | submitterName | createdAt | status

function getIdeas(params) {
  var rows = sheetToObjects('Ideas');

  // Optional: filter by category
  var category = params.category;
  if (category && category !== 'all') {
    rows = rows.filter(function(r) { return r.category === category; });
  }

  // Sort newest first
  rows.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  var ideas = rows.map(function(r) {
    return {
      id:            String(r.id || ''),
      category:      String(r.category || ''),
      title:         String(r.title || ''),
      detail:        String(r.detail || ''),
      submitterName: String(r.submitterName || ''),
      createdAt:     String(r.createdAt || ''),
      status:        String(r.status || 'pending'),
    };
  });

  return ok(ideas);
}

function submitIdea(params) {
  var category      = params.category;
  var title         = params.title;
  var detail        = params.detail || '';
  var submitterName = params.submitterName || 'ไม่ระบุ';

  if (!category) return err('category required');
  if (!title)    return err('title required');

  var id        = uuid();
  var createdAt = formatDate(new Date());
  var status    = 'pending';

  appendRow('Ideas', [id, category, title, detail, submitterName, createdAt, status]);

  return ok({ id: id, category: category, title: title, detail: detail, submitterName: submitterName, createdAt: createdAt, status: status });
}
