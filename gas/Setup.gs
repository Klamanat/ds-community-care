// Setup.gs — รันครั้งเดียวเพื่อสร้าง sheets + seed ข้อมูลเริ่มต้น
// วิธีใช้: เปิด GAS editor → เลือกฟังก์ชัน setupAll → กด Run
//
// ฟังก์ชันทั้งหมด:
//   setupAll()                    — ครั้งแรก: สร้างทุก sheet + seed + admin (safe to re-run)
//   addMissingSheets()            — เพิ่มเฉพาะ sheet ที่ยังไม่มี (ใช้เมื่อเพิ่ม feature ใหม่)
//   addMissingColumns()           — เพิ่ม column ที่ขาดใน sheet ที่มีอยู่แล้ว (safe to re-run)
//   deleteOldSheets()             — ลบ sheet เก่าที่ไม่ใช้แล้ว (Trainings, EmpathyPosts) ⚠️ ลบถาวร
//   cleanUnusedSheetsAndColumns() — ลบ sheet + column ที่ไม่ได้ใช้ออก ⚠️ ลบข้อมูลจริง
//   forceResetSheet(name)         — ลบ sheet แล้วสร้างใหม่พร้อม header ⚠️ ลบข้อมูลทั้งหมด
//   setupSheets()                 — สร้าง/อัปเดต header ทุก sheet (idempotent)
//   setupAdmin()                  — สร้าง admin account (ข้ามถ้ามีแล้ว)
//   seedEmployees()               — seed พนักงานตัวอย่าง (ข้ามถ้ามีแล้ว)
//   seedBirthdays()               — seed วันเกิดตัวอย่าง (ข้ามถ้ามีแล้ว)

/**
 * forceResetSheet(name) — ลบ sheet แล้วสร้างใหม่พร้อม header จาก ALL_SHEETS
 * ⚠️ ลบข้อมูลทั้งหมดใน sheet นั้น
 * วิธีใช้: เรียกจาก GAS editor เช่น forceResetSheet('SiteVisits')
 *           หรือสร้าง wrapper function แล้วกด Run
 */
function forceResetSheet(name) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var def = ALL_SHEETS.find(function(d) { return d.name === name; });
  if (!def) {
    Logger.log('❌ ไม่พบ definition ของ "' + name + '" ใน ALL_SHEETS');
    return;
  }

  // ลบ sheet ที่มีอยู่
  var existing = ss.getSheetByName(name);
  if (existing) {
    // ถ้าเป็น sheet สุดท้าย ต้องสร้าง temp ก่อนลบ
    if (ss.getNumSheets() <= 1) {
      var temp = ss.insertSheet('_temp_reset_');
      ss.deleteSheet(existing);
      existing = temp; // จะถูก rename ด้านล่าง — จริงๆ เราสร้างใหม่แทน
      temp.setName(name);
      // clear temp content ถ้ามี
      temp.clearContents();
    } else {
      ss.deleteSheet(existing);
    }
    Logger.log('🗑️ ลบแล้ว: ' + name);
  }

  // สร้างใหม่ (เฉพาะกรณีที่ยังไม่มี sheet ชื่อ name อยู่)
  if (!ss.getSheetByName(name)) {
    var sheet = ss.insertSheet(name);
    sheet.appendRow(def.headers);
    var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4F46E5');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    for (var i = 1; i <= def.headers.length; i++) sheet.setColumnWidth(i, 140);
    Logger.log('✅ สร้างใหม่: ' + name + ' — ' + def.headers.length + ' columns');
  } else {
    // กรณี temp renamed แล้ว ให้ใส่ header
    var sheet = ss.getSheetByName(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);
      var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4F46E5');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      for (var i = 1; i <= def.headers.length; i++) sheet.setColumnWidth(i, 140);
      Logger.log('✅ สร้างใหม่ (temp): ' + name + ' — ' + def.headers.length + ' columns');
    }
  }
}

// Convenience wrappers — เรียกจาก GAS editor ได้เลย (เลือก function แล้วกด Run)
function forceResetSiteVisits()           { forceResetSheet('SiteVisits'); }
function forceResetSiteVotes()            { forceResetSheet('SiteVotes'); }
function forceResetAnnualTrainings()      { forceResetSheet('AnnualTrainings'); }
function forceResetIdpTrainings()         { forceResetSheet('IdpTrainings'); }
function forceResetExternalTrainings()    { forceResetSheet('ExternalTrainings'); }
function forceResetCompulsoryTrainings()  { forceResetSheet('CompulsoryTrainings'); }
function forceResetSuperskillsTrainings() { forceResetSheet('SuperskillsTrainings'); }
function forceResetLeadershipTrainings()  { forceResetSheet('LeadershipTrainings'); }
function forceResetTrainingRegistrations(){ forceResetSheet('TrainingRegistrations'); }
function forceResetTrainingReviews()      { forceResetSheet('TrainingReviews'); }
function forceResetIdpPosters()           { forceResetSheet('IdpPosters'); }
function forceResetIdpVideos()            { forceResetSheet('IdpVideos'); }

