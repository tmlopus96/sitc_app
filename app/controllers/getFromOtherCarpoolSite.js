var app = angular.module('attendanceApp')

app.controller('GetFromOtherCarpoolSiteController', ['$scope', '$rootScope', '$state', '$log', '$q', 'getRegistered', function($scope, $rootScope, $state, $log, $q, getRegistered) {

  $scope.volunteers = []

  $scope.getVolunteers = function() {
    $scope.volunteers = []
    $log.log("Running get registered for carpoolSite: " + $scope.otherCarpoolSite)
    if ($scope.otherCarpoolSite == 'all') {
      var carpoolSite = null
    }
    else {
      var carpoolSite = $scope.otherCarpoolSite
    }
    getRegistered(carpoolSite).then(function (teersArr) {
      $log.log("teersArr: " + dump(teersArr, 'none'))
      $scope.volunteers = teersArr
    })
  }

  $scope.goToCheckedIn = function (withVolunteer) {
    $log.log("withVolunteer: " + withVolunteer)
    $state.get('attendance.checkedIn').data['personToCheckInFromOtherSite'] = withVolunteer
    $state.go('attendance.checkedIn', null, {notify: true})
  }

}])
