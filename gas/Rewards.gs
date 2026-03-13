// Rewards.gs — Points tracking system
// Sheet "Points": id | employeeName | type | amount | desc | createdAt
//
// Point values:
//   join_activity   : +50 pts  (เข้าร่วมกิจกรรม)
//   send_empathy    : +10 pts  (ส่ง Empathy ให้เพื่อน)
//   birthday_wish   : +5 pts   (อวยพรวันเกิดเพื่อน)
//
// Levels:
//   🌱 Newcomer  : 0–99 pts
//   ⭐ Member    : 100–299 pts
//   🔥 Active    : 300–599 pts
//   💎 Champion  : 600–999 pts
//   👑 Legend    : 1000+ pts

/**
 * Internal helper — called by other .gs files to award points.
 * Looks up pts from PointRules sheet (admin-configurable).
 * Does NOT return an HTTP response.
 * @param {string} employeeName
 * @param {string} type  — 'join_activity' | 'send_empathy' | 'birthday_wish'
 * @param {string} desc  — human-readable reason (e.g. activity name)
 */
function addPoints(employeeName, type, desc) {
  if (!employeeName) return;
  try {
    var rule   = _getRuleForType(type);
    if (!rule) return;
    var active = String(rule.active !== undefined ? rule.active : 'true').toLowerCase();
    if (active === 'false') return;
    var amount = parseInt(rule.pts, 10) || 0;
    if (!amount) return;
    var id        = uuid();
    var createdAt = formatDate(new Date());
    appendRow('Points', [id, employeeName, type, amount, desc || '', createdAt]);
    invalidateSheet('Points');
  } catch(ex) {
    Logger.log('addPoints error: ' + ex.message);
  }
}

/**
 * GET: getRewardRules — public endpoint, returns all rules for display in RewardModal
 */
function getRewardRules() {
  var rules = _allRules();
  return ok(rules);
}

/**
 * GET: adminUpdateRewardRule — token-gated
 * params: { token, id, icon, name, desc, pts, active }
 */
function adminUpdateRewardRule(params) {
  verifyToken(params.token);
  var sheet   = getSheet('PointRules');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return err('ไม่พบข้อมูล');

  var headers = data[0];
  var idIdx   = headers.indexOf('id');
  var rowNum  = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(params.id)) { rowNum = i + 1; break; }
  }
  if (rowNum < 0) return err('ไม่พบ rule id: ' + params.id);

  var EDITABLE = ['icon','name','desc','pts','active'];
  EDITABLE.forEach(function(field) {
    if (params[field] !== undefined) {
      var col = headers.indexOf(field) + 1;
      if (col > 0) sheet.getRange(rowNum, col).setValue(params[field]);
    }
  });
  invalidateSheet('PointRules');
  return ok({ updated: true });
}

/**
 * GET: getMyPoints
 * params: { employeeName }
 * Returns: { total, level, levelName, nextPts, nextName, history[] }
 */
function getMyPoints(params) {
  var employeeName = String(params.employeeName || '').trim();
  if (!employeeName) return ok({ total: 0, level: 0, levelName: '🌱 Newcomer', nextPts: 100, nextName: '⭐ Member', history: [] });

  var rows = cachedSheetRead('Points', 60);
  var mine = rows.filter(function(r) {
    return String(r.employeeName || '').trim() === employeeName;
  });

  mine.sort(function(a, b) {
    return String(b.createdAt) > String(a.createdAt) ? 1 : -1;
  });

  var total = mine.reduce(function(sum, r) {
    return sum + (parseInt(r.amount, 10) || 0);
  }, 0);

  var levelInfo = _getLevel(total);

  return ok({
    total:     total,
    level:     levelInfo.level,
    levelName: levelInfo.name,
    nextPts:   levelInfo.nextPts,
    nextName:  levelInfo.nextName,
    history:   mine.slice(0, 30).map(function(r) {
      return {
        id:        String(r.id        || ''),
        type:      String(r.type      || ''),
        amount:    parseInt(r.amount, 10) || 0,
        desc:      String(r.desc      || ''),
        createdAt: String(r.createdAt || ''),
      };
    }),
  });
}

function _getRuleForType(type) {
  try {
    var rules = _allRules();
    for (var i = 0; i < rules.length; i++) {
      if (String(rules[i].type) === String(type)) return rules[i];
    }
  } catch(e) {}
  // Fallback defaults if PointRules sheet is missing
  var DEFAULTS = {
    join_activity: { pts: 50, name: 'เข้าร่วมกิจกรรม', active: 'true' },
    send_empathy:  { pts: 10, name: 'ส่ง Empathy',       active: 'true' },
    birthday_wish: { pts: 5,  name: 'อวยพรวันเกิด',       active: 'true' },
  };
  return DEFAULTS[type] || null;
}

function _allRules() {
  return cachedSheetRead('PointRules', 300).map(function(r) {
    return {
      id:     String(r.id     || ''),
      type:   String(r.type   || ''),
      icon:   String(r.icon   || '⭐'),
      name:   String(r.name   || ''),
      desc:   String(r.desc   || ''),
      pts:    parseInt(r.pts, 10) || 0,
      active: String(r.active !== undefined ? r.active : 'true'),
    };
  });
}

function _getLevel(pts) {
  var levels = [
    { level: 0, name: '🌱 Newcomer', min: 0,    next: 100,  nextName: '⭐ Member'   },
    { level: 1, name: '⭐ Member',   min: 100,  next: 300,  nextName: '🔥 Active'   },
    { level: 2, name: '🔥 Active',   min: 300,  next: 600,  nextName: '💎 Champion' },
    { level: 3, name: '💎 Champion', min: 600,  next: 1000, nextName: '👑 Legend'   },
    { level: 4, name: '👑 Legend',   min: 1000, next: null, nextName: null          },
  ];
  var current = levels[0];
  for (var i = 0; i < levels.length; i++) {
    if (pts >= levels[i].min) current = levels[i];
  }
  return {
    level:    current.level,
    name:     current.name,
    nextPts:  current.next,
    nextName: current.nextName,
  };
}
