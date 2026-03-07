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
      uploadImage:     function() { return uploadImage(body); },
      login:           function() { return login(body); },
      userLogin:       function() { return userLogin(body); },
      userSetPassword: function() { return userSetPassword(body); },
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
      // Employees
      getEmployees:       function() { return getEmployees(e.parameter); },
      addTeamMember:      function() { return addTeamMember(e.parameter); },
      joinStarGang:       function() { return joinStarGang(e.parameter); },

      // Birthdays
      getBirthdays:       function() { return getBirthdays(e.parameter); },
      getBirthdayWishes:  function() { return getBirthdayWishes(e.parameter); },
      addBirthdayWish:    function() { return addBirthdayWish(e.parameter); },

      // Empathy
      getEmpathyPosts:    function() { return getEmpathyPosts(e.parameter); },
      addEmpathyPost:     function() { return addEmpathyPost(e.parameter); },
      getEmpathyComments: function() { return getEmpathyComments(e.parameter); },
      addComment:         function() { return addComment(e.parameter); },
      toggleLike:         function() { return toggleLike(e.parameter); },

      // Ideas
      getIdeas:           function() { return getIdeas(e.parameter); },
      submitIdea:         function() { return submitIdea(e.parameter); },

      // User auth
      userCheckPassword:  function() { return userCheckPassword(e.parameter); },

      // Admin (token-gated)
      adminGetAll:        function() { return adminGetAll(e.parameter); },
      adminUpdateRow:     function() { return adminUpdateRow(e.parameter); },
      adminDeleteRow:     function() { return adminDeleteRow(e.parameter); },
      adminAddEmployee:   function() { return adminAddEmployee(e.parameter); },
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
