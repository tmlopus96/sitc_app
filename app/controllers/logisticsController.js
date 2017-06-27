app.controller('LogisticsController', ['$scope', '$rootScope', '$log', '$q', 'sitePickerGenerator', 'updateCheckedIn', 'getActiveSites', function($scope, $rootScope, $log, $q, sitePickerGenerator, updateCheckedIn, getActiveSites) {



}])

app.filter('crewInPersons', function () {

  return function (persons) {
    var crew = []
    angular.forEach(persons, function (personInfo, personId) {
      if (personInfo.isCrew == 1) {
        crew.push(personId)
      }
    })
    return crew
  }

})
