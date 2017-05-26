app.factory('assignVanDriver', ['$q', '$log', '$mdDialog', function($q, $log, $mdDialog) {

  return function(assignedToSite, persons, projectSites) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/assignVanDriver.html',
      locals: {
        myAssignedToSite: assignedToSite,
        myPersons: persons,
        myProjectSites: projectSites
      },
      controller: ['$scope', 'myAssignedToSite', 'myPersons', 'myProjectSites', function($scope, myAssignedToSite, myPersons, myProjectSites) {

        var selectedDriver = ''
        $scope.assignedToSite = myAssignedToSite
        $scope.persons = myPersons
        $scope.projectSites = myProjectSites

        $scope.drivers = []
        angular.forEach($scope.persons, function (info, id, object) {
          if (info.isCheckedIn == 1 && info.isCrew) {
            $scope.drivers.push(id)
          }
        })
        $log.log("Drivers, in assignTeerCarDriver: " + dump($scope.drivers, 'none'))

        // called on click of driver in bottom sheet
        $scope.selectWithDriver = function(selectedDriver) {
          $mdDialog.hide(selectedDriver)
        }
      }]
    })
  }
}])
