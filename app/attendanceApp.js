var app = angular.module('attendanceApp', ['ngMaterial', 'ngAnimate', 'ngRoute', 'ui.router', 'ngMessages', 'md.data.table'])

//Config app states (each app tab is a separate state)
app.config(function($stateProvider) {
  $stateProvider
    .state('attendance', {
      url: '/attendance',
      templateUrl: 'app/attendanceView.html',
      controller: 'AttendanceController',
      data: {requireLogin: true}
    })

    // -- Attendance child states
      .state('attendance.registered', {
        url: '/registered',
        templateUrl: 'app/attendanceTabControllers/registered.html',
        controller: 'RegisteredController',
        data: {requireLogin: true}
      })
      .state('attendance.checkedIn', {
        url: '/checkedIn',
        templateUrl: 'app/attendanceTabControllers/checkedIn.html',
        controller: 'CheckedInController',
        data: {requireLogin: true}
      })
      .state('attendance.assigned', {
        url: '/assigned',
        templateUrl: 'app/attendanceTabControllers/assigned.html',
        controller: 'AssignedController',
        data: {requireLogin: true}
      })

      .state('attendance.getFromOtherCarpoolSite', {
        url: '/otherCarpool',
        templateUrl: 'app/views/getFromOtherCarpool.html',
        controller: 'GetFromOtherCarpoolSiteController',
        data: {requireLogin: true}
      })
      .state('attendance.addNewVolunteer', {
        url: '/addNewTeer',
        templateUrl: 'app/views/addNewVolunteer.html',
        controller: 'AddNewVolunteerController',
        data: {requireLogin: true}
      })

    .state('goAway', {
      url: '/goAway',
      template: '<h1>Go Away.</h1><h3>You don\'t even go here.</h3>',
      data: {requireLogin: false}
    })

})

//open to registered tab by default
app.config(function($urlRouterProvider, $locationProvider) {
  $urlRouterProvider.when('', '/attendance/registered')
})

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })

//authentication logic by Gabe Scholz on brewhouse.io
app.run(function($rootScope, $state, $log, loginModal) {

  $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
    var requireLogin = toState.data.requireLogin;

    if ($rootScope.currentUser) {
      $log.log('current user is ' + dump($rootScope.currentUser, 'none'))
    }

    if (requireLogin && typeof $rootScope.currentUser === 'undefined') {
      event.preventDefault();

      loginModal()
        .then(
          function() {
            $rootScope.currentSite = toState.name
            return $state.go(toState.name, toParams)
          })
    }
  });
});

app.service('loginModal', function($mdDialog, $rootScope, $log) {

  /*
   * assignCurrentUser
   * Pre: user is an object w/ username, password, and carpool site returned by LoginModalController
   * Post: rootScope.currentUser & .myCarpoolSite are set from user, and user's login info is saved to local storage
   */
  function assignCurrentUser(user) {
    $log.log('assignCurrentUser ran!')
    $rootScope.currentUser = user
    $rootScope.myCarpoolSite = user.site
    //reload persons from new carpool site
    $rootScope.$broadcast('congifPersonsContainers')
    var cookieHasExpired = false
    //if already exists a record of user login in local storage, deteremine whether it has expired
    if (localStorage.getItem("user")) {
      var userInfo = JSON.parse(localStorage.getItem("user"))
      var currentExpirationDate = new Date(userInfo.expirationDate)
      var now = new Date()
      cookieHasExpired = currentExpirationDate.getTime() < now.getTime()
    }

    if (cookieHasExpired || !localStorage.getItem("user")) {
      //-- create new local storage record with expiration date set to midnight
      var expirationDate = new Date()
      expirationDate.setHours(24,0,0,0)
      user['expirationDate'] = expirationDate.toString()

      localStorage.setItem("user", JSON.stringify(user))
    }

    return user;
  }

  return function() {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/loginModalTemplate.html',
      clickOutsideToClose: false,
      controller: 'LoginModalController'
    }).then(function(user) {assignCurrentUser(user)})
  }
})

