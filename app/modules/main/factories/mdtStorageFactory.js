(function () {
  'use strict';

  function mdtStorageFactory($log, _) {

    function MdtStorage() {
      this.storage = [];
      this.header = [];
      this.customCells = {};

      this.sortByColumnLastIndex = null;
      this.orderByAscending = true;
    }

    MdtStorage.prototype.addHeaderCellData = function (ops) {
      this.header.push(ops);
    };

    MdtStorage.prototype.addRowData = function (explicitRowId, rowArray, className) {
      if (!(rowArray instanceof Array)) {
        $log.error('`rowArray` parameter should be array');
        return;
      }

      this.storage.push({
        rowId: explicitRowId,
        optionList: {
          selected: false,
          deleted: false,
          visible: true,
          className: className || false
        },
        data: rowArray
      });
    };

    MdtStorage.prototype.getRowData = function (index) {
      if (!this.storage[index]) {
        $log.error('row is not exists at index: ' + index);
        return;
      }

      return this.storage[index].data;
    };

    MdtStorage.prototype.getRowOptions = function (index) {
      if (!this.storage[index]) {
        $log.error('row is not exists at index: ' + index);
        return;
      }

      return this.storage[index].optionList;
    };

    MdtStorage.prototype.setAllRowsSelected = function (isSelected, isPaginationEnabled) {
      if (typeof isSelected === 'undefined') {
        $log.error('`isSelected` parameter is required');
        return;
      }

      _.each(this.storage, function (rowData) {
        if (isPaginationEnabled) {
          if (rowData.optionList.visible) {
            rowData.optionList.selected = isSelected ? true : false;
          }
        } else {
          rowData.optionList.selected = isSelected ? true : false;
        }
      });
    };

    MdtStorage.prototype.reverseRows = function () {
      this.storage.reverse();
    };

    MdtStorage.prototype.sortByColumn = function (columnIndex, iteratee) {
      if (this.sortByColumnLastIndex === columnIndex) {
        this.reverseRows();

        this.orderByAscending = !this.orderByAscending;
      } else {
        this.sortByColumnIndex(columnIndex, iteratee);

        this.sortByColumnLastIndex = columnIndex;
        this.orderByAscending = true;
      }

      return this.orderByAscending ? -1 : 1;
    };

    MdtStorage.prototype.sortByColumnIndex = function (index, iteratee) {

      var sortFunction;
      if (typeof iteratee === 'function') {
        sortFunction = function (rowData) {
          return iteratee(rowData.data[index].value, rowData, index);
        };
      } else {
        sortFunction = function (rowData) {
          return rowData.data[index].value;
        };
      }

      var res = _.sortBy(this.storage, sortFunction);

      this.storage = res;
    };

    MdtStorage.prototype.isAnyRowSelected = function () {
      return _.some(this.storage, function (rowData) {
        return rowData.optionList.selected === true && rowData.optionList.deleted === false;
      });
    };

    MdtStorage.prototype.getNumberOfSelectedRows = function () {
      var res = _.countBy(this.storage, function (rowData) {
        return rowData.optionList.selected === true && rowData.optionList.deleted === false ? 'selected' : 'unselected';
      });

      return res.selected ? res.selected : 0;
    };

    MdtStorage.prototype.deleteSelectedRows = function () {
        // if (angular.isDefined(this.mdt.getScope().mdtRowDeleteHandler)) {
        //   ctrl.mdtPaginationHelper.mdtRowDeleteHandler({id: mdtStorage.getSelectedRows()}).then(function (result) {
        //
        //
        //     ctrl.mdtPaginationHelper.reloadPage();
        //   });
        // } else {
        var deletedRows = [];
        _.each(this.storage, function (rowData) {
          if (rowData.optionList.selected && rowData.optionList.deleted === false) {

            if (rowData.rowId) {
              deletedRows.push(rowData.rowId);

              //Fallback when no id was specified
            } else {
              deletedRows.push(rowData.data);
            }

            rowData.optionList.deleted = true;
          }
        });
     // }

      return deletedRows;
    };


    MdtStorage.prototype.getSelectedRows = function () {
      var selectedRows = [];

      _.each(this.storage, function (rowData) {
        if (rowData.optionList.selected && rowData.optionList.deleted === false) {

          if (rowData.rowId) {
            selectedRows.push(rowData.rowId);

            //Fallback when no id was specified
          } else {
            selectedRows.push(rowData.data);
          }
        }
      });

      return selectedRows;
    };

    MdtStorage.prototype.getSavedRowData = function (rowData) {
      var rawRowData = [];

      _.each(rowData.data, function (aCell) {
        rawRowData.push(aCell.value);
      });

      return rawRowData;
    };

    return {
      getInstance: function (mdtTable) {
        return new MdtStorage(mdtTable);
      }
    };
  }

  angular
    .module('mdDataTable')
    .factory('mdtStorageFactory', mdtStorageFactory);
}());
