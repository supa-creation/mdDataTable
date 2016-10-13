(function () {
  'use strict';

  function mdtCardFooterDirective() {
    return {
      restrict: 'E',
      templateUrl: '/main/templates/mdtCardFooter.html',
      transclude: true,
      replace: true,
      scope: true,
      require: ['^mdtTable'],
      link: function ($scope) {
        var paginator = $scope.mdt.paginator();

        $scope.rowsPerPage = paginator.rowsPerPage;

        $scope.$watch('rowsPerPage', function (rowsPerPage) {
          paginator.setRowsPerPage(rowsPerPage);
        });
      }
    };
  }

  angular
    .module('mdDataTable')
    .directive('mdtCardFooter', mdtCardFooterDirective);
}());