/**
 * deleteOldSheets() — ลบ sheet เก่าที่ถูกแทนที่โดย schema ใหม่
 * ⚠️ ลบข้อมูลถาวร — รันครั้งเดียวหลัง migrate เสร็จ
 *
 * รายการที่ลบ:
 *   Trainings       — แทนที่ด้วย AnnualTrainings / IdpTrainings / ... (7 sheets)
 *   EmpathyPosts    — ย้ายเป็น EmpathyComments + EmpathyLikes
 */
function deleteOldSheets() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var targets = ['Trainings', 'EmpathyPosts'];

  targets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log('ไม่พบ sheet: ' + name + ' (ข้าม)');
      return;
    }
    if (ss.getNumSheets() <= 1) {
      Logger.log('⚠️ ข้าม ' + name + ' — ต้องมีอย่างน้อย 1 sheet');
      return;
    }
    ss.deleteSheet(sheet);
    Logger.log('🗑️ ลบแล้ว: ' + name);
  });

  Logger.log('✅ deleteOldSheets เสร็จ');
}

// compat alias สำหรับชื่อเดิม
function deleteUnusedSheets() { deleteOldSheets(); }

/**
 * cleanUnusedSheetsAndColumns() — ลบ sheet และ column ที่ไม่ได้นิยามใน ALL_SHEETS
 * ⚠️  ลบข้อมูลจริง — ตรวจสอบ ALL_SHEETS ให้ครบก่อนรัน
 * ปลอดภัย re-run ได้ — ลบเฉพาะสิ่งที่ไม่อยู่ใน definition
 */
function cleanUnusedSheetsAndColumns() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var defined = ALL_SHEETS.map(function(d) { return d.name; });

  // ── 1. ลบ sheet ที่ไม่อยู่ใน ALL_SHEETS ────────────────────────
  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (defined.indexOf(name) === -1) {
      // ป้องกันลบ sheet สุดท้าย (Google Sheets ต้องมีอย่างน้อย 1 sheet)
      if (ss.getNumSheets() > 1) {
        ss.deleteSheet(sheet);
        Logger.log('🗑️ ลบ sheet: ' + name);
      } else {
        Logger.log('⚠️ ข้าม (sheet สุดท้าย): ' + name);
      }
    }
  });

  // ── 2. ลบ column ที่ไม่อยู่ใน headers ของแต่ละ sheet ──────────
  ALL_SHEETS.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet || sheet.getLastColumn() === 0) return;

    var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // ลบจากขวาไปซ้าย เพื่อไม่ให้ index เลื่อน
    for (var col = existing.length; col >= 1; col--) {
      var colName = String(existing[col - 1]).trim();
      if (colName !== '' && def.headers.indexOf(colName) === -1) {
        sheet.deleteColumn(col);
        Logger.log('🗑️ ลบ column "' + colName + '" จาก ' + def.name);
      }
    }
  });

  Logger.log('✅ cleanUnusedSheetsAndColumns เสร็จ');
}

/**
 * addMissingColumns() — เพิ่ม column ที่ขาดใน sheet ที่มีข้อมูลอยู่แล้ว
 * ปลอดภัย re-run ได้ — ถ้า column มีแล้วจะข้าม
 * รันหลังจากเพิ่ม field ใหม่ใน ALL_SHEETS definitions
 */
function addMissingColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ALL_SHEETS.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet || sheet.getLastRow() === 0) return;

    var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    def.headers.forEach(function(col) {
      if (existing.indexOf(col) >= 0) return; // มีแล้ว

      // เพิ่ม column ใหม่ท้ายสุด
      var newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(col);
      sheet.getRange(1, newCol).setFontWeight('bold')
                               .setBackground('#4F46E5')
                               .setFontColor('#FFFFFF');
      sheet.setColumnWidth(newCol, 140);
      Logger.log('✅ เพิ่ม column "' + col + '" ใน ' + def.name);
    });
  });

  Logger.log('✅ addMissingColumns เสร็จ');
}

/**
 * รันทุกอย่างในครั้งเดียว — ปลอดภัย re-run ได้
 */
function setupAll() {
  setupSheets();
  setupAdmin();
  seedEmployees();
  seedBirthdays();
  seedPointRules();
  Logger.log('✅ Setup เสร็จสมบูรณ์ — ดูผลใน Spreadsheet');
}

/**
 * addMissingSheets() — สร้างเฉพาะ sheet ที่ยังไม่มีใน Spreadsheet
 * ใช้เมื่อเพิ่ม feature ใหม่ที่ต้องการ sheet ใหม่
 * ไม่กระทบ sheet หรือข้อมูลที่มีอยู่แล้ว
 */
