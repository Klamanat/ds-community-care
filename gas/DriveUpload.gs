/**
 * DriveUpload.gs
 * Called from doPost with action: 'uploadImage'
 * Uploads image to a subfolder under the main Drive folder.
 *
 * Folder structure:
 *   DRIVE_FOLDER_ID/
 *     Activities/   ← folderType: 'activities'
 *     Profiles/     ← folderType: 'profiles'
 *
 * HOW TO SET UP:
 * 1. Create a folder in Google Drive
 * 2. Open the folder → copy the ID from the URL:
 *    https://drive.google.com/drive/folders/[ THIS PART ]
 * 3. Paste it as DRIVE_FOLDER_ID below (URL or bare ID both work)
 */
var DRIVE_FOLDER_ID =
  "https://drive.google.com/drive/u/0/folders/1KcHRzC_H_-Vltz5YWqhox_ZCYq5pz05W";

var SUBFOLDERS = {
  activities:    "Activities",
  profiles:      "Profiles",
  announcements: "Announcements",
  empathy:       "Empathy",
};

function _getOrCreateSubfolder(parent, name) {
  var iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

/**
 * adminUploadProfileImage — upload/overwrite an employee's profile photo.
 * Called from doPost with action: 'adminUploadProfileImage'
 * body: { token, employeeId, base64, fileName }
 * - Deletes old Drive file if employee already has imgId
 * - Uploads new image to Profiles/ subfolder
 * - Updates Employees sheet: imgUrl + imgId
 * - Also updates matching Birthdays row imgUrl
 * Returns: { url, id }
 */
function adminUploadProfileImage(body) {
  verifyToken(body.token);

  var employeeId = body.employeeId;
  var base64Raw  = (body.base64 || '').replace(/^data:[^;]+;base64,/, '');
  var fileName   = body.fileName || (employeeId + '_profile.jpg');

  if (!employeeId) return err('employeeId required');
  if (!base64Raw)  return err('base64 required');

  // ── 1. Find current imgId for employee ───────────────────────────
  var empSheet   = getSheet('Employees');
  var empData    = empSheet.getDataRange().getValues();
  var empHeaders = empData[0];
  var idIdx      = empHeaders.indexOf('id');
  var imgUrlIdx  = empHeaders.indexOf('imgUrl');
  var imgIdIdx   = empHeaders.indexOf('imgId');

  var empRowIdx = -1;
  var oldImgId  = '';
  for (var i = 1; i < empData.length; i++) {
    if (String(empData[i][idIdx]) === String(employeeId)) {
      empRowIdx = i + 1;  // 1-based sheet row
      oldImgId  = imgIdIdx >= 0 ? String(empData[i][imgIdIdx] || '') : '';
      break;
    }
  }

  // ── 2. Upload new file to Drive ───────────────────────────────────
  var m        = DRIVE_FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/);
  var folderId = m ? m[1] : DRIVE_FOLDER_ID;
  var mainFolder = DriveApp.getFolderById(folderId);
  var subfolder  = _getOrCreateSubfolder(mainFolder, 'Profiles');

  var decoded = Utilities.base64Decode(base64Raw);
  var blob    = Utilities.newBlob(decoded, 'image/jpeg', fileName);
  var newFile = subfolder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

  var newId      = newFile.getId();
  var driveRef   = 'drive:' + newId;  // stored in sheet — getEmployees/getBirthdays convert to base64

  // ── 3. Delete old Drive file ──────────────────────────────────────
  if (oldImgId) {
    try { DriveApp.getFileById(oldImgId).setTrashed(true); } catch (e) { /* file may not exist */ }
  }

  // ── 4. Update Employees sheet (store drive:id, not URL) ───────────
  if (empRowIdx > 0) {
    if (imgUrlIdx >= 0) empSheet.getRange(empRowIdx, imgUrlIdx + 1).setValue(driveRef);
    if (imgIdIdx  >= 0) empSheet.getRange(empRowIdx, imgIdIdx  + 1).setValue(newId);
  }

  // ── 5. Update Birthdays imgUrl for this employee ──────────────────
  try {
    var bdaySheet   = getSheet('Birthdays');
    var bdayData    = bdaySheet.getDataRange().getValues();
    var bdayHeaders = bdayData[0];
    var bEmpIdx     = bdayHeaders.indexOf('employeeId');
    var bImgIdx     = bdayHeaders.indexOf('imgUrl');
    if (bEmpIdx >= 0 && bImgIdx >= 0) {
      for (var j = 1; j < bdayData.length; j++) {
        if (String(bdayData[j][bEmpIdx]) === String(employeeId)) {
          bdaySheet.getRange(j + 1, bImgIdx + 1).setValue(driveRef);
        }
      }
    }
  } catch (e) { /* Birthdays sheet may not exist */ }

  return ok({ id: newId });
}

/**
 * uploadAnnouncementVideo — upload a video file to Drive Announcements/ subfolder.
 * Called from doPost with action: 'uploadAnnouncementVideo'
 * body: { token, base64, fileName, mimeType }
 * Returns: { url: 'https://drive.google.com/file/d/ID/view', id }
 *
 * Note: max practical size ~30 MB (base64 overhead ~33%, GAS POST limit 50 MB)
 */
function uploadAnnouncementVideo(body) {
  verifyToken(body.token);

  var base64Raw = (body.base64 || '').replace(/^data:[^;]+;base64,/, '');
  var fileName  = body.fileName || ('announcement_' + new Date().getTime() + '.mp4');
  var mimeType  = body.mimeType || 'video/mp4';

  if (!base64Raw) return err('No video data');

  var m          = DRIVE_FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/);
  var folderId   = m ? m[1] : DRIVE_FOLDER_ID;
  var mainFolder = DriveApp.getFolderById(folderId);
  var subfolder  = _getOrCreateSubfolder(mainFolder, 'Announcements');

  var decoded = Utilities.base64Decode(base64Raw);
  var blob    = Utilities.newBlob(decoded, mimeType, fileName);
  var file    = subfolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  return ok({
    url: 'https://drive.google.com/file/d/' + fileId + '/view',
    id:  fileId,
  });
}

function uploadImage(body) {
  var base64     = (body.base64 || "").replace(/^data:[^;]+;base64,/, "");
  var folderType = body.folderType || "activities";
  var fileName   = body.fileName   || (folderType + "_" + new Date().getTime() + ".jpg");
  var mimeType   = body.mimeType   || "image/jpeg";

  if (!base64) return err("No image data");

  // Parse folder ID (accept full URL or bare ID)
  var m        = DRIVE_FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/);
  var folderId = m ? m[1] : DRIVE_FOLDER_ID;

  var mainFolder = DriveApp.getFolderById(folderId);
  var subName    = SUBFOLDERS[folderType] || "Activities";
  var subfolder  = _getOrCreateSubfolder(mainFolder, subName);

  var decoded = Utilities.base64Decode(base64);
  var blob    = Utilities.newBlob(decoded, mimeType, fileName);
  var file    = subfolder.createFile(blob);

  // ANYONE (fully public) is required for direct <img> embedding
  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

  return ok({
    url: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1600",
    id:  file.getId(),
  });
}
