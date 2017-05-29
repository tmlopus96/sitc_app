/*
 * driverPickerGenerator
 * Instantiates view and inline controller for assigning a person to a driver
 * Pre: - activeDrivers is an array of all active drivers for a site
        - activeDrivers' cars are not full
 * Post: Inline controller hides driver picker with id of selected driver; selectedDriver is ID of valid driver
 */
app.factory('driverPickerGenerator', ['$q', '$log', '$mdBottomSheet', function($q, $log, $mdBottomSheet) {

  return function(forPerson, activeDrivers, $scope) {
    return $mdBottomSheet.show({
      templateUrl: 'app/modalTemplates/driverPicker.html',
      scope: $scope,
      preserveScope: true,
      locals: {
        myActiveDrivers: activeDrivers,
        myForPerson: forPerson
      },
      controller: ['scope', 'myActiveDrivers', 'myForPerson', function(scope, myActiveDrivers, myForPerson) {

        var selectedDriver = ''
        $scope.activeDrivers = myActiveDrivers
        $scope.forPerson = $scope.persons[forPerson]

        // called on click of driver in bottom sheet
        $scope.selectWithDriver = function(selectedDriver) {
          $mdBottomSheet.hide(selectedDriver)
        }
      }]
    })
  }
}])