/*
 * UserAuth
 * Sends login input from LoginModalController to server for authentication. If valid, resolves a promise with user info.
 */
app.factory('UserAuth', ['$http', '$q', '$log', function($http, $q, $log) {

  return function(username, password, site) {
    var defer = $q.defer()

    $http({
      method: "POST",
      url: "app/appServer/login.php",
      params: {
        username: username,
        password: password
      }
    }).then(
      function(response) {
        var user = response.data
        // add site to user object, as specified on login form
        user['site'] = site
        $log.log('user.site is ' + user.site)
        defer.resolve(user)
      },
      function(error) {
        defer.reject(error)
      }
    )

    return defer.promise
  }
}])

/*
 * logout
 * Deletes $rootScope.currentUser and removes user data from local storage
 */
app.factory('logout', ['$rootScope', '$q', function($rootScope, $q) {
  return function() {
    var defer = $q.defer()

    delete $rootScope.currentUser
    localStorage.removeItem('user')

    while (true) {
      if (!$rootScope.currentUser && !localStorage.getItem('user')) {
        defer.resolve()
        return defer.promise
      }
    }
  }
}])

/*
 * changePasswordModal
 * Creates view and controller for changing password
 * Pre: myUsername is the name of the current user
 * Post: view and controller are initialized
 */
app.service('changePasswordModal', function($mdDialog, $rootScope, $log) {
  return function(myUsername) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/changePasswordModal.html',
      clickOutsideToClose: true,
      controller: 'ChangePasswordModalController',
      locals: {
        username: myUsername
      }
    })
  }
})

/*
 * changePassword
 * Used by ChangePasswordModalController to update user's password on server
 * Pre: myUsername is the username of the current user, and myNewPassword is a valid password
 * Post: user's password on server is set to myNewPassword
 */
app.service('changePassword', ['$q', '$http', '$log', function($q, $http, $log) {
  return function(myUsername, myNewPassword) {
    return $http({
      method: 'GET',
      url: "app/appServer/changePassword.php",
      params: {
        username: myUsername,
        newPassword: myNewPassword
      }
    })
  }
}])

/*
 * sitePickerGenerator
 * Shows a bottom sheet for assigning a site to a person
 * Pre: carpoolSite is an active carpool site, and project is a project for which this carpool site has >=1 active site
 * Post: A promise is resolved with the ID of the site assigned to the person
 */
app.factory('sitePickerGenerator', ['$mdBottomSheet', '$log', '$q', function($mdBottomSheet, $log, $q) {

  return function(carpoolSite, project, persons, drivers) {
    var defer = $q.defer()

    $mdBottomSheet.show({
      templateUrl: 'app/modalTemplates/sitePickerSheetTemplate.html',
      controller: 'SitePickerSheetController',
      locals: {
        myCarpoolSite: carpoolSite,
        selectedProject: project,
        myPersons: persons,
        myDrivers: drivers
      },
      parent: angular.element(document.body)
    }).then(function(selectedSite) {
      $log.log('selectedSite id' + selectedSite['projectSite_id'])
      defer.resolve(selectedSite['projectSite_id']);
    })

    return defer.promise
  }
}])


/*
 * getActiveSites
 * Request from server all project sites active for a given carpool site, optionally from a specific project
 * Pre: carpoolSite is a valid carpool site with at least one active project site; selectedProject is a valid project for which this carpool site has one active service site, or is null
 * Post: A promise is resolved with an object of objects representing active sites for this carpool site
 */
