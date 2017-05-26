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
      $log.log('current user is ' + $rootScope.currentUser)
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

  return function(carpoolSite, project) {
    var defer = $q.defer()

    $mdBottomSheet.show({
      templateUrl: 'app/modalTemplates/sitePickerSheetTemplate.html',
      controller: 'SitePickerSheetController',
      locals: {
        myCarpoolSite: carpoolSite,
        selectedProject: project
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
 * assignedSitePickerGenerator
 * Instantiates a view and a controller for picking a site
 * Pre: id is a valid person and currentSiteName is an active site
 * Post: Shows toast message explaining what action was executed by AssignedSitePickerSheetController
 */
app.factory('assignedSitePickerGenerator', ['$mdBottomSheet', '$log', '$q', '$mdToast', function($mdBottomSheet, $log, $q, $mdToast) {

  return function(id, currentSiteName, $scope) {
    var myId = id

    var defer = $q.defer()

    $mdBottomSheet.show({
      templateUrl: 'app/modalTemplates/assignedSitePickerSheetTemplate.html',
      controller: 'AssignedSitePickerSheetController',
      scope: $scope,
      preserveScope: true,
      locals: {
        parentScope: $scope,
        id: myId,
        currentSiteName: currentSiteName
      },
      parent: angular.element(document.body)
    }).then(function(action) { // action is returned by $mdBottomSheet.hide() in AssignedSitePickerSheetController

      // generate message string depending on what action was returned when the AssignedSitePicker modal was hidden
      function generateMessage(action) {
        var name = $scope.persons[myId].firstName

        var messages = {
          site: "Removed " + name + "'s site assignement.",
          project: "Removed " + name + "'s project assignment.",
          siteAndProject: "Removed " + name + "'s site and project assignements",
          checkOut: "Checked out " + name + "."
        }

        return messages[action]
      }

      $mdToast.showSimple(generateMessage(action))
    })

    return defer.promise
  }
}])

/*
 * driverPickerGenerator
 * Instantiates view and inline controller for assigning a person to a driver
 * Pre: activeDrivers is an array of all active drivers for a site
 * Post: Inline controller hides driver picker with id of selected driver; selectedDriver is ID of valid driver
 */
app.factory('driverPickerGenerator', ['$q', '$log', '$mdBottomSheet', function($q, $log, $mdBottomSheet) {

  return function(activeDrivers) {
    return $mdBottomSheet.show({
      templateUrl: 'app/modalTemplates/driverPicker.html',
      locals: { myActiveDrivers: activeDrivers },
      controller: ['$scope', 'myActiveDrivers', function($scope, myActiveDrivers) {

        var selectedDriver = ''
        $scope.activeDrivers = myActiveDrivers

        // called on click of driver in bottom sheet
        $scope.selectWithDriver = function(selectedDriver) {
          $mdBottomSheet.hide(selectedDriver)
        }
      }]
    })
  }
}])

/*
 * driverControlPanelGenerator
 * Instantiates view and inline controller for managing the passengers assigned to a driver
 * Pre: myDriver is a person who is checked in and is an active driver
 * Post:
 */
app.factory('driverControlPanelGenerator', ['$q', '$log', '$mdDialog', '$mdToast', 'driverStatus', 'assignToDriver', function($q, $log, $mdDialog, $mdToast, driverStatus, assignToDriver) {

  return function(myDriver, $scope, myTeerCarId = null, myVanId = null) {

    $log.log('ran driverControlPanelGenerator!')

    return $mdDialog.show({
      templateUrl: "app/modalTemplates/driverControlPanelTemplate.html",
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.body),
      locals: {
        driver: myDriver,
        teerCarId: myTeerCarId,
        vanId: myVanId
      },
      controller: ['scope', 'driver', 'teerCarId', 'vanId', function(scope, driver, teerCarId, vanId) {
        $log.log('driver for control panel is' + $scope.persons[driver].firstName)

        // create objects representing driver on the scope of this modal
        $scope.driver = driver
        $scope.myPassengers = []
        $scope.teerCarId = teerCarId
        $scope.vanId = vanId

        if ($scope.drivers[driver]) {
          $log.log('passengers alledgedly is defined')
          // push each of driver's passengers into array myPassengers on scope of this modal
          $scope.drivers[driver].passengers.forEach(function(currentPassenger) {
            $scope.myPassengers.push(currentPassenger)
          })
          var emptySeats = $scope.drivers[driver].numSeatbelts - $scope.drivers[driver].passengers.length
        } else {
          $log.log('else ran')
          var emptySeats = $scope.persons[driver].numSeatbelts
        }

        // for each empty seat, push an empty array element to myPassengers so that empty rows will appear in modal, signifying the open seats to the user
        for (var i=0; i < emptySeats; i++) {
          $scope.myPassengers.push('')
        }

        /*
         * updateDriverStatus
         * Update the status of a driver when their switch is toggled
         * Pre: personId is a valid person who is a driver
         * Post: If toggling driver to active, driver's status is now active; if toggling to inactive, driver's status is inactive, driver is deleted from $scope.drivers, and each of driver's passengers is update to have no driver
         */
        $scope.updateDriverStatus = function(personId) {
          // person.driverStatus controlled by switch in checkedIn and assigned directives
          $log.log('calling driverStatus on person ' + personId + 'with isDriver')
          var newStatus = $scope.persons[personId].driverStatus
          var driverPromise = driverStatus(personId, newStatus)
          driverPromise.then(function() {
            var driverName = $scope.persons[personId].firstName
            if (newStatus == 'isDriver') {
              $scope.drivers[personId] = {
                "numSeatbelts": $scope.persons[personId].numSeatbelts,
                "passengers": [],
                "carMake": $scope.persons[personId].carMake,
              }
              var message = "Added Driver: "
            } else {
              if ($scope.drivers.hasOwnProperty(personId)) {
                $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
                  // set each passenger's driver to null on the server and the scope
                  assignToDriver(currentPassenger, '')
                  $scope.persons[currentPassenger].assignedToDriver_id = null
                })
                delete $scope.drivers[personId]
              }
              var message = "Removed Driver: "
            }
            $scope.closeDialog()
            $mdToast.showSimple(message + driverName)
          })
        }

        /*
         * removePassenger
         * Remove specified passenger from this driver when X is clicked in their driver control panel
         * Pre: passengerId is a person who is currently assigned to this driver
         * Post: passengerId's driver is set to null, on both the server and the scope, and they are spliced from this driver's passengers
         */
        $scope.removePassenger = function(passengerId) {
          // on server
          assignToDriver(passengerId, '')
          // on scope
          $scope.persons[passengerId].assignedToDriver_id = null
          var index = $scope.drivers[$scope.driver].passengers.indexOf(passengerId)
          $scope.drivers[$scope.driver].passengers.splice(index, 1)
          $scope.myPassengers.splice(index, 1)
        }

        $scope.unassignDriverFromTeerCar = function(driver) {
          $mdDialog.hide('removeDriver')
        }

        $scope.closeDialog = function() {
          $mdDialog.cancel()
        }
      }]
    })
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
 * driverStatus
 * Updates a person's driver status on the server
 * Pre: personId is a person who is a driver
 * Post: The person's driver status on the server is set to newStatus
 */
app.factory('driverStatus', ['$http', '$log', function($http, $log) {
  return function(personId, newStatus) {
    return $http({
      method: "GET",
      url: "app/appServer/driverStatus.php",
      params: {
        personId: personId,
        status: newStatus
      }
    })
  }
}])

/*
 * assignToDriver
 * Updates server to reflect driver assigned to personId
 * Pre: personId is a valid person who is not an active driver, and driverId is an active driver
 * Post: personId's driver on the server is set to driverId
 */
app.factory('assignToDriver', ['$http', '$log', function($http, $log) {
  return function(personId, driverId) {
    return $http({
      method: "GET",
      url: "app/appServer/assignToDriver.php",
      params: {
        personId: personId,
        driverId: driverId
      }
    })
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




/*
 * AssignedController
 * Controls Assigned app tab
 */
app.controller('AssignedController', ['$scope', '$log', '$q', '$mdToast', '$location', '$anchorScroll', '$rootScope', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', 'getActiveSites', 'assignedSitePickerGenerator', function($scope, $log, $q, $mdToast, $location, $anchorScroll, $rootScope, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator, getActiveSites, assignedSitePickerGenerator) {

    // we need this in the AssignedController because, on a state change to Registered or CheckedIn, hideSpeedDialButtons() gets called on those tabs from here
    function hideSpeedDialButtons(){
         var speedDialButton_first = angular.element(document.querySelectorAll('#speedDialActionButton_first')).parent()
         var speedDialButton_second = angular.element(document.querySelectorAll('#speedDialActionButton_second')).parent()
         var speedDialButton_third = angular.element(document.querySelectorAll('#speedDialActionButton_third')).parent()

         speedDialButton_first.css({'transform':'translate(52px)', 'z-index':'-21'})
         speedDialButton_second.css({'transform':'translate(104px)', 'z-index':'-22'})
         speedDialButton_third.css({'transform':'translate(156px)', 'z-index':'-23'})
       }

     $scope.$on('$stateChangeSuccess', function(event, toState) {
       $log.log('stateChangeSuccess func ran! with toState ' + toState.name)

       if (toState.name == 'attendance.registered' || toState.name == 'attendance.checkedIn' || toState.name == 'attendance.assigned') {
         setTimeout(function(){hideSpeedDialButtons()}, 0)
         }
       })

     // for anchor buttons
     $scope.goToSectionHeader = function(sectionId) {
       $log.log('running goToSectionHeader for section ' + sectionId)
       var id = sectionId + "Header"
       $location.hash(id)
       $anchorScroll()
     }

      // --- Declare and init activeSites container
       $scope.activeSites = {
         'paint': [],
         'plant': [],
         'play': []
       }

       getActiveSites($rootScope.myCarpoolSite, 'paint').then(function(sites) {
         $log.log('updated activeSites[paint]')
         $scope.activeSites['paint'] = sites
       })

       getActiveSites($rootScope.myCarpoolSite, 'plant').then(function(sites) {
         $log.log('updated activeSites[plant]')
         $scope.activeSites['plant'] = sites
       })

       getActiveSites($rootScope.myCarpoolSite, 'play').then(function(sites) {
         $log.log('updated activeSites[plant]')
         $scope.activeSites['play'] = sites
       })

     $scope.numCheckedInForProject = function(project) {
       var numCheckedIntoProj = 0
       var numInThisProjSite = 0
       Object.keys($scope.activeSites[project]).forEach(function(siteId) {
          numInThisProjSite = $scope.projectSitesWithPersons[siteId].length
          numCheckedIntoProj += numInThisProjSite
        })
       $log.log('numCheckedInto ' + project + ' is ' + $scope.numCheckedIn[project])
       return numCheckedIntoProj
     }

     //--- declare and init numCheckedIn container
       $scope.numCheckedIn = {
         "paint" : [],
         "plant" : [],
         "play" : []
       }

       $scope.numCheckedIn["paint"] = $scope.numCheckedInForProject('paint')
       $scope.numCheckedIn["plant"] = $scope.numCheckedInForProject('plant')
       $scope.numCheckedIn["play"] = $scope.numCheckedInForProject('play')


       // --- Watch the number of elements in the checked-in-persons arrays and update accordingly
       $scope.$watch(function() {
         return $scope.numCheckedInForProject('paint')
       },
       function(newVal, oldVal) {
         $scope.numCheckedIn['paint'] = newVal
       }
     )

       $scope.$watch(function() {
         return $scope.numCheckedInForProject('plant')
       },
       function(newVal, oldVal) {
         //$log.log('*** Watch callback for numCheckIn ran with oldVal ' + oldVal + ' and newVal ' + newVal)
         $scope.numCheckedIn['plant'] = newVal
       }
     )

       $scope.$watch(function() {
         return $scope.numCheckedInForProject('play')
       },
       function(newVal, oldVal) {
         $log.log('*** Watch callback for numCheckIn ran with oldVal ' + oldVal + ' and newVal ' + newVal)
         $scope.numCheckedIn['play'] = newVal
       }
     )
   //--- end watch functions

   /*
    * checkInPerson
    * Updates $scope arrays to reflect changes to persons's checkin status parameters, then updates them on the server.
    * Pre: personId is a valid person; selectedProject is a valid project, or null
    * Post: $scope arrays and server have been updated to reflect changes to person's checkin status parameters. corresponding view updates are automatically triggered by changes to $scope arrays (i.e. person is moved to the correct list in the correct tab).
    */
    $scope.checkInPerson = function(personId, selectedProject, arrayLoc) {
      // array of active drivers to pass to driverPickerGenerator (because it cannot access the CheckedInController's scope)
      function updateArrays() {
        var deferred = $q.defer();
        var valuesToUpdate = {"id":personId, "carpoolSite":$scope.carpoolSite, "project":selectedProject}

        var promise = sitePickerGenerator($scope.carpoolSite, selectedProject)
        promise.then(function(selectedSite) {
          if (selectedSite == 'allSites') {
            $scope.projectsWithPersons[selectedProject].push(personId)
            $scope.persons[personId].assignedToProject = selectedProject
            deferred.resolve(valuesToUpdate)
          } else {
            $scope.projectSitesWithPersons[selectedSite].push(personId)
            $scope.persons[personId].assignedToSite_id = selectedSite
            valuesToUpdate["site"] = selectedSite;
            deferred.resolve(valuesToUpdate)
          }
        })

        return deferred.promise
      }

      var promise = updateArrays();
      promise.then(function(valuesToUpdate) {
        updateCheckedIn(personId, valuesToUpdate)
        var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
        $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
      })
    }

     $scope.getAssignedSitePicker = function(id, siteName) {
       $log.log('getAssignedSitePicker was called on click')
       var generatorPromise = assignedSitePickerGenerator(id, siteName, $scope)
     }

     // --- Driver business
     $scope.updateDriverStatus = function(personId) {
       // person.driverStatus controlled by switch in checkedIn and assigned directives
       //TODO add a warning about how toggling a driver off will remove their passengers
       $log.log('calling driverStatus on person ' + personId + 'with isDriver')
       var newStatus = $scope.persons[personId].driverStatus
       var driverPromise = driverStatus(personId, newStatus)
       driverPromise.then(function() {
         var driverName = $scope.persons[personId].firstName
         if (newStatus == 'isDriver') {
           $scope.drivers[personId] = {
             "numSeatbelts": $scope.persons[personId].numSeatbelts,
             "passengers": [],
             "carMake": $scope.persons[personId].carMake,
           }
           var message = "Added Driver: "
         } else {
           if ($scope.drivers.hasOwnProperty(personId)) {
             $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
               assignToDriver(currentPassenger, '')
               $scope.persons[currentPassenger].assignedToDriver_id = null
             })
             delete $scope.drivers[personId]
           }
           var message = "Removed Driver: "
         }
         $mdToast.showSimple(message + driverName)
       })
     }

     $scope.assignDriver = function(personId) {
       var activeDrivers = new Array()
       for (var id in $scope.persons) {
         if ($scope.persons[id].hasOwnProperty("driverStatus")) {
           if ($scope.persons[id].driverStatus == "isDriver" || $scope.persons[id].driverStatus == "isVanDriver" || $scope.persons[id].driverStatus == "isTeerCarDriver") {
             var projectSite = ($scope.persons[id].assignedToSite_id != null) ? $scope.persons[id].assignedToSite_id : null
             $log.log('this driver is assigned to site ' + projectSite)
             var projectSiteName = ($scope.projectSites[projectSite] != null) ? $scope.projectSites[projectSite].name : ''
             activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName, "project":$scope.persons[id].assignedToProject, "site":projectSiteName})
           }
         }
       }

       var driverPromise = driverPickerGenerator(activeDrivers)
       driverPromise.then(function(selectedDriver) {
         // if selectedDriver=='', person is being unassigned, so save driver they are being unassigned from for toast message later
         if (selectedDriver == '') {
           var prevDriver = $scope.persons[personId].assignedToDriver_id
         }

         //in case unassign is called on already-unassigned person
         if (selectedDriver == '' && (prevDriver == '' || prevDriver == null || prevDriver == 0)) {
           return
         }

         $scope.persons[personId].assignedToDriver_id = selectedDriver
         $log.log('about to call assignToDriver on person ' + personId + ' to driver ' + selectedDriver)
         var assignDriverPromise = assignToDriver(personId, selectedDriver)
         assignDriverPromise.then(function mySuccess() {
           var personName = $scope.persons[personId].firstName

           if ($scope.drivers[selectedDriver]) {
             var driverName = $scope.persons[selectedDriver].firstName
             $scope.drivers[selectedDriver].passengers.push(personId)
             $mdToast.show($mdToast.simple().textContent('Assigned ' + personName + ' to driver ' + driverName))
           } else if (prevDriver != '') {
             var driverName = $scope.persons[prevDriver].firstName
             var passengerIndex = $scope.drivers[prevDriver].passengers.indexOf(personId)
             $scope.drivers[prevDriver].passengers.splice(passengerIndex, 1)
             $mdToast.show($mdToast.simple().textContent('Removed ' + personName + ' from ' + driverName + '\'s car'))
           }
         })
       })
     }

     $scope.driverControlPanel = function(driver) {driverControlPanelGenerator(driver, $scope)}
}])

/*
 * SitePickerSheetController
 * Controller for site picker bottom sheet view, generated by sitePickerGenerator service
 */
app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', 'getActiveSites', '$rootScope', 'selectedProject', function($scope, $log, $mdBottomSheet, getActiveSites, $rootScope, selectedProject) {

  //TODO pass this in somehow (made Trello card)
  $log.log('calling getActiveSites with carpool site ' + $rootScope.myCarpoolSite + ' and project ' + selectedProject)
  var activeSitesPromise = getActiveSites($rootScope.myCarpoolSite, selectedProject)
  activeSitesPromise.then(function(activeSites) {
    $scope.sites = activeSites
  })

  $scope.allSitesDefault = [
    { name: 'allSites', projectSite_id: 'allSites', icon: 'watch_later'}
  ]

  $scope.listItemClick = function(siteId) {
    if (siteId == 'allSites') {
      var selectedSite = $scope.allSitesDefault[0]
      $log.log('$index is ' + selectedSite + '!')
    }
    else {
      var selectedSite = $scope.sites[siteId];
    }

    $log.log('selectedSite is ' + selectedSite["name"])
    $mdBottomSheet.hide(selectedSite);
  };
}])

/*
 * AssignedSitePickerSheetController
 * Controls site picker bottom sheets for editing assignments in the Assigned tab, generated by assignedSitePickerGenerator
 */
app.controller('AssignedSitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', 'getActiveSites', '$rootScope', 'updateCheckedIn', 'checkOut', 'id', 'currentSiteName', 'assignToDriver', 'driverStatus', 'parentScope', function($scope, $log, $mdBottomSheet, getActiveSites, $rootScope, updateCheckedIn, checkOut, id, currentSiteName, assignToDriver, driverStatus, parentScope) {

  var myParentScope = parentScope
  $scope.id = id
  $scope.currentSiteName = currentSiteName

  /*
   * removeAssignment
   * Removes a persons assigned site and/or project. The values to update are specified by the three boolean parameters
   * Pre: removeSite, removeProject, and calledByCheckOut are bools set in assignedSitePickerSheetTemplate
   * Post: Postconditions
   */
  $scope.removeAssignment = function(removeSite, removeProject, calledByCheckOut) {
    valuesToUpdate = {
      "id" : $scope.id,
      "carpoolSite" : $rootScope.myCarpoolSite,
      "site" : "NULL"
    }

    if (removeProject) {
      valuesToUpdate["project"] = "NULL"
    }

    updateCheckedIn($scope.id, valuesToUpdate)

    // -- Update persons containers
    if (removeSite) {
      $log.log('id of person to remove assignment is ' + $scope.id)
      var site = myParentScope.persons[$scope.id].assignedToSite_id
      $log.log('site to remove is ' + site)
      var index = myParentScope.projectSitesWithPersons[site].indexOf($scope.id)
      myParentScope.projectSitesWithPersons[site].splice(index, 1)
      myParentScope.persons[$scope.id].assignedToSite_id = ''

      var project = myParentScope.persons[$scope.id].assignedToProject
      myParentScope.projectsWithPersons[project].push($scope.id)
    }

    if (removeProject) {
      var project = myParentScope.persons[$scope.id].assignedToProject
      var index = myParentScope.projectsWithPersons[project].indexOf($scope.id)
      myParentScope.projectsWithPersons[project].splice(index, 1)
      myParentScope.persons[$scope.id].assignedToProject = 'all'
      myParentScope.projectsWithPersons['all'].push($scope.id)
    }

    // if this function was not called by checkOut, we are done; hide the $mdBottomSheet with the action that we executed
    if (!calledByCheckOut) {
      if (removeProject && removeSite) {
        $mdBottomSheet.hide('siteAndProject')
      } else if (removeSite) {
        $mdBottomSheet.hide('site')
      } else if (removeProject) {
        $mdBottomSheet.hide('project')
      }
    }
  }

  $scope.checkOut = function() {
    $scope.removeAssignment(true, true, true)

    var index = myParentScope.projectsWithPersons['all'].indexOf(id)
    myParentScope.projectsWithPersons['all'].splice(index, 1)
    myParentScope.persons[id].assignedToProject = ''
    myParentScope.persons[id].assignedToSite_id = ''

    if (myParentScope.persons[id].assignedToDriver_id) {
      var driver = myParentScope.persons[id].assignedToDriver_id
      var passengerIndex = myParentScope.drivers[driver].passengers.indexOf(id)
      myParentScope.drivers[driver].passengers.splice(passengerIndex, 1)
      myParentScope.persons[id].assignedToDriver_id = ''
      assignToDriver(id, '')
    }

    myParentScope.registeredPersons.push(id)

    $mdBottomSheet.hide('checkOut')
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
