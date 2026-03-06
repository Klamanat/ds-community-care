// Code.gs — main router for GAS Web App
// Deploy as: Execute as Me | Access: Anyone
// All reads and writes via GET params: ?action=xxx&param1=yyy...

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
