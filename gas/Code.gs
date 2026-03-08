// Code.gs — main router for GAS Web App
// Deploy as: Execute as Me | Access: Anyone
// All reads and writes via GET params: ?action=xxx&param1=yyy...

/**
 * doPost — handles large payloads (e.g. base64 images) that exceed URL param limits.
 * Body must be JSON: { action: "...", ...params }
 */
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;

    var handlers = {
      uploadImage:               function() { return uploadImage(body); },
      adminUploadProfileImage:   function() { return adminUploadProfileImage(body); },
      login:                     function() { return login(body); },
      userLogin:            function() { return userLogin(body); },
      userSetPassword:      function() { return userSetPassword(body); },
      adminAddActivity:     function() { return adminAddActivity(body); },
      adminUpdateActivity:  function() { return adminUpdateActivity(body); },
    };

    if (!handlers[action]) return respond(err('Unknown action: ' + action));
    return respond(handlers[action]());
  } catch(ex) {
    return respond(err(ex.message));
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;

    var handlers = {
      // App version
      getVersion:           function() { return getVersion(); },

      // Employees
      getEmployees:         function() { return getEmployees(e.parameter); },
      addTeamMember:        function() { return addTeamMember(e.parameter); },
      joinStarGang:         function() { return joinStarGang(e.parameter); },
      updateEmployeeSelf:   function() { return updateEmployeeSelf(e.parameter); },

      // Birthdays
      getBirthdays:       function() { return getBirthdays(e.parameter); },
      getBirthdayWishes:  function() { return getBirthdayWishes(e.parameter); },
      addBirthdayWish:    function() { return addBirthdayWish(e.parameter); },

      // Empathy
      getEmpathyPeople:   function() { return getEmpathyPeople(e.parameter); },
      getEmpathyPosts:    function() { return getEmpathyPosts(e.parameter); },
      addEmpathyPost:     function() { return addEmpathyPost(e.parameter); },
      ensurePost:         function() { return ensurePost(e.parameter); },
      getEmpathyComments: function() { return getEmpathyComments(e.parameter); },
      addComment:         function() { return addComment(e.parameter); },
      toggleLike:         function() { return toggleLike(e.parameter); },
      toggleCommentLike:  function() { return toggleCommentLike(e.parameter); },
      toggleChannelLike:  function() { return toggleChannelLike(e.parameter); },
      getChannelLike:     function() { return getChannelLike(e.parameter); },

      // Ideas
      getIdeas:           function() { return getIdeas(e.parameter); },
      submitIdea:         function() { return submitIdea(e.parameter); },

      // User auth
      userCheckPassword:  function() { return userCheckPassword(e.parameter); },

      // Activities
      getActivities:         function() { return getActivities(e.parameter); },
      joinActivity:          function() { return joinActivity(e.parameter); },
      adminAddActivity:      function() { return adminAddActivity(e.parameter); },
      adminUpdateActivity:   function() { return adminUpdateActivity(e.parameter); },
      adminDeleteActivity:   function() { return adminDeleteActivity(e.parameter); },

      // Admin (token-gated)
      adminGetAll:        function() { return adminGetAll(e.parameter); },
      adminUpdateRow:     function() { return adminUpdateRow(e.parameter); },
      adminDeleteRow:     function() { return adminDeleteRow(e.parameter); },
      adminAddEmployee:   function() { return adminAddEmployee(e.parameter); },
      adminAddBirthday:   function() { return adminAddBirthday(e.parameter); },
      adminUpdateIdea:    function() { return adminUpdateIdea(e.parameter); },
      adminDeletePost:    function() { return adminDeletePost(e.parameter); },
    };

    if (!handlers[action]) {
      return respond(err('Unknown action: ' + action));
    }

    var result = handlers[action]();
    return respond(result);

  } catch (ex) {
    return respond(err(ex.message));
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
