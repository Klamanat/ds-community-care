// Notifications.gs — Generate notifications from existing sheet data
// GET: getNotifications
// params: { employeeName, monthIdx? }

function getNotifications(params) {
  var employeeName = String(params.employeeName || '').trim();
  var now       = new Date();
  var monthIdx  = parseInt(params.monthIdx || (now.getMonth() + 1), 10);
  var notifs    = [];

  // ── 1. Birthday notifications (this month) ──────────────────────────
  try {
    var bdays = cachedSheetRead('Birthdays', 300);
    bdays
      .filter(function(b) { return parseInt(b.monthIdx, 10) === monthIdx; })
      .forEach(function(b) {
        notifs.push({
          id:     'bday_' + String(b.key) + '_' + now.getFullYear() + '_' + monthIdx,
          type:   'birthday',
          color:  '#EC4899',
          title:  '🎂 วันเกิดของ ' + String(b.name || '') + ' เดือนนี้!',
          msg:    'อย่าลืมส่งคำอวยพรให้เพื่อนร่วมงานนะคะ 🎉',
          time:   String(b.date || ''),
          target: 'bday',
        });
      });
  } catch(ex) {}

  // ── 2. Activity notifications (this month) ──────────────────────────
  try {
    var activities = cachedSheetRead('Activities', 200);
    activities
      .filter(function(a) { return parseInt(a.monthIdx, 10) === monthIdx; })
      .forEach(function(a) {
        var detail = String(a.date || '');
        if (a.dateEnd) detail += ' – ' + String(a.dateEnd);
        if (a.loc)     detail += (detail ? ' • ' : '') + String(a.loc);
        if (!detail)   detail = String(a.desc || '').substring(0, 60);
        notifs.push({
          id:     'act_' + String(a.id),
          type:   'activity',
          color:  '#6366F1',
          title:  String(a.emoji || '🎊') + ' ' + String(a.name || 'กิจกรรมใหม่'),
          msg:    detail,
          time:   String(a.date || ''),
          target: 'month_' + monthIdx,
        });
      });
  } catch(ex) {}

  // ── 3. Kudos received (empathy posts) ───────────────────────────────
  if (employeeName) {
    try {
      var posts = cachedSheetRead('EmpathyPosts', 120);
      posts
        .filter(function(p) { return String(p.recName || '').trim() === employeeName; })
        .slice(0, 10)
        .forEach(function(p) {
          var snippet = String(p.msg || '').substring(0, 60);
          if (String(p.msg || '').length > 60) snippet += '...';
          var tagLabel = p.tag ? '[' + String(p.tag) + '] ' : '';
          notifs.push({
            id:     'kudos_' + String(p.id),
            type:   'kudos',
            color:  '#F59E0B',
            title:  '💝 ' + String(p.sndName || 'เพื่อนร่วมงาน') + ' ส่งความรู้สึกดีๆ ให้คุณ!',
            msg:    tagLabel + snippet,
            time:   String(p.createdAt || ''),
            target: 'empathy',
          });
        });
    } catch(ex) {}
  }

  // ── 4. Birthday wishes received ──────────────────────────────────────
  if (employeeName) {
    try {
      var bdayRows = cachedSheetRead('Birthdays', 300);
      var myBday = bdayRows.find(function(b) {
        return String(b.name || '').trim() === employeeName &&
               parseInt(b.monthIdx, 10) === monthIdx;
      });
      if (myBday) {
        var wishes = cachedSheetRead('BirthdayWishes', 60);
        var myWishes = wishes.filter(function(w) {
          return String(w.birthdayKey || '') === String(myBday.key || '') &&
                 parseInt(w.year, 10) === now.getFullYear();
        });
        if (myWishes.length > 0) {
          notifs.push({
            id:     'wishes_' + myBday.key + '_' + now.getFullYear(),
            type:   'wish',
            color:  '#EC4899',
            title:  '💌 คุณได้รับคำอวยพร ' + myWishes.length + ' ข้อความ!',
            msg:    'เพื่อนๆ ส่งคำอวยพรวันเกิดให้คุณค่ะ 🎉',
            time:   '',
            target: 'bday',
          });
        }
      }
    } catch(ex) {}
  }

  return ok(notifs);
}
