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
      uploadImage:                  function() { return uploadImage(body); },
      uploadAnnouncementVideo:      function() { return uploadAnnouncementVideo(body); },
      adminUploadProfileImage:   function() { return adminUploadProfileImage(body); },
      login:                     function() { return login(body); },
      userLogin:            function() { return userLogin(body); },
      userSetPassword:      function() { return userSetPassword(body); },
      adminAddActivity:     function() { return adminAddActivity(body); },
      adminUpdateActivity:  function() { return adminUpdateActivity(body); },
      addBlogPost:          function() { return addBlogPost(body); },
      adminUploadIdpImage:  function() { return adminUploadIdpImage(body); },
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
      setEmpathyPhoto:    function() { return setEmpathyPhoto(e.parameter); },

      // Ideas
      getIdeas:           function() { return getIdeas(e.parameter); },
      submitIdea:         function() { return submitIdea(e.parameter); },

      // User auth
      userCheckPassword:  function() { return userCheckPassword(e.parameter); },

      // Activities
      getActivities:         function() { return getActivities(e.parameter); },
      joinActivity:          function() { return joinActivity(e.parameter); },
      getMyStamps:           function() { return getMyStamps(e.parameter); },
      claimActivityReward:   function() { return claimActivityReward(e.parameter); },
      adminAddActivity:      function() { return adminAddActivity(e.parameter); },
      adminUpdateActivity:   function() { return adminUpdateActivity(e.parameter); },
      adminDeleteActivity:   function() { return adminDeleteActivity(e.parameter); },

      // Notifications
      getNotifications:   function() { return getNotifications(e.parameter); },
      getNotifReads:      function() { return getNotifReads(e.parameter); },
      markNotifsRead:     function() { return markNotifsRead(e.parameter); },

      // Rewards
      getMyPoints:           function() { return getMyPoints(e.parameter); },
      getRewardRules:        function() { return getRewardRules(); },
      dailyCheckin:          function() { return dailyCheckin(e.parameter); },
      adminAddRewardRule:    function() { return adminAddRewardRule(e.parameter); },
      adminUpdateRewardRule: function() { return adminUpdateRewardRule(e.parameter); },
      adminDeleteRewardRule: function() { return adminDeleteRewardRule(e.parameter); },

      // Training (annual / idp / external / etc)
      getTrainings:           function() { return getTrainings(e.parameter); },
      registerTraining:       function() { return registerTraining(e.parameter); },
      cancelRegistration:     function() { return cancelRegistration(e.parameter); },
      getMyTrainings:         function() { return getMyTrainings(e.parameter); },
      adminGetTrainingRegistrations: function() { return adminGetTrainingRegistrations(e.parameter); },
      adminAddTraining:       function() { return adminAddTraining(e.parameter); },
      adminUpdateTraining:    function() { return adminUpdateTraining(e.parameter); },
      adminDeleteTraining:    function() { return adminDeleteTraining(e.parameter); },
      submitTrainingReview:   function() { return submitTrainingReview(e.parameter); },
      getTrainingReviews:     function() { return getTrainingReviews(e.parameter); },

      // Site Visit (แยก sheet ออกจาก Trainings)
      getSiteVisits:          function() { return getSiteVisits(); },
      voteSite:               function() { return voteSite(e.parameter); },
      cancelSiteVote:         function() { return cancelSiteVote(e.parameter); },
      getMySiteVotes:         function() { return getMySiteVotes(e.parameter); },
      adminAddSiteVisit:      function() { return adminAddSiteVisit(e.parameter); },
      adminUpdateSiteVisit:   function() { return adminUpdateSiteVisit(e.parameter); },
      adminDeleteSiteVisit:   function() { return adminDeleteSiteVisit(e.parameter); },
      adminGetSiteVotes:      function() { return adminGetSiteVotes(e.parameter); },

      // Site Suggestions (อื่นๆ)
      submitSiteSuggestion:    function() { return submitSiteSuggestion(e.parameter); },
      getMySiteSuggestion:     function() { return getMySiteSuggestion(e.parameter); },
      adminGetSiteSuggestions: function() { return adminGetSiteSuggestions(e.parameter); },

      // IDP Posters & Videos
      getIdpPosters:        function() { return getIdpPosters(); },
      getIdpVideos:         function() { return getIdpVideos(); },
      adminAddIdpPoster:    function() { return adminAddIdpPoster(e.parameter); },
      adminUpdateIdpPoster: function() { return adminUpdateIdpPoster(e.parameter); },
      adminDeleteIdpPoster: function() { return adminDeleteIdpPoster(e.parameter); },
      adminAddIdpVideo:     function() { return adminAddIdpVideo(e.parameter); },
      adminUpdateIdpVideo:  function() { return adminUpdateIdpVideo(e.parameter); },
      adminDeleteIdpVideo:  function() { return adminDeleteIdpVideo(e.parameter); },

      // Mental Health Advisors
      getMentalAdvisors:        function() { return getMentalAdvisors(); },
      adminAddMentalAdvisor:    function() { return adminAddMentalAdvisor(e.parameter); },
      adminUpdateMentalAdvisor: function() { return adminUpdateMentalAdvisor(e.parameter); },
      adminDeleteMentalAdvisor: function() { return adminDeleteMentalAdvisor(e.parameter); },
      // Consultation Requests
      submitConsultRequest:          function() { return submitConsultRequest(e.parameter); },
      getConsultRequests:            function() { return getConsultRequests(e.parameter); },
      markConsultRead:               function() { return markConsultRead(e.parameter); },
      adminGetAllConsultRequests:    function() { return adminGetAllConsultRequests(e.parameter); },
      getMyConsultRequests:          function() { return getMyConsultRequests(e.parameter); },
      addConsultReply:               function() { return addConsultReply(e.parameter); },

      // Blog
      getBlogPosts:        function() { return getBlogPosts(e.parameter); },
      addBlogPost:         function() { return addBlogPost(e.parameter); },
      adminGetBlogPosts:   function() { return adminGetBlogPosts(e.parameter); },
      adminDeleteBlogPost: function() { return adminDeleteBlogPost(e.parameter); },
      adminUpdateBlogPost: function() { return adminUpdateBlogPost(e.parameter); },

      // Announcement
      getAnnouncement:    function() { return getAnnouncement(); },
      saveAnnouncement:   function() { return saveAnnouncement(e.parameter); },
      getVideoUrl:        function() { return getVideoUrl(e.parameter); },

      // Images (Drive proxy — called by frontend after page renders)
      getImages:          function() { return getImages(e.parameter); },

      // Admin (token-gated)
      adminGetAll:        function() { return adminGetAll(e.parameter); },
      adminUpdateRow:     function() { return adminUpdateRow(e.parameter); },
      adminDeleteRow:     function() { return adminDeleteRow(e.parameter); },
      adminAddEmployee:   function() { return adminAddEmployee(e.parameter); },
      adminAddBirthday:   function() { return adminAddBirthday(e.parameter); },
      adminUpdateIdea:    function() { return adminUpdateIdea(e.parameter); },
      adminDeletePost:    function() { return adminDeletePost(e.parameter); },
      adminDeleteComment: function() { return adminDeleteComment(e.parameter); },
      adminDeleteChannel: function() { return adminDeleteChannel(e.parameter); },
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

// ── Keep-Alive Trigger ────────────────────────────────────────────────────────
// GAS V8 sleeps after ~5 min inactivity → cold start takes 10-20s per request.
// Run installKeepAliveTrigger() ONCE from the GAS editor (Run → Run function).
// After setup, keepAlive fires every 5 min → script stays warm → ~300ms response.
// ─────────────────────────────────────────────────────────────────────────────
function keepAlive() {
  CacheService.getScriptCache().get('_ka'); // lightweight touch — keeps V8 warm
}

function installKeepAliveTrigger() {
  // Remove existing keepAlive triggers to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === 'keepAlive'; })
    .forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('keepAlive').timeBased().everyMinutes(5).create();
  Logger.log('keepAlive trigger installed — fires every 5 min. Cold start eliminated.');
}