app.factory('getActiveSites', ['$http', '$log', '$q', '$mdDialog', function($http, $log, $q, $mdDialog) {
  var haveLoadedSites = false;
  var lastLoadedCarpoolSite = ''
  var activePlaySites = {};
  var activePlantSites = {};
  var activePaintSites = {};

  function getSitesPromise(carpoolSite, selectedProject) {
      // if (typeof deferred === 'undefined') {
      //   $log.log('***deferred is defined; should be deleted')
      //   delete deferred;
      // }
      var deferred = $q.defer()

      activePlaySites = {};
      activePlantSites = {};
      activePaintSites = {};

      // $log.log("carpoolSite for getActiveSites: " + carpoolSite)
      return $http({
        method: "GET",
        url: "app/appServer/getActiveSites.php",
        params: {carpoolSite: carpoolSite}
      }).then(function mySuccess(response) {
        // $log.log('getSites request was sent')
        if (Array.isArray(response.data)) {
          //-- for each active site returned by server, specify its icon and add it to the proper array
          // $log.log("response.data, from getActiveSites: " + dump(response.data, 'none'))
          response.data.forEach(function(currentSite) {
            switch (currentSite["project"]) {
              case "paint":
                currentSite["icon"] = "paint_icon.svg"
                activePaintSites[currentSite.projectSite_id] = currentSite;
                break;
              case "plant":
                currentSite["icon"] = "plant_icon.svg"
                activePlantSites[currentSite.projectSite_id] = currentSite;
                break;
              case "play":
                currentSite["icon"] = "play_icon.svg"
                activePlaySites[currentSite.projectSite_id] = currentSite;
                break;
            }
          })
        } else { // the server returned no active sites for this carpool site
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(true)
              .title('No Registered Volunteers')
              .textContent('It appears there are no cars assigned to this carpool site. Please try again, or select a different carpool site.')
              .ariaLabel('No One Registered Alert')
              .ok('Will do!')
          );
        }

        haveLoadedSites = true;
        // $log.log('haveLoadedSites' + haveLoadedSites)
        deferred.resolve('done')
        return deferred.promise
      });
  };

  function returnSites(selectedProject) {
      switch (selectedProject) {
        case "paint":
          return activePaintSites;
          break;
        case "plant":
          return activePlantSites;
          break;
        case "play":
          return activePlaySites;
          break;
        case "all":
          // assemble the allSites array here as opposed to on return from server to avoid assembling it if it is not needed
          var allSites = {};
          // $log.log("activePaintSites: " + dump(activePaintSites, 'none'))
          Object.keys(activePaintSites).forEach(function(currentSite) {
            allSites[currentSite] = activePaintSites[currentSite];
          })
          Object.keys(activePlantSites).forEach(function(currentSite) {
            allSites[currentSite] = activePlantSites[currentSite];
          })
          Object.keys(activePlaySites).forEach(function(currentSite) {
            allSites[currentSite] = activePlaySites[currentSite];
          })
          // $log.log("allSites, before return: " + dump(allSites, 'none'))
          return allSites;
          break;
        default:
          return null;
      }
  }

  return function(carpoolSite, selectedProject) {

    if (haveLoadedSites == true && lastLoadedCarpoolSite == carpoolSite) {
      var defer = $q.defer()
      defer.resolve(returnSites(selectedProject))
      return defer.promise
    } else {
      lastLoadedCarpoolSite = carpoolSite
      var defer = $q.defer()
      $log.log('gettingSites!')
      var promise = getSitesPromise(carpoolSite, selectedProject)
      promise.then(function mySuccess() {defer.resolve(returnSites(selectedProject))});
      return defer.promise
    }
  }
}])



//** It's possible this service is never used? Removing it is on the Trello to-do list
app.factory('checkOut', ['$http', '$log', '$q', function($http, $log, $q) {
  return function(personId) {
    $http({
      method: "GET",
      url: "app/appServer/checkOut.php",
      params: {id: personId}
    });
  }
}])

/*
 * LoginModalController
 * Provides interface between login modal form and UserAuth service
 */
