/**
 * DriveUpload.gs
 * Called from doPost with action: 'uploadImage'
 * Decodes base64 image, uploads to a specific Google Drive folder, returns public URL.
 *
 * HOW TO SET UP:
 * 1. Create a folder in Google Drive (e.g. "DS Community Care — Images")
 * 2. Open the folder → copy the ID from the URL:
 *    https://drive.google.com/drive/folders/[ THIS PART ]
 * 3. Paste it as DRIVE_FOLDER_ID below
 */
var DRIVE_FOLDER_ID =
  "https://drive.google.com/drive/u/0/folders/1KcHRzC_H_-Vltz5YWqhox_ZCYq5pz05W";

function uploadImage(body) {
  var base64 = (body.base64 || "").replace(/^data:[^;]+;base64,/, "");
  var fileName = body.fileName || "activity_" + new Date().getTime() + ".jpg";
  var mimeType = body.mimeType || "image/jpeg";

  if (!base64) return err("No image data");

  var decoded = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);

  // Accept full URL or bare ID
  var folderId = DRIVE_FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/)
    ? DRIVE_FOLDER_ID.match(/folders\/([a-zA-Z0-9_-]+)/)[1]
    : DRIVE_FOLDER_ID;
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return ok({
    url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
    id: file.getId(),
  });
}
