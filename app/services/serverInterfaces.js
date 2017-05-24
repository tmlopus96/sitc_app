var app = angular.module('attendanceApp')


/*** Getters ***/
app.factory('getCarpoolSites', ['$log', '$q', '$http', function($log, $q, $http) {

  var defer = $q.defer()

  return function() {
    $log.log('getCarpoolSites ran!')
    var defer = $q.defer()

    $http({
      url: "app/appServer/getCarpoolSites.php",
      method: "GET"
    }).then(
      function(response) {
        var sites = {}
        response.data.forEach(function(currentSite) {
          sites[currentSite.carpoolSite_id] = currentSite
        })

        defer.resolve(sites)
      },
      function(error) {
        //TODO error handling
      })

    return defer.promise
  }
}])

app.factory('getRegistered', ['$log', '$q', '$http', function($log, $q, $http) {

  return function(myCarpoolSite, myPersonId) {
    var defer = $q.defer()

    var paramsToPass = {}

    if (myCarpoolSite) {
      paramsToPass['carpoolSite'] = myCarpoolSite
    }

    if (myPersonId) {
      paramsToPass['person_id'] = myPersonId
    }

    $http({
      method: "GET",
      url: "app/appServer/getRegistered.php",
      params: paramsToPass
    }).then(function(response) {
      $log.log("getRegistered response: " + dump(response, 'none'))
      if (Array.isArray(response.data)) {
        defer.resolve(response.data)
      }
      else {
        defer.reject("Response not array")
      }
    })

    return defer.promise
  }
}])

app.factory('getTempRegistrations', ['$log', '$q', '$http', function($log, $q, $http) {

  return function(myCarpoolSite, myPersonId) {
    var defer = $q.defer()

    var paramsToPass = {}

    if (myCarpoolSite) {
      paramsToPass['carpoolSite'] = myCarpoolSite
    }

    if (myPersonId) {
      paramsToPass['temp_person_id'] = myPersonId
    }

    $http({
      method: "GET",
      url: "app/appServer/getTempRegistrations.php",
      params: paramsToPass
    }).then(function(response) {
      if (Array.isArray(response.data)) {
        defer.resolve(response.data)
      }
      else {
        defer.reject("Response not array")
      }
    })

    return defer.promise
  }
}])

/*** Setters ***/

/*
 * updateCheckedIn
 * Updates a person's check-in status parameters on the server
 * Pre: personId is a valid person, and valuesToUpdate contains check-in parameters to update on server
 * Post: Values are updated on server
 */
app.factory('updateCheckedIn', ['$http', '$log', '$q', function($http, $log, $q) {

  return function(personId, valuesToUpdate) {
    var defer = $q.defer()

    valuesToUpdate['id'] = parseInt(personId)
    $log.log("updateCheckedIn about to submit call to server!")
    $http({
      method: "GET",
      url: "app/appServer/updateCheckedIn.php",
      params: valuesToUpdate
    }).then(function success(response) {
      $log.log("Received response from updateCheckedIn: " + dump(response, 'none'))
      defer.resolve(response)
    })
    return defer.promise
  }
}])

app.factory('submitTempRegistration', ['$http', '$log', '$q', function($http, $log, $q) {

  return function (newTeerInfo) {
    var defer = $q.defer()
    $log.log("About to submit call to submitTempRegistration.php!")
    $http({
      method: "POST",
      url: "app/appServer/submitTempRegistration.php",
      params: {
        personInfo: newTeerInfo
      }
    }).then(function (response) {
      defer.resolve(response)
    })

    return defer.promise
  }

}])
