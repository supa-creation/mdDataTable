(function () {
  'use strict';

  function mdtAlternateHeadersDirective(_) {
    return {
      restrict: 'E',
      templateUrl: '/main/templates/mdtAlternateHeaders.html',
      transclude: true,
      replace: true,
      scope: false,
      require: '^mdtTable',
      link: function ($scope, element, attrs, ctrl) {
        var mdtStorage = ctrl.mdt.getStorage();

        $scope.getNumberOfSelectedRows = _.bind(mdtStorage.getNumberOfSelectedRows, mdtStorage);

        $scope.deleteSelectedRows = function () {
          var deletedRows = mdtStorage.deleteSelectedRows().then(function(rows) {

          }, function(){

          });
        }
      }
    };
  }

  angular
    .module('mdDataTable')
    .directive('mdtAlternateHeaders', mdtAlternateHeadersDirective);
}());