app.controller('LoginModalController', ['$scope', '$mdDialog', '$log', '$window', 'UserAuth', 'getCarpoolSites', function($scope, $mdDialog, $log, $window, UserAuth, getCarpoolSites) {
  $log.log('LoginModalController was called!')

  $scope.myUsername = ''
  $scope.myPassword = ''
  $scope.myCarpoolSite = ''

  if (localStorage.getItem('user')) {
    $scope.myCarpoolSite = localStorage.getItem('user')
  }

  getCarpoolSites().then(function (sites) {
    $scope.carpoolSites = sites
  })

  $scope.cancelDialog = function() {
    $mdDialog.cancel()
  }

  $scope.submit = function(username, password, site) {
    $log.log('form submitted!')

    if (!$scope.loginForm.$valid) {
      $scope.loginForm.mySite.$error.required = true
      $scope.loginForm.mySite.$setValidity("required", false)
      var field = $window.document.getElementById('mySite')
      field.focus()
      return
    }

    UserAuth(username, password, site).then(
      function success(response) {
        $mdDialog.hide(response)
      },
      function failure(error) {
        $log.log('login error handler ran with error: ' + error.data)
        if (error.data == "usernameNotFound") {
          $scope.loginForm.username.$error.notFound = true
          $scope.loginForm.username.$setValidity("notFound", false)
          var field = $window.document.getElementById('usernameField')
          field.focus()
        } else if (error.data == "passwordIncorrect") {
          $log.log('login error handler ran with error: ' + error.data)
          $scope.loginForm.password.$error.wrongPassword = true
          $scope.loginForm.password.$setValidity("wrongPassword", false)
          var field = $window.document.getElementById('passwordField')
          field.focus()
        }
      }
    )
  }

  $scope.resetUsernameValidity = function() {
      $scope.loginForm.username.$setValidity("notFound", true)
  }

  $scope.resetPasswordValidity = function() {
    $scope.loginForm.password.$setValidity("wrongPassword", true)
  }
}])

/*
 * ChangePasswordModalController
 * Provides interface between change password modal form and changePassword service
 */
app.controller('ChangePasswordModalController', ['$scope', '$mdDialog', '$mdToast', '$log', '$window', 'UserAuth', 'changePassword', 'username', function($scope, $mdDialog, $mdToast, $log, $window, UserAuth, changePassword, username) {

  $scope.myUsername = username
  $scope.myPassword = ''
  $scope.myCarpoolSite = ''

  if (localStorage.getItem('user')) {
    $scope.myCarpoolSite = localStorage.getItem('user') //should this be .getItem('user').carpoolSite?
  }

  $scope.cancelDialog = function() {
    $mdDialog.cancel()
  }

  $scope.submit = function(oldPassword, newPassword, newPasswordVerify) {
    $log.log('form submitted with username ' + $scope.myUsername + ' and oldPassword ' + oldPassword)

    UserAuth($scope.myUsername, oldPassword, '').then(
      function success(response) {
        if (newPassword == newPasswordVerify) {
          changePassword($scope.myUsername, newPassword).then(function success() {
            $mdToast.showSimple("Password Changed")
            $mdDialog.hide()
          })
        } else {
          $scope.loginForm.newPassword.$error.passwordsDontMatch = true
          $scope.loginForm.newPasswordVerify.$error.passwordsDontMatch = true
          $scope.loginForm.newPassword.$setValidity("passwordsDontMatch", false)
          var field = $window.document.getElementById('newPasswordField')
          field.focus()
        }
      },
      function failure(error) {
        $log.log('login error handler ran with error: ' + error.data)
        if (error.data == "passwordIncorrect") {
          $log.log('login error handler ran with error: ' + error.data)
          $scope.loginForm.oldPassword.$error.wrongPassword = true
          $scope.loginForm.oldPassword.$setValidity("wrongPassword", false)
          var field = $window.document.getElementById('oldPasswordField')
          field.focus()
        }
      }
    )
  }

  $scope.resetPasswordValidity = function() {
    $scope.loginForm.oldPassword.$setValidity("wrongPassword", true)
  }
}])

/*
 * AttendanceController
 * Controls navigation between the 3 app tabs
 */
