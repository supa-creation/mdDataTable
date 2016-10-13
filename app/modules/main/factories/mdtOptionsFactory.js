(function () {
  'use strict';

  function mdtOptionsFactory() {
    function MdtOptions(scope) {
      this.scope = scope;

      this.selectable = scope.mdtSelectable ? true : false;
      this.sortable = scope.mdtSortable ? true : false;
      this.paginate = scope.mdtPaginate ? true : false;
      this.rows = scope.mdtRows || null;
      this.rowService = scope.mdtRowService || null;
      this.paginateHandler = scope.mdtPaginateHandler || null;
    }

    return {
      getInstance: function (scope) {
        return new MdtOptions(scope);
      }
    };
  }

  angular
    .module('mdDataTable')
    .factory('mdtOptionsFactory', mdtOptionsFactory);
}());
