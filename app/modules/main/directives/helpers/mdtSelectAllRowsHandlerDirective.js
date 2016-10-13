(function(){
    'use strict';

    function mdtSelectAllRowsHandlerDirective(){
        return {
            restrict: 'A',
            scope: false,
            require: '^mdtTable',
            link: function($scope, element, attrs, ctrl){
                $scope.selectAllRows = false;

                $scope.$watch('selectAllRows', function(val){
                    ctrl.mdt.getStorage().setAllRowsSelected(val, ctrl.mdt.opt().paginate);
                });
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtSelectAllRowsHandler', mdtSelectAllRowsHandlerDirective);
}());
