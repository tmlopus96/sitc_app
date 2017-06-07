app.factory('editRegInfo', ['$q', '$log', '$mdDialog', '$mdToast', 'updatePersonRegInfo', function($q, $log, $mdDialog, $mdToast, updatePersonRegInfo) {

  return function (myPersonId, $scope) {
    return $mdDialog.show({
      templateUrl: "app/modalTemplates/editRegInfo.html",
      scope: $scope,
      preserveScope: true,
      clickOutsideToClose: true,
      parent: angular.element(document.body),
      controller: 'EditRegInfoController',
      locals: {
        personId: myPersonId
      }
    })
  }
}])

app.controller('EditRegInfoController', ['$scope', '$log', '$mdDialog', '$mdToast', 'personId', 'updatePersonRegInfo', function($scope, $log, $mdDialog, $mdToast, personId, updatePersonRegInfo) {

  $scope.personId = personId

  $scope.persons[personId].numSeatbelts = parseInt($scope.persons[personId].numSeatbelts)

  $scope.updateParam = function (param, dbTable) {
    updatePersonRegInfo($scope.personId, param, $scope.persons[$scope.personId][param], dbTable).then(function success () {
      // var paramForToast = null
      // switch (param) {
      //   case 'firstName':
      //     paramForToast = 'first name'
      //     break
      //   case 'lastName':
      //     paramForToast = 'last name'
      //     break
      //   case 'hasCar':
      //     paramForToast = 'car info'
      //     break
      //   case 'numSeatbelts':
      //     paramForToast = 'number of seatbelts'
      //     break
      //   case 'primaryCarpool_id':
      //     paramForToast = 'primary carpool site'
      //     break
      //   case 'paymentStatus':
      //     paramForToast = 'payment status'
      //     break
      //   case 'paymentMethod':
      //     paramForToast = 'payment method'
      //     break
      //   case 'checkNumber':
      //     paramForToast = 'check number'
      //     break
      //   default:
      //     paramForToast = 'info'
      // }
      //
      // $mdToast.showSimple(`Updated ${$scope.persons[personId].firstName}'s ${paramForToast}.`)

    }, function failure () {

    })
  }

  $scope.close = function() {
    $mdDialog.cancel()
  }

  $scope.paymentMethods = [
    {
      value: 'credit',
      displayLabel: 'Credit'
    },
    {
      value: 'cash_check',
      displayLabel: 'Cash/check'
    },
    {
      value: 'waive',
      displayLabel: 'Waived'
    }
  ]

}])
