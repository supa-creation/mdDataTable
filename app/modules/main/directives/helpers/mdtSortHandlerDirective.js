(function () {
  'use strict';

  function mdtSortHandlerDirective() {
    return {
      restrict: 'A',
      scope: false,
      require: '^mdtTable',
      link: function ($scope, element, attrs, ctrl) {
        var columnIndex = $scope.$index;
        var paginator = ctrl.mdt.paginator();

        function isSorted() {
          if (paginator) {
            return paginator.getSortOptions().index === columnIndex;
          } else {
            return ctrl.mdt.getStorage().sortByColumnLastIndex === columnIndex;
          }
        }


        function sortHandler() {
          if ($scope.mdt.opt().sortable && !$scope.headerRowData.noSort) {
            if (paginator) {
              var newDirection = (isSorted() && $scope.direction) < 0 ? 1 : -1;
              $scope.$apply(function () {
                paginator.sortBy(columnIndex, newDirection);

                $scope.direction = newDirection;
              });

            } else {
              $scope.$apply(function () {
                $scope.direction = ctrl.mdt.getStorage().sortByColumn(columnIndex, $scope.headerRowData.sortBy);
              });
            }
          }
        }

        $scope.direction = 1;

        $scope.isSorted = isSorted;

        element.on('click', sortHandler);
        $scope.$on('$destroy', function () {
          element.off('click', sortHandler);
        });
      }
    };
  }

  angular
    .module('mdDataTable')
    .directive('mdtSortHandler', mdtSortHandlerDirective);
}());
