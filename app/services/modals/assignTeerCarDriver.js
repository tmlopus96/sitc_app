 /*
 * assignTeerCarDriver
 * Presents a modal with available drivers and asks user to select one to assign to a teerCar designation
 * Pre: - the selected driver is a driver/has a car
        - the selected driver is checked in
        - the selected driver is not alredy a teerCar driver
        - warn user if:
            - the selectedDriver is a van driver
            - the selected driver is a passenger in someone else's car
            - the selected driver has fewer seatbelts than the teerCar is slated for
 * Post:
 */
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


        $scope.eligibleDrivers = []
        if (myForVan) {
          angular.forEach($scope.persons, function (info, id) {isEligibleVanDriver(info, id)})
        }
        else {
          angular.forEach($scope.persons, function (info, id) {isEligibleTeerCarDriver(info, id)})
        }

        function isEligibleVanDriver (personInfo, id) {
          if (personInfo.isCrew == 1 && personInfo.isCheckedIn == 1) {
            $scope.eligibleDrivers.push(id)
          }
        }

        function isEligibleTeerCarDriver (personInfo, id) {
          if (personInfo.hasCar == 1 && personInfo.isCheckedIn == 1 && personInfo.driverStatus != 'isTeerCarDriver') {
            $scope.eligibleDrivers.push(id)
          }
        }

        $scope.getVanDrivenBy = function (driver) {
          $log.log("Driver: " + driver)
          $log.log("Vans: " + dump($scope.vans, 'none'))
          var keys = Object.keys($scope.vans)
          $log.log("Keys: " + dump(keys, 'none'))
          var vanId = null
          for (var i=0; i < keys.length; i++) {
            $log.log("i: " + i + "; parseInt(keys[i]): " + parseInt(keys[i]))
            if ($scope.vans[parseInt(keys[i])].driver_person_id == driver) {
              vanId = $scope.vans[keys[i]].van_id
              break
            }
          }
          return vanId
        }

        // called on click of driver in bottom sheet
        $scope.selectWithDriver = function(selectedDriver) {
          $mdDialog.hide(selectedDriver)
        }
      }]
    })
  }
}])
