// Empathy.gs — EmpathyPosts + EmpathyComments + Likes handlers
// Sheet: EmpathyPosts
// Columns: id | recEmployeeId | recName | recRole | recImgUrl | sndName | msg | tag | likeCount | createdAt
//
// Sheet: EmpathyComments
// Columns: id | postId | authorName | text | createdAt
//
// Sheet: EmpathyLikes
// Columns: postId | userKey (track unique likes)

function getEmpathyPosts(params) {
  var rows = sheetToObjects('EmpathyPosts');

  // Sort by createdAt descending (newest first)
  rows.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  var posts = rows.map(function(r) {
    return {
      id:            String(r.id || ''),
      recEmployeeId: String(r.recEmployeeId || ''),
      recName:       String(r.recName || ''),
      recRole:       String(r.recRole || ''),
      recImg:        String(r.recImgUrl || ''),
      sndName:       String(r.sndName || ''),
      msg:           String(r.msg || ''),
      tag:           String(r.tag || ''),
      likeCount:     parseInt(r.likeCount, 10) || 0,
      createdAt:     String(r.createdAt || ''),
      comments:      [],  // loaded separately via getEmpathyComments
      react:         (String(r.tag || '')).includes('เก่งมาก') ? '⭐' : (String(r.tag || '')).includes('ขอบคุณ') ? '🙏' : '💪',
    };
  });

  return ok(posts);
}

function addEmpathyPost(params) {
  var recEmployeeId = params.recEmployeeId || '';
  var recName       = params.recName;
  var recRole       = params.recRole || '';
  var recImgUrl     = params.recImgUrl || '';
  var sndName       = params.sndName;
  var msg           = params.msg || '';
  var tag           = params.tag || '';

  if (!recName)  return err('recName required');
  if (!sndName)  return err('sndName required');

  var id        = uuid();
  var likeCount = 0;
  var createdAt = formatDate(new Date());

  appendRow('EmpathyPosts', [id, recEmployeeId, recName, recRole, recImgUrl, sndName, msg, tag, likeCount, createdAt]);

  return ok({ id: id, recEmployeeId: recEmployeeId, recName: recName, recRole: recRole, recImg: recImgUrl, sndName: sndName, msg: msg, tag: tag, likeCount: likeCount, createdAt: createdAt, comments: [] });
}

function getEmpathyComments(params) {
  var postId = params.postId;
  if (!postId) return err('postId required');

  var rows     = sheetToObjects('EmpathyComments');
  var filtered = rows.filter(function(r) { return String(r.postId) === String(postId); });

  var comments = filtered.map(function(r) {
    return {
      id:          String(r.id || ''),
      postId:      String(r.postId || ''),
      name:        String(r.authorName || ''),
      text:        String(r.text || ''),
      time:        String(r.createdAt || ''),
    };
  });

  return ok(comments);
}

function addComment(params) {
  var postId     = params.postId;
  var authorName = params.authorName;
  var text       = params.text;

  if (!postId)     return err('postId required');
  if (!authorName) return err('authorName required');
  if (!text)       return err('text required');

  var id        = uuid();
  var createdAt = formatDate(new Date());

  appendRow('EmpathyComments', [id, postId, authorName, text, createdAt]);

  return ok({ id: id, postId: postId, name: authorName, text: text, time: createdAt });
}

function toggleLike(params) {
  var postId  = params.postId;
  var userKey = params.userKey || 'anonymous';

  if (!postId) return err('postId required');

  // Check existing like
  var likesSheet = getSheet('EmpathyLikes');
  var data       = likesSheet.getDataRange().getValues();
  var headers    = data[0] || ['postId', 'userKey'];
  var pidIdx     = headers.indexOf('postId');
  var ukIdx      = headers.indexOf('userKey');

  var existingRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][pidIdx]) === String(postId) && String(data[i][ukIdx]) === String(userKey)) {
      existingRow = i + 1; // 1-based sheet row
      break;
    }
  }

  // Find post row and update likeCount
  var postsSheet = getSheet('EmpathyPosts');
  var postsData  = postsSheet.getDataRange().getValues();
  var pHeaders   = postsData[0];
  var pIdIdx     = pHeaders.indexOf('id');
  var pLikeIdx   = pHeaders.indexOf('likeCount');

  var postRow = -1;
  for (var j = 1; j < postsData.length; j++) {
    if (String(postsData[j][pIdIdx]) === String(postId)) {
      postRow = j + 1;
      break;
    }
  }

  if (postRow === -1) return err('Post not found');

  var currentLikes = parseInt(postsData[postRow - 1][pLikeIdx], 10) || 0;
  var liked;

  if (existingRow > 0) {
    // Unlike: remove row
    likesSheet.deleteRow(existingRow);
    currentLikes = Math.max(0, currentLikes - 1);
    liked = false;
  } else {
    // Like: add row
    likesSheet.appendRow([postId, userKey]);
    currentLikes = currentLikes + 1;
    liked = true;
  }

  postsSheet.getRange(postRow, pLikeIdx + 1).setValue(currentLikes);

  return ok({ postId: postId, liked: liked, likeCount: currentLikes });
}
