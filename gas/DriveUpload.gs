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
  activities: "Activities",
  profiles:   "Profiles",
};

function _getOrCreateSubfolder(parent, name) {
  var iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
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
