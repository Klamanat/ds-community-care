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

  // ── 3. Kudos received (EmpathyComments where postId = user's empCode) ──
  if (employeeName) {
    try {
      var employees = cachedSheetRead('Employees', 600);
      var myEmp = null;
      for (var ei = 0; ei < employees.length; ei++) {
        if (String(employees[ei].name || '').trim() === employeeName) { myEmp = employees[ei]; break; }
      }
      var channelId = myEmp ? String(myEmp.empCode || myEmp.id || '') : '';
      if (channelId) {
        var allCmts = cachedSheetRead('EmpathyComments', 120);
        allCmts
          .filter(function(c) {
            return String(c.postId) === channelId &&
                   !c.parentId &&
                   String(c.authorName || '').trim() !== employeeName;
          })
          .slice(0, 10)
          .forEach(function(c) {
            var snippet = String(c.text || '').substring(0, 60);
            if (String(c.text || '').length > 60) snippet += '...';
            notifs.push({
              id:     'kudos_' + String(c.id),
              type:   'kudos',
              color:  '#F59E0B',
              title:  '💝 ' + String(c.authorName || 'เพื่อนร่วมงาน') + ' ส่งความรู้สึกดีๆ ให้คุณ!',
              msg:    snippet,
              time:   String(c.createdAt || ''),
              target: 'empathy_' + channelId,
            });
          });
      }
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

  // ── 5. Points earned (last 30 days) ─────────────────────────────────
  if (employeeName) {
    try {
      var pts     = cachedSheetRead('Points', 60);
      var cutoff  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      pts
        .filter(function(p) {
          return String(p.employeeName || '').trim() === employeeName &&
                 new Date(p.createdAt) > cutoff &&
                 Number(p.amount || 0) > 0;
        })
        .slice(0, 10)
        .forEach(function(p) {
          notifs.push({
            id:     'pts_' + String(p.id),
            type:   'points',
            color:  '#F59E0B',
            title:  '🏆 ได้รับ +' + Number(p.amount) + ' คะแนน',
            msg:    String(p.desc || p.type || ''),
            time:   String(p.createdAt || ''),
            target: 'reward',
          });
        });
    } catch(ex) {}
  }

  // ── 6. Activity stamps (joined activities) ───────────────────────────
  if (employeeName) {
    try {
      var joins = cachedSheetRead('ActivityJoins', 120);
      joins
        .filter(function(j) { return String(j.employeeName || '').trim() === employeeName; })
        .slice(0, 5)
        .forEach(function(j) {
          notifs.push({
            id:     'stamp_' + String(j.id),
            type:   'stamp',
            color:  '#6366F1',
            title:  '📍 เข้าร่วม ' + String(j.activityName || 'กิจกรรม') + ' สำเร็จ!',
            msg:    j.rewardClaimed ? 'รับรางวัลแล้ว ✅' : 'สะสมแสตมป์แล้ว',
            time:   String(j.stampedAt || ''),
            target: 'home',
          });
        });
    } catch(ex) {}
  }

  // Sort all notifs by time descending
  notifs.sort(function(a, b) {
    return new Date(b.time || 0) - new Date(a.time || 0);
  });

  return ok(notifs);
}