function addMissingSheets() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var created = 0;

  ALL_SHEETS.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (sheet) {
      Logger.log('✓ มีแล้ว: ' + def.name);
      return;
    }
    sheet = ss.insertSheet(def.name);
    sheet.appendRow(def.headers);

    var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4F46E5');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    for (var i = 1; i <= def.headers.length; i++) {
      sheet.setColumnWidth(i, 140);
    }

    Logger.log('✅ สร้างใหม่: ' + def.name);
    created++;
  });

  Logger.log(created > 0
    ? '✅ addMissingSheets เสร็จ — สร้าง ' + created + ' sheet ใหม่'
    : '✅ ทุก sheet มีอยู่แล้ว ไม่มีอะไรสร้างใหม่');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet definitions — เพิ่ม sheet ใหม่ที่นี่ แล้วรัน addMissingSheets()
// ─────────────────────────────────────────────────────────────────────────────

var ALL_SHEETS = [
  {
    name: 'Settings',
    headers: ['key','value'],
  },
  {
    name: 'Employees',
    headers: ['id','empCode','name','role','dept','imgUrl','imgId','grad','inTeam','inStarGang','starGangName','starGangRole','starGangSlogan'],
  },
  {
    name: 'Birthdays',
    headers: ['key','employeeId','name','role','monthIdx','date','fallbackIdx','imgUrl'],
  },
  {
    name: 'BirthdayWishes',
    headers: ['id','birthdayKey','fromName','fromAvIdx','msg','time','year','fromImgId'],
  },
  {
    name: 'EmpathyComments',
    headers: ['id','postId','parentId','authorName','text','createdAt'],
  },
  {
    name: 'EmpathyLikes',
    headers: ['postId','userKey'],
  },
  {
    name: 'CommentLikes',
    headers: ['commentId','userKey'],
  },
  {
    name: 'ChannelLikes',
    headers: ['channelId','userKey'],
  },
  {
    name: 'EmpathyPhotos',
    headers: ['empCode','imgUrl','updatedAt'],
  },
  {
    name: 'Ideas',
    headers: ['id','category','title','detail','submitterName','createdAt','status'],
  },
  {
    name: 'Activities',
    headers: ['id','monthIdx','name','emoji','date','dateEnd','loc','desc','steps','joinUrl','joinOpen','joinLabel','joinOpenAt','joinCloseAt','feedbackUrl','imgUrl','imgId','createdAt'],
  },
  {
    name: 'ActivityJoins',
    headers: ['id','activityId','activityName','employeeName','stampedAt','rewardClaimed','rewardType'],
  },
  { name: 'AnnualTrainings',      headers: ['id','title','description','instructor','section','createdAt'] },
  { name: 'IdpTrainings',         headers: ['id','title','description','instructor','section','createdAt'] },
  { name: 'IdpPosters',           headers: ['id','title','imageUrl','description','date','createdAt'] },
  { name: 'IdpVideos',            headers: ['id','title','videoUrl','description','createdAt'] },
  { name: 'ExternalTrainings',    headers: ['id','title','description','instructor','section','createdAt'] },
  { name: 'CompulsoryTrainings',  headers: ['id','title','description','instructor','section','createdAt'] },
  { name: 'SuperskillsTrainings', headers: ['id','title','description','instructor','section','createdAt'] },
  { name: 'LeadershipTrainings',  headers: ['id','title','description','instructor','section','createdAt'] },
  {
    name: 'SiteVisits',
    headers: ['id','title','description','instructor','color','createdAt'],
  },
  {
    name: 'SiteVotes',
    headers: ['id','siteId','employeeId','employeeName','votedAt'],
  },
  {
    name: 'TrainingRegistrations',
    headers: ['id','trainingId','employeeId','employeeName','registeredAt'],
  },
  {
    name: 'TrainingReviews',
    headers: ['id','trainingId','employeeId','employeeName','stars','comment','createdAt'],
  },
  {
    name: 'Admins',
    headers: ['username','passwordHash','name','token','tokenExpires'],
  },
  {
    name: 'UserAuth',
    headers: ['employeeId','passwordHash','token','tokenExpires'],
  },
  {
    name: 'Points',
    headers: ['id','employeeName','type','subtype','amount','desc','createdAt'],
  },
  {
    name: 'PointRules',
    headers: ['id','type','subtype','icon','name','desc','pts','color','active'],
  },
  {
    name: 'BlogPosts',
    headers: ['id','title','body','category','authorName','authorId','createdAt'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. สร้าง Sheets + Headers
// ─────────────────────────────────────────────────────────────────────────────

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ALL_SHEETS.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      Logger.log('สร้าง sheet: ' + def.name);
    } else {
      Logger.log('มีอยู่แล้ว (ข้าม): ' + def.name);
    }

    // ใส่ header ถ้ายังว่าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);

      // จัดสไตล์ header row
      var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4F46E5');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);

      // Auto-resize columns
      for (var i = 1; i <= def.headers.length; i++) {
        sheet.setColumnWidth(i, 140);
      }
    }
  });

  // ลบ Sheet1 default ถ้ายังมี
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getNumSheets() > 1) {
    ss.deleteSheet(defaultSheet);
    Logger.log('ลบ Sheet1 ออก');
  }

  Logger.log('✅ setupSheets เสร็จ — ตรวจสอบ ' + ALL_SHEETS.length + ' sheets');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Seed Employees (ข้อมูลตัวอย่าง)
