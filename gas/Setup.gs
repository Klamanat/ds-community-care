// Setup.gs — รันครั้งเดียวเพื่อสร้าง sheets + seed ข้อมูลเริ่มต้น
// วิธีใช้: เปิด GAS editor → เลือกฟังก์ชัน setupAll → กด Run
//
// ฟังก์ชันทั้งหมด:
//   setupAll()           — ครั้งแรก: สร้างทุก sheet + seed + admin (safe to re-run)
//   addMissingSheets()   — เพิ่มเฉพาะ sheet ที่ยังไม่มี (ใช้เมื่อเพิ่ม feature ใหม่)
//   addMissingColumns()  — เพิ่ม column ที่ขาดใน sheet ที่มีอยู่แล้ว (safe to re-run)
//   setupSheets()        — สร้าง/อัปเดต header ทุก sheet (idempotent)
//   setupAdmin()         — สร้าง admin account (ข้ามถ้ามีแล้ว)
//   seedEmployees()      — seed พนักงานตัวอย่าง (ข้ามถ้ามีแล้ว)
//   seedBirthdays()      — seed วันเกิดตัวอย่าง (ข้ามถ้ามีแล้ว)

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
    name: 'Employees',
    headers: ['id','name','role','dept','imgUrl','imgId','grad','inTeam','inStarGang','starGangName','starGangRole'],
  },
  {
    name: 'Birthdays',
    headers: ['key','employeeId','name','role','monthIdx','date','fallbackIdx','imgUrl'],
  },
  {
    name: 'BirthdayWishes',
    headers: ['id','birthdayKey','fromName','fromAvIdx','msg','time','year'],
  },
  {
    name: 'EmpathyPosts',
    headers: ['id','recEmployeeId','recName','recRole','recImgUrl','sndName','msg','tag','likeCount','createdAt'],
  },
  {
    name: 'EmpathyComments',
    headers: ['id','postId','authorName','text','createdAt'],
  },
  {
    name: 'EmpathyLikes',
    headers: ['postId','userKey'],
  },
  {
    name: 'Ideas',
    headers: ['id','category','title','detail','submitterName','createdAt','status'],
  },
  {
    name: 'Activities',
    headers: ['id','monthIdx','name','emoji','date','loc','desc','steps','joinUrl','imgUrl','imgId','createdAt'],
  },
  {
    name: 'Admins',
    headers: ['username','passwordHash','name','token','tokenExpires'],
  },
  {
    name: 'UserAuth',
    headers: ['employeeId','passwordHash','token','tokenExpires'],
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

  var rows = [
    ['1','นก','Marketing Manager','Marketing','images/nok.jpg','','true','true','Star Marketing','Lead'],
    ['2','น้ำส้ม','Graphic Designer','Creative','images/namsom.jpg','','true','false','',''],
    ['3','วุฒิ','Developer','Tech','images/wut.jpg','','true','false','',''],
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
// 4. Setup Admin account (admin / ds2026)
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
