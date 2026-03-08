// Empathy.gs — EmpathyPosts + EmpathyComments + Likes handlers
// Sheet: EmpathyPosts
// Columns: id | recEmployeeId | recName | recRole | recImgUrl | sndName | msg | tag | likeCount | createdAt
//
// Sheet: EmpathyComments
// Columns: id | postId | parentId | authorName | text | createdAt
//
// Sheet: EmpathyLikes
// Columns: postId | userKey (track unique likes)

// getEmpathyPeople — unique people from EmpathyComments (keyed by channelId = empCode)
function getEmpathyPeople(params) {
  var comments = cachedSheetRead('EmpathyComments');

  var empByCode = {};
  var empById   = {};
  try {
    cachedSheetRead('Employees', 600).forEach(function(e) {
      if (e.empCode) empByCode[String(e.empCode)] = e;
      if (e.id)      empById[String(e.id)]         = e;
    });
  } catch(e) {}

  // Aggregate unique channelIds
  var channelMap = {};
  comments.forEach(function(c) {
    var cid = String(c.postId || '').trim();
    if (!cid) return;
    if (!channelMap[cid]) channelMap[cid] = { count: 0, lastTime: '' };
    channelMap[cid].count++;
    if (String(c.createdAt) > channelMap[cid].lastTime) channelMap[cid].lastTime = String(c.createdAt);
  });

  var people = Object.keys(channelMap).map(function(cid) {
    // Look up by empCode first (new data), then by id (old data)
    var emp = empByCode[cid] || empById[cid];
    var imgUrl = '';
    if (emp && emp.imgUrl) {
      var raw = String(emp.imgUrl);
      if (raw.indexOf('drive:') === 0) {
        imgUrl = cachedDriveImage(raw.slice(6));
      } else {
        imgUrl = raw;
      }
    }
    return {
      id:           cid,
      empCode:      emp ? String(emp.empCode || '') : '',
      name:         emp ? String(emp.name    || cid) : cid,
      role:         emp ? String(emp.role    || '')  : '',
      imgUrl:       imgUrl,
      commentCount: channelMap[cid].count,
    };
  });

  // Sort newest activity first
  people.sort(function(a, b) {
    return channelMap[b.id].lastTime > channelMap[a.id].lastTime ? 1 : -1;
  });

  return ok(people);
}

function getEmpathyPosts(params) {
  var rows = cachedSheetRead('EmpathyPosts');

  rows.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  var empByCode = {};
  var empById   = {};
  try {
    cachedSheetRead('Employees', 600).forEach(function(e) {
      if (e.empCode) empByCode[String(e.empCode)] = e;
      if (e.id)      empById[String(e.id)]         = e;
    });
  } catch(e) {}

  var posts = rows.map(function(r) {
    var recImg = String(r.recImgUrl || '');

    // If no image stored, look up by recEmployeeId treating as empCode first, then id
    if (!recImg && r.recEmployeeId) {
      var emp = empByCode[String(r.recEmployeeId)] || empById[String(r.recEmployeeId)];
      if (emp) {
        var empImg = String(emp.imgUrl || '');
        if (empImg.indexOf('drive:') === 0) {
          recImg = cachedDriveImage(empImg.slice(6));
        } else {
          recImg = empImg;
        }
      }
    }

    return {
      id:            String(r.id || ''),
      recEmployeeId: String(r.recEmployeeId || ''),
      recName:       String(r.recName || ''),
      recRole:       String(r.recRole || ''),
      recImg:        recImg,
      sndName:       String(r.sndName || ''),
      msg:           String(r.msg || ''),
      tag:           String(r.tag || ''),
      likeCount:     parseInt(r.likeCount, 10) || 0,
      createdAt:     String(r.createdAt || ''),
      comments:      [],
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
  if (recImgUrl.length > 500) recImgUrl = '';  // strip oversized images

  var id        = uuid();
  var likeCount = 0;
  var createdAt = formatDate(new Date());

  appendRow('EmpathyPosts', [id, recEmployeeId, recName, recRole, recImgUrl, sndName, msg, tag, likeCount, createdAt]);
  invalidateSheet('EmpathyPosts');

  return ok({ id: id, recEmployeeId: recEmployeeId, recName: recName, recRole: recRole, recImg: recImgUrl, sndName: sndName, msg: msg, tag: tag, likeCount: likeCount, createdAt: createdAt, comments: [] });
}

function getEmpathyComments(params) {
  var postId  = params.postId;
  var userKey = params.userKey || '';
  if (!postId) return err('postId required');

  var rows     = cachedSheetRead('EmpathyComments');
  var filtered = rows.filter(function(r) { return String(r.postId) === String(postId); });
  filtered.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });

  // Build likeCount + userLiked map from CommentLikes sheet
  var likeMap = {};  // { commentId: { count, userLiked } }
  try {
    cachedSheetRead('CommentLikes').forEach(function(r) {
      var cid = String(r.commentId || '');
      if (!cid) return;
      if (!likeMap[cid]) likeMap[cid] = { count: 0, userLiked: false };
      likeMap[cid].count++;
      if (userKey && String(r.userKey) === String(userKey)) likeMap[cid].userLiked = true;
    });
  } catch(e) {}

  var comments = filtered.map(function(r) {
    var cid  = String(r.id || '');
    var lk   = likeMap[cid] || { count: 0, userLiked: false };
    var obj  = {
      id:        cid,
      postId:    String(r.postId     || ''),
      parentId:  String(r.parentId   || ''),
      name:      String(r.authorName || ''),
      text:      String(r.text       || ''),
      time:      String(r.createdAt  || ''),
      likeCount: lk.count,
    };
    if (userKey) obj._liked = lk.userLiked;
    return obj;
  });

  return ok(comments);
}

// toggleCommentLike — like / unlike a comment, tracked in CommentLikes sheet
function toggleCommentLike(params) {
  var commentId = params.commentId;
  var userKey   = params.userKey || 'anonymous';
  if (!commentId) return err('commentId required');

  var sheet   = getSheet('CommentLikes');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0] || ['commentId','userKey'];
  var cidIdx  = headers.indexOf('commentId');
  var ukIdx   = headers.indexOf('userKey');

  var existingRow = -1;
  var likeCount   = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][cidIdx]) === String(commentId)) {
      likeCount++;
      if (String(data[i][ukIdx]) === String(userKey)) existingRow = i + 1;
    }
  }

  var liked;
  if (existingRow > 0) {
    sheet.deleteRow(existingRow);
    likeCount = Math.max(0, likeCount - 1);
    liked = false;
  } else {
    sheet.appendRow([commentId, userKey]);
    likeCount++;
    liked = true;
  }
  invalidateSheet('CommentLikes');

  return ok({ commentId: commentId, liked: liked, likeCount: likeCount });
}

