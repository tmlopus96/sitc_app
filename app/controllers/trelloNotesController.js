app.controller('TrelloNotesController', ['$scope', '$rootScope', '$log', '$q', 'TrelloClient', 'getTrelloIds', function($scope, $rootScope, $log, $q, TrelloClient, getTrelloIds) {

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
      getCards().then(function(response){
        console.log(response);
        $scope.cards = response.data
      })
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

 function getCards () {
    return TrelloClient.get(`/lists/${$scope.trelloObjs[$scope.carpoolSite].id}/cards`)
  }

 function getBoards () {
    return TrelloClient.get('/boards/cards')
  }

  $scope.submitNewNote = function () {
    var config = {
      key: $scope.trelloObjs.api_key.id,
      token: localStorage.getItem('trello_token'),
      idList: $scope.trelloObjs[$scope.carpoolSite].id,
      name: $scope.newNoteText
    }
    TrelloClient.post('/cards', config).then(function (response) {
      $scope.cards.push(response.data)
      $scope.showTextarea = false
      $scope.newCardText = null
      console.log(response)
    })
  }

}])
