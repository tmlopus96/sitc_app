app.controller('AddNewVolunteerController', ['$scope', '$rootScope', '$state', '$log', '$q', 'submitTempRegistration', function($scope, $rootScope, $state, $log, $q, submitTempRegistration) {

  $scope.newTeerInfo = {}

  // Test values 
  // $scope.newTeerInfo.firstName = "Tristan"
  // $scope.newTeerInfo.lastName = "Lopus"
  // $scope.newTeerInfo.phone = '2483764670'
  // $scope.newTeerInfo.altPhone = '2484716548'
  // $scope.newTeerInfo.email = 'tristan.lopus@gmail.com'
  // $scope.newTeerInfo.emerCon_firstName = 'Michelle'
  // $scope.newTeerInfo.emerCon_lastName = 'Lopus'
  // $scope.newTeerInfo.emerCon_phone = '2489317076'
  // $scope.newTeerInfo.emerCon_altPhone = '2484716548'
  // $scope.newTeerInfo.initials = 'TL'
  // $scope.newTeerInfo.initialedDate = '5/23/2017'
  // $scope.newTeerInfo.parentInitials = 'ML'
  // $scope.newTeerInfo.parentInitialedDate = '5/23/2017'


  $scope.submitRegistration = function () {
    $scope.newTeerInfo['carpoolSite_id'] = $scope.carpoolSite
    submitTempRegistration($scope.newTeerInfo).then(function (response) {
      $log.log("Response from submitTempRegistration: " + dump(response, 'none'))

      $state.get('attendance.checkedIn').data['personToCheckInFromOtherSite'] = parseInt(response.data)
      $state.go('attendance.checkedIn', null, {notify: true})
    })
  }


}])