app.controller('AttendanceController', ['$scope', '$state', '$location', '$log', '$q', '$rootScope', function($scope, $state, $location, $log, $q, $rootScope) {
  $rootScope.currentState = $state.current.name
  $scope.stateIndexes = {
    'attendance.registered': 0,
    'attendance.checkedIn': 1,
    'attendance.assigned': 2
  }

  // selectedTab is used by the selected-tab attr of the md-tabs directive
  $scope.selectedTab = $scope.stateIndexes[$rootScope.currentState]
  $log.log('state is ' + $rootScope.currentState)

  // if currentState has changed, change selectedTab so mdTabs goes to corresponding tab
  $rootScope.$watch(
    function() {
      return $rootScope.currentState
    },
    function(newVal, oldVal) {
      if ($scope.selectedTab != $scope.stateIndexes[$rootScope.currentState]) {
        $scope.selectedTab = $scope.stateIndexes[$rootScope.currentState]
      }
    }
  )

  /*
   * gotoTab
   * Configures tab changing animation so slide is in the right direction, then goes to new tab's state
   * Pre: destinationTab is one of the three tabs
   * Post: animate transition classes are applied, $rootScope.currentState is set, and $state goes to destinationTab
   */
  $scope.gotoTab = function($event, destinationTab) {
    var defer = $q.defer()
    var deferPromise = defer.promise

    var originTab = $state.current.name
    $log.log('***originTab is ' + originTab + ' and destinationTab is ' + destinationTab)
    $scope.transitionClass = ''
    if (destinationTab == "registered") {
      $scope.transitionClass = 'right-to-left'
      var viewElem = angular.element(document).find('md-tabs').next().children()
      viewElem.removeClass('left-to-right')
      viewElem.addClass('right-to-left')
      defer.resolve()
      $log.log('transitionClass is ' + $scope.transitionClass)
    } else if (destinationTab == "assigned") {
      $scope.transitionClass = 'left-to-right'
      var viewElem = angular.element(document).find('md-tabs').next().children()
      viewElem.removeClass('right-to-left')
      viewElem.addClass('left-to-right')
      defer.resolve()
      $log.log('transitionClass is ' + $scope.transitionClass)
    } else if (destinationTab == "checkedIn") {
      if (originTab == "attendance.registered") {
        $log.log('originTab is registered!')
        $scope.transitionClass = 'left-to-right'
        var viewElem = angular.element(document).find('md-tabs').next().children()
        viewElem.removeClass('right-to-left')
        viewElem.addClass('left-to-right')
        defer.resolve()
      } else if (originTab == "attendance.assigned") {
        $scope.transitionClass = 'right-to-left'
        var viewElem = angular.element(document).find('md-tabs').next().children()
        viewElem.removeClass('left-to-right')
        viewElem.addClass('right-to-left')
        defer.resolve()
      }
      $log.log('transitionClass is ' + $scope.transitionClass)
    }

    deferPromise.then(function() {
      var destinationState = 'attendance.' + destinationTab
      $rootScope.currentState = destinationState
      $state.go(destinationState)
    })
 }
}])

// filter by jeffjohnson9046 on GitHub
app.filter('titlecase', function() {
    return function (input) {
        var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

        input = input.toLowerCase();
        return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
            if (index > 0 && index + match.length !== title.length &&
                match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
                return match.toLowerCase();
            }

            if (match.substr(1).search(/[A-Z]|\../) > -1) {
                return match;
            }

            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    }
});

//filter adapted from Justin Klemm on justinklemm.com
app.filter("orderByLastName", function(){
    return function(projectPersons, persons) {
        var personNames = []
        var sortedIds = []
        angular.forEach(projectPersons, function(personId) {
            personNames.push({
              'id': personId,
              'name': persons[personId].lastName
            })
        })
        personNames.sort(function(a, b) {
          return ((a.name > b.name) ? 1 : -1)
        })
        angular.forEach(personNames, function(person) {
          sortedIds.push(person.id)
        })
        return sortedIds
    };
});