// ─────────────────────────────────────────────────────────────────────────────

function seedEmployees() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employees');
  if (sheet.getLastRow() > 1) {
    Logger.log('Employees มีข้อมูลแล้ว (ข้าม seed)');
    return;
  }

  // id | empCode | name | role | dept | imgUrl | imgId | grad | inTeam | inStarGang | starGangName | starGangRole | starGangSlogan
  var rows = [
    ['1','E001','นก','Marketing Manager','Marketing','','','','true','true','Star Marketing','Lead','ทุกความพยายามมีความหมาย'],
    ['2','E002','น้ำส้ม','Graphic Designer','Creative','','','','true','false','','',''],
    ['3','E003','วุฒิ','Developer','Tech','','','','true','false','','',''],
  ];

  rows.forEach(function(r) { sheet.appendRow(r); });
  Logger.log('✅ Seed Employees: ' + rows.length + ' แถว');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Seed Birthdays (ข้อมูลตัวอย่าง)
// ─────────────────────────────────────────────────────────────────────────────

function seedBirthdays() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Birthdays');
  if (sheet.getLastRow() > 1) {
    Logger.log('Birthdays มีข้อมูลแล้ว (ข้าม seed)');
    return;
  }

  var rows = [
    ['bday_1','1','นก','Marketing Manager','1','14 ก.พ.','0','images/nok.jpg'],
    ['bday_2','2','น้ำส้ม','Graphic Designer','3','3 เม.ย.','1','images/namsom.jpg'],
    ['bday_3','3','วุฒิ','Developer','10','22 พ.ย.','2','images/wut.jpg'],
  ];

  rows.forEach(function(r) { sheet.appendRow(r); });
  Logger.log('✅ Seed Birthdays: ' + rows.length + ' แถว');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Seed PointRules (default rules for reward system)
// ─────────────────────────────────────────────────────────────────────────────

function seedPointRules() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PointRules');
  if (!sheet) { Logger.log('ไม่พบ sheet PointRules — รัน setupSheets ก่อน'); return; }
  if (sheet.getLastRow() > 1) { Logger.log('PointRules มีข้อมูลแล้ว (ข้าม seed)'); return; }

  var rows = [
    ['rule_1', 'join_activity',    '', '🙌', 'เข้าร่วมกิจกรรม (ทั่วไป)',    'เข้าร่วม event / กิจกรรมองค์กร',             50, '#6366F1', 'true'],
    ['rule_2', 'activity_checkin', '', '📍', 'Check-in กิจกรรม',            'เช็คอินเข้างานเมื่อถึงสถานที่จัดงาน',         30, '#3B82F6', 'true'],
    ['rule_3', 'daily_checkin',    '', '📅', 'Check-in รายวัน',              'เช็คอินประจำวัน (1 ครั้ง/วัน)',               5,  '#06C755', 'true'],
    ['rule_4', 'send_empathy',     '', '💌', 'ส่ง Empathy (ทั่วไป)',         'ส่งกำลังใจ / ข้อความให้เพื่อนร่วมงาน',       10, '#EC4899', 'true'],
    ['rule_5', 'birthday_wish',    '', '🎂', 'อวยพรวันเกิด (ทั่วไป)',        'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',          5,  '#A855F7', 'true'],
  ];
  rows.forEach(function(r) { sheet.appendRow(r); });
  Logger.log('✅ Seed PointRules: ' + rows.length + ' แถว');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Setup Admin account (admin / ds2026)
// ─────────────────────────────────────────────────────────────────────────────

function setupAdmin() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Admins');
  if (!sheet) {
    Logger.log('ไม่พบ sheet Admins — รัน setupSheets ก่อน');
    return;
  }
  if (sheet.getLastRow() > 1) {
    Logger.log('Admins มีข้อมูลแล้ว (ข้าม)');
    return;
  }

  var hash = sha256hex('ds2026');
  sheet.appendRow(['admin', hash, 'DS Admin', '', '']);
  Logger.log('✅ Admin account: admin / ds2026');
}
