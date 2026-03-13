// Rewards.gs — Points tracking system
// Sheet "Points":     id | employeeName | type | subtype | amount | desc | createdAt
// Sheet "PointRules": id | type | subtype | icon | name | desc | pts | color | active
//
// type + subtype uniquely identifies a rule. subtype='' is the default rule for a type.
//
// Levels:
//   🌱 Newcomer  : 0–99 pts
//   ⭐ Member    : 100–299 pts
//   🔥 Active    : 300–599 pts
//   💎 Champion  : 600–999 pts
//   👑 Legend    : 1000+ pts

/**
 * Internal helper — called by other .gs files to award points.
 * @param {string} employeeName
 * @param {string} type     — e.g. 'join_activity'
 * @param {string} subtype  — e.g. 'co_host', or '' for default
 * @param {string} desc     — human-readable reason
 */
function addPoints(employeeName, type, subtype, desc) {
  if (!employeeName) return;
  try {
    var rule   = _getRule(type, subtype || '');
    if (!rule) return;
    var active = String(rule.active !== undefined ? rule.active : 'true').toLowerCase();
    if (active === 'false') return;
    var amount = parseInt(rule.pts, 10) || 0;
    if (!amount) return;
    var id        = uuid();
    var createdAt = formatDate(new Date());
    appendRow('Points', [id, employeeName, type, subtype || '', amount, desc || '', createdAt]);
    invalidateSheet('Points');
  } catch(ex) {
    Logger.log('addPoints error: ' + ex.message);
  }
}

/**
 * GET: getRewardRules — public, returns all rules for display
 */
function getRewardRules() {
  return ok(_allRules());
}

/**
 * GET: adminAddRewardRule — token-gated
 * params: { token, type, subtype, icon, name, desc, pts, color, active }
 */
function adminAddRewardRule(params) {
  verifyToken(params.token);
  var type    = String(params.type    || '').trim();
  var subtype = String(params.subtype || '').trim();
  if (!type) return err('type required');

  // Uniqueness: type + subtype must not exist
  var existing = _allRules();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].type === type && existing[i].subtype === subtype) {
      return err('กฎ type="' + type + '" subtype="' + subtype + '" มีอยู่แล้ว');
    }
  }

  var id      = uuid();
  var sheet   = getSheet('PointRules');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    if (h === 'id')      return id;
    if (h === 'type')    return type;
    if (h === 'subtype') return subtype;
    if (h === 'icon')    return params.icon   || '⭐';
    if (h === 'name')    return params.name   || type;
    if (h === 'desc')    return params.desc   || '';
    if (h === 'pts')     return parseInt(params.pts, 10) || 0;
    if (h === 'color')   return params.color  || '#6366F1';
    if (h === 'active')  return params.active !== undefined ? params.active : 'true';
    return '';
  });
  sheet.appendRow(row);
  invalidateSheet('PointRules');
  return ok({ id: id, type: type, subtype: subtype });
}

/**
 * GET: adminUpdateRewardRule — token-gated
 * params: { token, id, icon, name, desc, pts, color, active }
 * Note: type and subtype are immutable (they are the key)
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

  var EDITABLE = ['icon','name','desc','pts','color','active'];
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
 * GET: adminDeleteRewardRule — token-gated
 * params: { token, id }
 */
function adminDeleteRewardRule(params) {
  verifyToken(params.token);
  var sheet   = getSheet('PointRules');
  var data    = sheet.getDataRange().getValues();
  if (data.length < 2) return err('ไม่พบข้อมูล');

  var headers = data[0];
  var idIdx   = headers.indexOf('id');
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIdx]) === String(params.id)) {
      sheet.deleteRow(i + 1);
      invalidateSheet('PointRules');
      return ok({ deleted: true });
    }
  }
  return err('ไม่พบ rule id: ' + params.id);
}

/**
 * GET: getMyPoints
 * params: { employeeName }
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
        subtype:   String(r.subtype   || ''),
        amount:    parseInt(r.amount, 10) || 0,
        desc:      String(r.desc      || ''),
        createdAt: String(r.createdAt || ''),
      };
    }),
  });
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function _getRule(type, subtype) {
  var normalizedSubtype = String(subtype || '').trim();
  try {
    var rules = _allRules();
    // Exact match: type + subtype
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].type === type && rules[i].subtype === normalizedSubtype) return rules[i];
    }
    // Fallback: same type, empty subtype (default rule)
    if (normalizedSubtype) {
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].type === type && rules[j].subtype === '') return rules[j];
      }
    }
  } catch(e) {}
  // Hardcoded defaults if PointRules sheet is missing
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
      id:      String(r.id      || ''),
      type:    String(r.type    || ''),
      subtype: String(r.subtype || ''),
      icon:    String(r.icon    || '⭐'),
      name:    String(r.name    || ''),
      desc:    String(r.desc    || ''),
      pts:     parseInt(r.pts, 10) || 0,
      color:   String(r.color   || '#6366F1'),
      active:  String(r.active !== undefined ? r.active : 'true'),
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
  return { level: current.level, name: current.name, nextPts: current.next, nextName: current.nextName };
}