// toggleChannelLike — like / unlike a person's channel, tracked in ChannelLikes sheet
function toggleChannelLike(params) {
  var channelId = params.channelId;
  var userKey   = params.userKey || 'anonymous';
  if (!channelId) return err('channelId required');

  var sheet   = getSheet('ChannelLikes');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0] || ['channelId','userKey'];
  var cidIdx  = headers.indexOf('channelId');
  var ukIdx   = headers.indexOf('userKey');

  var existingRow = -1;
  var likeCount   = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][cidIdx]) === String(channelId)) {
      likeCount++;
      if (String(data[i][ukIdx]) === String(userKey)) existingRow = i + 1;
    }
  }

  var liked;
  if (existingRow > 0) {
    sheet.deleteRow(existingRow);
    likeCount = Math.max(0, likeCount - 1);
    liked = false;
  } else {
    sheet.appendRow([channelId, userKey]);
    likeCount++;
    liked = true;
  }
  invalidateSheet('ChannelLikes');

  return ok({ channelId: channelId, liked: liked, likeCount: likeCount });
}

// getChannelLike — return like count + whether userKey has liked a channel
function getChannelLike(params) {
  var channelId = params.channelId;
  var userKey   = params.userKey || '';
  if (!channelId) return err('channelId required');

  var rows      = cachedSheetRead('ChannelLikes');
  var liked     = false;
  var likeCount = 0;
  rows.forEach(function(r) {
    if (String(r.channelId) !== String(channelId)) return;
    likeCount++;
    if (userKey && String(r.userKey) === String(userKey)) liked = true;
  });

  return ok({ channelId: channelId, liked: liked, likeCount: likeCount });
}

function addComment(params) {
  var postId     = params.postId;
  var authorName = params.authorName;
  var text       = params.text;
  var parentId   = params.parentId || '';

  if (!postId)     return err('postId required');
  if (!authorName) return err('authorName required');
  if (!text)       return err('text required');

  var id        = uuid();
  var createdAt = formatDate(new Date());

  // Column order: id | postId | parentId | authorName | text | createdAt
  appendRow('EmpathyComments', [id, postId, parentId, authorName, text, createdAt]);
  invalidateSheet('EmpathyComments');

  return ok({ id: id, postId: postId, parentId: parentId, name: authorName, text: text, time: createdAt });
}

function ensurePost(params) {
  var recEmployeeId = params.recEmployeeId || '';
  var recName       = params.recName;
  var recRole       = params.recRole   || '';
  var recImgUrl     = params.recImgUrl || '';
  var sndName       = params.sndName   || 'ทีม';

  if (!recName) return err('recName required');

  var rows = cachedSheetRead('EmpathyPosts');

  // Find by empCode first (stored in recEmployeeId column), then by name
  var existing = null;
  if (recEmployeeId) {
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].recEmployeeId) === String(recEmployeeId)) { existing = rows[i]; break; }
    }
  }
  if (!existing) {
    for (var j = 0; j < rows.length; j++) {
      if (String(rows[j].recName) === String(recName)) { existing = rows[j]; break; }
    }
  }

  if (existing) {
    return ok({ id: String(existing.id), recName: String(existing.recName), recRole: String(existing.recRole || ''), recImg: String(existing.recImgUrl || ''), isNew: false });
  }

  if (recImgUrl.length > 500) recImgUrl = '';
  var id = uuid();
  var createdAt = formatDate(new Date());
  appendRow('EmpathyPosts', [id, recEmployeeId, recName, recRole, recImgUrl, sndName, '', '', 0, createdAt]);
  invalidateSheet('EmpathyPosts');

  return ok({ id: id, recName: recName, recRole: recRole, recImg: recImgUrl, isNew: true });
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
  invalidateSheet('EmpathyPosts');

  return ok({ postId: postId, liked: liked, likeCount: currentLikes });
}
