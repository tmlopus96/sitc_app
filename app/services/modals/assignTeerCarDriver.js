app.factory('assignTeerCarDriver', ['$q', '$log', '$mdDialog', function($q, $log, $mdDialog) {

  return function(assignedToSite, $scope, forVan = null) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/assignTeerCarDriver.html',
      clickOutsideToClose: true,
      scope: $scope,
      preserveScope: true,
      locals: {
        myAssignedToSite: assignedToSite,
        myForVan: forVan
      },
      controller: ['$scope', 'myAssignedToSite', 'myForVan', function($scope, myAssignedToSite, myForVan) {

        var selectedDriver = ''
        $scope.assignedToSite = myAssignedToSite


        $scope.drivers = []
        if (myForVan) {
          angular.forEach($scope.persons, function (info, id) {isEligibleVanDriver(info, id)})
        }
        else {
          angular.forEach($scope.persons, function (info, id) {isEligibleTeerCarDriver(info, id)})
        }

        function isEligibleVanDriver (personInfo, id) {
          if (personInfo.isCrew == 1 && personInfo.isCheckedIn == 1) {
            $scope.drivers.push(id)
          }
        }

        function isEligibleTeerCarDriver (personInfo, id) {
          if (personInfo.hasCar == 1 && personInfo.isCheckedIn == 1 && personInfo.driverStatus != 'isTeerCarDriver') {
            $scope.drivers.push(id)
          }
        }

        // called on click of driver in bottom sheet
        $scope.selectWithDriver = function(selectedDriver) {
          $mdDialog.hide(selectedDriver)
        }
      }]
    })
  }
}])
