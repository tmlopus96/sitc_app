app.controller('BugReportsController', ['$scope', '$rootScope', '$log', '$q', 'TrelloClient', 'getTrelloIds', function($scope, $rootScope, $log, $q, TrelloClient, getTrelloIds) {

  $scope.carpoolSite = $rootScope.myCarpoolSite
  $scope.isAuthenticated = false

  // get Trello ids
  getTrelloIds($scope.carpoolSite).then(function (trelloObjs) {
    $scope.trelloObjs = trelloObjs
  })

  if (localStorage.getItem('trello_token')) {
    $scope.isAuthenticated = true
    TrelloClient.get('/members/me').then(function (response) {
      $scope.username = response.data.username
    })
  } // else the view will show only a button asking the user to sign in

  $scope.authenticate = TrelloClient.authenticate

  $scope.$watch(
    function () {
      return localStorage.getItem('trello_token')
    },
    function (newVal, oldVal) {
      if (newVal == null) {
        $scope.isAuthenticated = false
      }
      else {
        $scope.isAuthenticated = true
      }
    }
  )

  $scope.submitReport = function () {
    var config = {
      key: $scope.trelloObjs.api_key.id,
      token: localStorage.getItem('trello_token'),
      idList: $scope.trelloObjs['attendance_bug_reports_list'].id,
      name: $scope.newReport.name,
      desc: $scope.newReport.desc,
      idLabels: "589dc7f0ced82109ff36db44"
    }
    TrelloClient.post('/cards', config).then(function (response) {
      $scope.showConfirmation = true
      $scope.newReport.name = null
      $scope.newReport.desc = null
      console.log(response)
    })
  }


}])
