angular.module('MyApp')
.config(function($mdIconProvider) {
  $mdIconProvider
    .iconSet('social', 'img/icons/sets/social-icons.svg', 24)
    .iconSet('device', 'img/icons/sets/device-icons.svg', 24)
    .iconSet('communication', 'img/icons/sets/communication-icons.svg', 24)
    .defaultIconSet('img/icons/sets/core-icons.svg', 24);
})
.controller('ListCtrl', function($scope, $mdDialog) {
  $scope.messages = [
    {id: 1, title: "Message A", selected: false},
    {id: 2, title: "Message B", selected: true},
    {id: 3, title: "Message C", selected: true},
  ];

  $scope.actionOne = function(msg){
    alert(msg);
  }

  $scope.showActionThree = false;
  $scope.actionTwo = function(msg){
    $scope.showActionThree = true;
    alert(msg);
  }

  $scope.actionThree = function(msg){
    alert(msg);
  }
});
