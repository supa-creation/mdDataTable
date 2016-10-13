(function(){
    'use strict';

    /**
     * @description
     * Component resolution and creation flow:
     *
     * Because directives are not containing each other in their templates (e.g. not a general parent-child
     * relationship), that's why the resolution of different components are not obvious. They are working with
     * transclusion and it's rule will apply to the process flow.
     * Here is an overview on what directives and which part of that will execute in which order.
     *
     * 1. `mdtTable` controller
     *         - basic services initialized for future usage by other directives
     *
     * 2. `mdtTable` link
     *         - transclude `mdtHeaderRow` and all `mdtRow` elements generated contents (however it's not relevant,
     *           the real generated content is generated with the help of the collected data by `TableStorageService`.
     *         - bind some helper functions for real the generated content
     *
     * 3. Header resolution
     *
     *     3.1. `mdtHeaderRow` link
     *              - transclude all `mdtColumn` directive's generated contents
     *
     *     3.2. `mdtColumn` link(s)
     *              - add columns by the help of the `mdtTable` public API
     *              - contents generated but not yet transcluded
     *
     * 4. Rows resolution
     *
     *     4.1. `mdtRows` controller(s)
     *              - public function created which able to add a cell data to the locally stored array
     *
     *     4.2. `mdtRows` link(s)
     *              - transclude all `mdtCell` directive's generated  contents
     *              - add the collected row data to the service by the help of `mdtTable` public API
     *
     *     4.3. `mdtCell` link(s)
     *              - add cells data by the help of `mdtRow` public API
     *              - contents generated but not yet transcluded
     *
     */
    angular.module('mdDataTable', ['mdtTemplates', 'ngMaterial', 'ngMdIcons', 'ngSanitize']);
}());

(function(){
    'use strict';

    InlineEditModalCtrl.$inject = ['$scope', 'position', 'cellData', 'mdtTranslations', '$timeout', '$mdDialog'];
    function InlineEditModalCtrl($scope, position, cellData, mdtTranslations, $timeout, $mdDialog){

        $timeout(function() {
            var el = $('md-dialog');
            el.css('position', 'fixed');
            el.css('top', position['top']);
            el.css('left', position['left']);

            el.find('input[type="text"]').focus();
        });

        $scope.cellData = cellData;

        $scope.saveRow = saveRow;
        $scope.cancel = cancel;

        function saveRow(){
            if($scope.editFieldForm.$valid){
                $mdDialog.hide(cellData.value);
            }
        }

        function cancel(){
            $mdDialog.cancel();
        }
    }

    angular
        .module('mdDataTable')
        .controller('InlineEditModalCtrl', InlineEditModalCtrl);
}());

(function () {
  'use strict';

  mdtAlternateHeadersDirective.$inject = ['_'];
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

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name mdtTable
   * @restrict E
   *
   * @description
   * The base HTML tag for the component.
   *
   * @param {boolean=} mdtSelectable when set each row will have a checkbox
   *
   * @param {boolean=} mdtPaginate if set then basic pagination will applied to the bottom of the table.
   *
   *      Properties:
   *
   *      - `{boolean=}` `isEnabled` - enables pagination
   *      - `{array}` `rowsPerPageValues` - set page sizes. Example: [5,10,20]
   *
   * @param {boolean=} mdtSortable sort data and display a sorted state in the header. Clicking on a column which
   *      is already sorted will reverse the sort order and rotate the sort icon.
   *      (not implemented yet: Use `sortable-rows-default` attribute directive on a column which intended to be the
   *      default sortable column)
   *
   *
   * @param {object=} mdtRows passing rows data through this attribute will initialize the table with data. Additional
   *      benefit instead of using `mdt-row` element directive is that it makes possible to listen on data changes.
   *
   *      Properties:
   *
   *      - `{array}` `data` - the input data for rows
   *      - `{integer|string=}` `table-row-id-key` - the uniq identifier for a row
   *      - `{function(rowData)=}` `table-row-class-name` - callback to specify the class name of a row
   *      - `{array}` `column-keys` - specifying property names for the passed data array. Makes it possible to
   *        configure which property assigned to which column in the table. The list should provided at the same order
   *        as it was specified inside `mdt-header-row` element directive.
   *
   * @param {function(page, pageSize)=} mdtPaginateHandler providing the data for the table by a function. Should set a
   *      function which returns a promise when it's called. When the function is called, these parameters will be
   *      passed: `page` and `pageSize` which can help implementing an ajax-based paging.
   *
   *
   * @param {object=} mdtTranslations accepts various key-value pairs for custom translations.
   *
   * @example
   * <h2>`mdt-row` attribute:</h2>
   *
   * When column names are: `Product name`, `Creator`, `Last Update`
   * The passed data row's structure: `id`, `item_name`, `update_date`, `created_by`
   *
   * Then the following setup will parse the data to the right columns:
   * <pre>
   *     <mdt-table
   *         mdt-row="{
   *             'data': controller.data,
   *             'table-row-id-key': 'id',
   *             'column-keys': ['item_name', 'update_date', 'created_by']
   *         }">
   *
   *         <mdt-header-row>
   *             <mdt-column>Product name</mdt-column>
   *             <mdt-column>Creator</mdt-column>
   *             <mdt-column>Last Update</mdt-column>
   *         </mdt-header-row>
   *     </mdt-table>
   * </pre>
   */
  mdtTableDirective.$inject = ['mdtStorageFactory', 'EditRowFeature', '_', 'mdtTableFactory'];
  function mdtTableDirective(mdtStorageFactory,
                             EditRowFeature,
                             _,
                             mdtTableFactory) {
    return {
      restrict: 'E',
      templateUrl: '/main/templates/mdtTable.html',
      transclude: true,
      scope: {
        mdtSelectable: '=',
        mdtSortable: '=',
        mdtRows: '=',
        mdtRowService: '&?',
        mdtPaginate: '=',
        mdtPaginateHandler: '&?',
        mdtTranslations: '=?'
      },
      controller: ['$scope', function mdtTable($scope) {
        var vm = this;

        vm.mdt = mdtTableFactory.getInstance($scope);

        _processData();

        // fill storage with values if set
        function _processData() {
          if (_.isEmpty($scope.mdtRows)) {
            return;
          }

          //local search/filter
          if (angular.isUndefined($scope.mdtPaginateHandler)) {
            $scope.$watch('mdtRows', function (mdtRows) {
              vm.mdt.getStorage().storage = [];

              _addRawDataToStorage(mdtRows['data']);
            }, true);
          } else {
            //if it's used for 'Ajax pagination'
          }
        }

        function _addRawDataToStorage(data) {
          var rowId;
          var columnValues = [];
          _.each(data, function (row) {
            rowId = _.get(row, $scope.mdtRows['table-row-id-key']);
            columnValues = [];

            _.each($scope.mdtRows['column-keys'], function (columnKey) {
              columnValues.push({
                attributes: {
                  editableField: false
                },
                columnKey: columnKey,
                value: _.get(row, columnKey)
              });
            });

            vm.mdt.getStorage().addRowData(rowId, columnValues);
          });
        }
      }],
      link: function ($scope, element, attrs, ctrl, transclude) {
        $scope.mdt = ctrl.mdt;

          $scope.dataStorage = ctrl.mdt.getStorage();

        _injectContentIntoTemplate();

        _initEditRowFeature();

        ctrl.mdt.startPaginator();

        function _injectContentIntoTemplate() {
          transclude(function (clone) {
            var headings = [];
            var body = [];
            var customCell = [];

            // Use plain JS to append content
            _.each(clone, function (child) {

              if (child.classList !== undefined) {
                if (child.classList.contains('theadTrRow')) {
                  headings.push(child);
                }
                else if (child.classList.contains('customCell')) {
                  customCell.push(child);
                }
                else {
                  body.push(child);
                }
              } else {
                body.push(child);
              }
            });

            var reader = element[0].querySelector('#reader');

            _.each(headings, function (heading) {
              reader.appendChild(heading);
            });

            _.each(body, function (item) {
              reader.appendChild(item);
            });
          });
        }

        function _initEditRowFeature() {
          //TODO: make it possible to only register feature if there is at least
          // one column which requires it.
          // for that we need to change the place where we register edit-row.
          // Remove mdt-row attributes --> do it in mdt-row attribute directive on mdtTable
          EditRowFeature.addRequiredFunctions($scope, ctrl);
        }

      }
    };
  }

  angular
    .module('mdDataTable')
    .directive('mdtTable', mdtTableDirective);
}());

(function () {
  'use strict';

  mdtAjaxPaginationHelperFactory.$inject = ['ColumnFilterFeature', '_'];
  function mdtAjaxPaginationHelperFactory(ColumnFilterFeature, _) {

    function mdtAjaxPaginationHelper(params) {
      this.dataStorage = params.dataStorage;
      this.rowOptions = params.mdtRowOptions;
      this.deleteHandler = params.mdtRowDeleteHandler;
      this.paginatorFunction = params.mdtPaginateHandlerFunction;

      if (params.paginationSetting &&
        params.paginationSetting.hasOwnProperty('rowsPerPageValues') &&
        params.paginationSetting.rowsPerPageValues.length > 0) {

        this.rowsPerPageValues = params.paginationSetting.rowsPerPageValues;
      } else {
        this.rowsPerPageValues = [10, 20, 30, 50, 100];
      }

      this.rowsPerPage = this.rowsPerPageValues[0];
      this.page = 1;
      this.totalResultCount = 0;
      this.totalPages = 0;

      this.isLoading = false;
      this.sortIndex = null;
      this.sortField = null;
      this.sortDirection = 1;
    }

    mdtAjaxPaginationHelper.prototype.getStartRowIndex = function () {
      return (this.page - 1) * this.rowsPerPage;
    };

    mdtAjaxPaginationHelper.prototype.getEndRowIndex = function () {
      var lastItem = this.getStartRowIndex() + this.rowsPerPage - 1;

      if (this.totalResultCount < lastItem) {
        return this.totalResultCount - 1;
      }

      return lastItem;
    };

    mdtAjaxPaginationHelper.prototype.getTotalRowsCount = function () {
      return this.totalResultCount;
    };

    mdtAjaxPaginationHelper.prototype.getRows = function () {
      return this.dataStorage.storage;
    };

    mdtAjaxPaginationHelper.prototype.previousPage = function () {
      var that = this;
      if (this.hasPreviousPage()) {
        this.fetchPage(this.page - 1).then(function () {
          that.page--;
        });
      }
    };

    mdtAjaxPaginationHelper.prototype.nextPage = function () {
      var that = this;
      if (this.hasNextPage()) {
        this.fetchPage(this.page + 1).then(function () {
          that.page++;
        });
      }
    };

    mdtAjaxPaginationHelper.prototype.hasNextPage = function () {
      return this.page < this.totalPages;
    };

    mdtAjaxPaginationHelper.prototype.hasPreviousPage = function () {
      return this.page > 1;
    };
    mdtAjaxPaginationHelper.prototype.getSortOptions = function () {
      return {
        index: this.sortIndex,
        field: this.sortField,
        direction: this.sortDirection
      }
    };

    mdtAjaxPaginationHelper.prototype.delete = function (ids) {
      var that = this;

      return this.deleteHandler(ids).then(function() {
        return that.reloadPage();
      });
    };

    mdtAjaxPaginationHelper.prototype.sortBy = function (sortIndex, sortDirection) {
      if (sortIndex in this.rowOptions['column-keys']) {
        var columnField = this.rowOptions['column-keys'][sortIndex];

        if (_.has(this.rowOptions['column-sorts'], columnField)){
          this.sortField = this.rowOptions['column-sorts'][columnField]
        } else {
          this.sortField = columnField;
        }
        this.sortIndex = sortIndex;

      } else {
        this.sortField = this.sortIndex = null;
      }
      this.sortDirection = sortDirection;

      return this.fetchPage(this.page);
    };

    mdtAjaxPaginationHelper.prototype.reloadPage = function () {
      return this.fetchPage(this.page);
    };

    mdtAjaxPaginationHelper.prototype.fetchPage = function (page) {
      this.isLoading = true;

      var that = this;

      var callbackArguments = {
        page: page,
        pageSize: this.rowsPerPage,
        sortField: this.sortField,
        sortDirection: this.sortDirection
      };

      ColumnFilterFeature.appendAppliedFiltersToCallbackArgument(this.dataStorage, callbackArguments);

      return this.paginatorFunction(callbackArguments)
        .then(function (data) {
          that.dataStorage.storage = [];
          that.setRawDataToStorage(that, data.results, that.rowOptions['table-row-id-key'], that.rowOptions['column-keys'], that.rowOptions);
          that.totalResultCount = data.totalResultCount;
          that.totalPages = Math.ceil(data.totalResultCount / that.rowsPerPage);

          if (that.totalResultCount == 0) {
            that.isNoResults = true;
          } else {
            that.isNoResults = false;
          }

          that.isLoadError = false;
          that.isLoading = false;

        }, function () {
          that.dataStorage.storage = [];

          that.isLoadError = true;
          that.isLoading = false;
          that.isNoResults = true;
        });
    };

    mdtAjaxPaginationHelper.prototype.setRawDataToStorage = function (that, data, tableRowIdKey, columnKeys, rowOptions) {
      var rowId;
      var columnValues = [];
      _.each(data, function (row) {
        rowId = _.get(row, tableRowIdKey);
        columnValues = [];

        _.each(columnKeys, function (columnKey) {
          //TODO: centralize adding column values into one place.
          // Duplication occurs at mdtCellDirective's link function.
          columnValues.push({
            attributes: {
              editableField: false
            },
            columnKey: columnKey,
            value: _.get(row, columnKey)
          });
        });

        var className = rowOptions['table-row-class-name'] ? rowOptions['table-row-class-name'](row) : false;

        that.dataStorage.addRowData(rowId, columnValues, className);
      });
    };

    mdtAjaxPaginationHelper.prototype.setRowsPerPage = function (rowsPerPage) {
      this.rowsPerPage = rowsPerPage;
      this.page = 1;

      this.fetchPage(this.page);
    };

    return {
      getInstance: function (dataStorage, isEnabled, paginatorFunction, rowOptions) {
        return new mdtAjaxPaginationHelper(dataStorage, isEnabled, paginatorFunction, rowOptions);
      }
    };
  }

  angular
    .module('mdDataTable')
    .service('mdtAjaxPaginationHelperFactory', mdtAjaxPaginationHelperFactory);
}());

(function(){
    'use strict';

    mdtLodashFactory.$inject = ['$window'];
    function mdtLodashFactory($window){
        if(!$window._){
            throw Error('Lodash does not found. Please make sure you load Lodash before any source for mdDataTable');
        }

        return $window._;
    }

    angular
        .module('mdDataTable')
        .factory('_', mdtLodashFactory);
}());
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

(function(){
    'use strict';

    mdtPaginationHelperFactory.$inject = ['_'];
    function mdtPaginationHelperFactory(_){

        function mdtPaginationHelper(dataStorage, paginationSetting){
            this.dataStorage = dataStorage;

            if(paginationSetting &&
                paginationSetting.hasOwnProperty('rowsPerPageValues') &&
                paginationSetting.rowsPerPageValues.length > 0){

                this.rowsPerPageValues = paginationSetting.rowsPerPageValues;
            }else{
                this.rowsPerPageValues = [10,20,30,50,100];
            }

            this.rowsPerPage = this.rowsPerPageValues[0];
            this.page = 1;
        }

        mdtPaginationHelper.prototype.calculateVisibleRows = function (){
            var that = this;

            _.each(this.dataStorage.storage, function (rowData, index) {
                if(index >= that.getStartRowIndex() && index <= that.getEndRowIndex()) {
                    rowData.optionList.visible = true;
                } else {
                    rowData.optionList.visible = false;
                }
            });
        };

        mdtPaginationHelper.prototype.getStartRowIndex = function(){
            return (this.page-1) * this.rowsPerPage;
        };

        mdtPaginationHelper.prototype.getEndRowIndex = function(){
            var lastItem = this.getStartRowIndex() + this.rowsPerPage-1;

            if(this.dataStorage.storage.length < lastItem){
                return this.dataStorage.storage.length - 1;
            }

            return lastItem;
        };

        mdtPaginationHelper.prototype.getTotalRowsCount = function(){
            return this.dataStorage.storage.length;
        };

        mdtPaginationHelper.prototype.getRows = function(){
            this.calculateVisibleRows();

            return this.dataStorage.storage;
        };

        mdtPaginationHelper.prototype.previousPage = function(){
            if(this.hasPreviousPage()){
                this.page--;
            }
        };

        mdtPaginationHelper.prototype.nextPage = function(){
            if(this.hasNextPage()){
                this.page++;
            }
        };

        mdtPaginationHelper.prototype.hasNextPage = function(){
            var totalPages = Math.ceil(this.getTotalRowsCount() / this.rowsPerPage);

            return this.page < totalPages;
        };

        mdtPaginationHelper.prototype.hasPreviousPage = function(){
            return this.page > 1;
        };

        mdtPaginationHelper.prototype.setRowsPerPage = function(rowsPerPage){
            this.rowsPerPage = rowsPerPage;
            this.page = 1;
        };

        return {
            getInstance: function(dataStorage, isEnabled){
                return new mdtPaginationHelper(dataStorage, isEnabled);
            }
        };
    }

    angular
        .module('mdDataTable')
        .service('mdtPaginationHelperFactory', mdtPaginationHelperFactory);
}());
(function () {
  'use strict';

  mdtStorageFactory.$inject = ['$log', '_'];
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

(function () {
  'use strict';

  mdtTableFactory.$inject = ['mdtOptionsFactory', 'mdtStorageFactory', 'mdtTranslation', 'mdtAjaxPaginationHelperFactory', 'mdtPaginationHelperFactory'];
  function mdtTableFactory(mdtOptionsFactory, mdtStorageFactory, mdtTranslation,
                           mdtAjaxPaginationHelperFactory,
                           mdtPaginationHelperFactory
  ) {
    function MdtTable(scope) {
      this.scope = scope;

      this.loadTranslation();

      this.loadStorage();

      this.loadPaginator();

      this.loadOptions();

      console.log(this.options);
    }

    MdtTable.prototype.getScope = function () {
      return this.scope;
    };

    MdtTable.prototype.loadOptions = function () {
      this.options = mdtOptionsFactory.getInstance(this.scope);
    };

    MdtTable.prototype.opt = function () {
      return this.options;
    };

    MdtTable.prototype.loadTranslation = function () {
      this.lang = mdtTranslation.defaultLanguage;
      this.translations = angular.merge(
        mdtTranslation.lang[this.lang],
        this.mdtTranslations
      );
    };
    MdtTable.prototype.getTranslation = function (key) {
      return this.translations[key];
    };
    MdtTable.prototype.getTranslations = function () {
      return this.translations;
    };


    MdtTable.prototype.loadStorage = function () {
      this.storage = mdtStorageFactory.getInstance(this.scope);

      return this;
    };
    MdtTable.prototype.getStorage = function () {
      return this.storage;
    };


    MdtTable.prototype.loadPaginator = function () {
      if (this.scope.mdtPaginate) {
        this.ajax = this.scope.mdtPaginateHandler;
        if (this.ajax) {
          this._paginator = mdtAjaxPaginationHelperFactory.getInstance({
            dataStorage: this.storage,
            paginationSetting: this.scope.mdtPaginate,
            mdtRowOptions: this.scope.mdtRows,
            mdtPaginateHandlerFunction: this.scope.mdtPaginateHandler
          });
        } else {
          this._paginator = mdtPaginationHelperFactory.getInstance(
            this.storage,
            this.scope.mdtPaginate,
            this.scope.mdtRows
          );
        }
      }
    };
    MdtTable.prototype.paginator = function () {
      return this._paginator;
    };
    MdtTable.prototype.startPaginator = function () {
      if (this.ajax) {
        this.paginator().fetchPage(1);
      }

      return this;
    };

    return {
      getInstance: function (scope) {
        return new MdtTable(scope);
      }
    };
  }

  angular
    .module('mdDataTable')
    .factory('mdtTableFactory', mdtTableFactory);
}());

(function(){
    'use strict';

    EditRowFeature.$inject = ['$mdDialog'];
    function EditRowFeature($mdDialog){

        var service = this;

        service.addRequiredFunctions = function($scope, ctrl){

            $scope.saveRow = function(rowData){
                var rawRowData = ctrl.dataStorage.getSavedRowData(rowData);

            };

            $scope.showEditDialog = function(ev, cellData, rowData){
                var rect = ev.currentTarget.closest('td').getBoundingClientRect();
                var position = {
                    top: rect.top,
                    left: rect.left
                };

                var ops = {
                    controller: 'InlineEditModalCtrl',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: false,
                    locals: {
                        position: position,
                        cellData: JSON.parse(JSON.stringify(cellData))
                    }
                };

                if(cellData.attributes.editableField === 'smallEditDialog'){
                    ops.templateUrl = '/main/templates/smallEditDialog.html';
                }else{
                    ops.templateUrl = '/main/templates/largeEditDialog.html';
                }

                var that = this;
                $mdDialog.show(ops).then(function(cellValue){
                    cellData.value = cellValue;

                    that.saveRow(rowData);
                });
            };
        }
    }

    angular
        .module('mdDataTable')
        .service('EditRowFeature', EditRowFeature);
}());

(function(){
    'use strict';

    /**
     * @name mdtTranslationProvider
     * @returns object
     *
     */
    var mdtTranslationProvider = {
      'defaultLanguage' : 'fr',
      'lang': {
        'en': {
          rowsPerPage: 'Rows per page:',
          noResultsFound: 'No results found.',
          errorMessage: 'Ajax error during loading contents.',
          noResults: 'No results.',
          previousPage: 'Previous page',
          nextPage: 'Next page',
          deleteSelectedRows: 'Delete selected rows',
          itemSelected: 'item(s) selected.',
          ok: 'Ok',
          of: 'of',
          cancel: 'Cancel',
          save: 'Save',
          moreOptions: 'More options'
        },
        'fr': {
          rowsPerPage: 'Éléments par page :',
          noResultsFound: 'Aucun résultat trouvé.',
          errorMessage: 'Erreur pendant le chargement des données.',
          noResults: 'Aucun résultat.',
          previousPage: 'Page précédente',
          nextPage: 'Page suivante',
          deleteSelectedRows: 'Supprimer les éléments sélectionnés.',
          itemSelected: 'élément(s) sélectionné(s).',
          ok: 'Valider',
          of: 'sur',
          cancel: 'Cancel',
          save: 'Enregistrer',
          moreOptions: 'Plus d\'options'
        }
      }
    };

    angular
        .module('mdDataTable')
        .value('mdtTranslation', mdtTranslationProvider);
})();

(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtCell
     * @restrict E
     * @requires mdtTable
     * @requires mdtRow
     *
     * @description
     * Representing a cell which should be placed inside `mdt-row` element directive.
     *
     * @param {boolean=} htmlContent if set to true, then html content can be placed into the content of the directive.
     * @param {string=} editableField if set, then content can be editable.
     *
     *      Available modes are:
     *
     *      - "smallEditDialog" - A simple, one-field edit dialog on click
     *      - "largeEditDialog" - A complex, flexible edit edit dialog on click
     *
     * @param {string=} editableFieldTitle if set, then it sets the title of the dialog. (only for `largeEditDialog`)
     * @param {number=} editableFieldMaxLength if set, then it sets the maximum length of the field.
     *
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column>Product name</mdt-column>
     *          <mdt-column>Price</mdt-column>
     *          <mdt-column>Details</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row ng-repeat="product in ctrl.products">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *          <mdt-cell html-content="true">
     *              <a href="productdetails/{{product.id}}">more details</a>
     *          </mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    mdtCellDirective.$inject = ['$interpolate'];
    function mdtCellDirective($interpolate){
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: '^mdtRow',
            link: function($scope, element, attr, mdtRowCtrl, transclude){

                var attributes = {
                    htmlContent: attr.htmlContent ? attr.htmlContent : false,
                    editableField: attr.editableField ? attr.editableField : false,
                    editableFieldTitle: attr.editableFieldTitle ? attr.editableFieldTitle : false,
                    editableFieldMaxLength: attr.editableFieldMaxLength ? attr.editableFieldMaxLength : false
                };

                transclude(function (clone) {

                    if(attr.htmlContent){
                        mdtRowCtrl.addToRowDataStorage(clone, attributes);
                    }else{
                        //TODO: better idea?
                        var cellValue = $interpolate(clone.html())($scope.$parent);

                        mdtRowCtrl.addToRowDataStorage(cellValue, attributes);
                    }
                });
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtCell', mdtCellDirective);
}());
(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtRow
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a row which should be placed inside `mdt-table` element directive.
     *
     * <i>Please note the following: This element has limited functionality. It cannot listen on data changes that happens outside of the
     * component. E.g.: if you provide an ng-repeat to generate your data rows for the table, using this directive,
     * it won't work well if this data will change. Since the way how transclusions work, it's (with my best
     * knowledge) an impossible task to solve at the moment. If you intend to use dynamic data rows, it's still
     * possible with using mdtRow attribute of mdt.</i>
     *
     * @param {string|integer=} tableRowId when set table will have a uniqe id. In case of deleting a row will give
     *      back this id.
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column>Product name</mdt-column>
     *          <mdt-column>Price</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row
     *          ng-repeat="product in products"
     *          table-row-id="{{product.id}}">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    function mdtRowDirective(){
        return {
            restrict: 'E',
            transclude: true,
            require: '^mdtTable',
            scope: {
                tableRowId: '='
            },
            controller: ['$scope', function($scope){
                var vm = this;

                vm.addToRowDataStorage = addToRowDataStorage;
                $scope.rowDataStorage = [];

                function addToRowDataStorage(value, attributes){
                    $scope.rowDataStorage.push({value: value, attributes: attributes});
                }
            }],
            link: function($scope, element, attrs, ctrl, transclude){
                appendColumns();

                ctrl.mdt.getStorage().addRowData($scope.tableRowId, $scope.rowDataStorage);

                function appendColumns(){
                    transclude(function (clone) {
                        element.append(clone);
                    });
                }
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtRow', mdtRowDirective);
}());

(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtColumn
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a header column cell which should be placed inside `mdt-header-row` element directive.
     *
     * @param {string=} alignRule align cell content. This settings will have affect on each data cells in the same
     *  column (e.g. every x.th cell in every row).
     *
     *  Assignable values:
     *    - 'left'
     *    - 'right'
     *
     * @param {function()=} sortBy compareFunction callback for sorting the column data's. As every compare function,
     *  should get two parameters and return with the comapred result (-1,1,0)
     *
     * @param {string=} columnDefinition displays a tooltip on hover.
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column align-rule="left">Product name</mdt-column>
     *          <mdt-column
     *              align-rule="right"
     *              column-definition="The price of the product in gross.">Price</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row ng-repeat="product in ctrl.products">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    mdtColumnDirective.$inject = ['$interpolate', 'ColumnFilterFeature'];
    function mdtColumnDirective($interpolate, ColumnFilterFeature){
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                alignRule: '@',
                sortBy: '=',
                columnDefinition: '@',
                columnFilter: '=?'
            },
            require: ['^mdtTable'],
            link: function ($scope, element, attrs, ctrl, transclude) {
                var mdtTableCtrl = ctrl[0];

                transclude(function (clone) {
                    // directive creates an isolate scope so use parent scope to resolve variables.
                    var cellValue = $interpolate(clone.html())($scope.$parent);
                    var cellDataToStore = {
                      alignRule: $scope.alignRule,
                      sortBy: $scope.sortBy,
                      columnDefinition: $scope.columnDefinition,
                      columnName: cellValue,
                      noSort: angular.isDefined(attrs['mdtNoSort'])
                    };

                    var mdtStorage = mdtTableCtrl.mdt.getStorage();

                    ColumnFilterFeature.appendHeaderCellData($scope, cellDataToStore, mdtStorage, element);

                  mdtStorage.addHeaderCellData(cellDataToStore);
                });
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtColumn', mdtColumnDirective);
}());

(function(){
    'use strict';

    mdtGeneratedHeaderCellContentDirective.$inject = ['ColumnFilterFeature'];
    function mdtGeneratedHeaderCellContentDirective(ColumnFilterFeature){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtGeneratedHeaderCellContent.html',
            replace: true,
            scope: false,
            require: '^mdtTable',
            link: function($scope, element, attrs, ctrl){
                ColumnFilterFeature.initGeneratedHeaderCellContent($scope, $scope.headerRowData, ctrl);

                $scope.columnClickHandler = function(){
                    ColumnFilterFeature.generatedHeaderCellClickHandler($scope, $scope.headerRowData, element);
                };
            }
        };
    }

    angular
    .module('mdDataTable')
        .directive('mdtGeneratedHeaderCellContent', mdtGeneratedHeaderCellContentDirective);
}());

(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtHeaderRow
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a header row which should be placed inside `mdt-table` element directive.
     * The main responsibility of this directive is to execute all the transcluded `mdt-column` element directives.
     *
     */
    function mdtHeaderRowDirective(){
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: '^mdtTable',
            scope: true,
            link: function($scope, element, attrs, mdtCtrl, transclude){
                appendColumns();

                function appendColumns(){
                    transclude(function (clone) {
                        element.append(clone);
                    });
                }
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtHeaderRow', mdtHeaderRowDirective);
}());

(function(){
    'use strict';

    mdtAddHtmlContentToCellDirective.$inject = ['$parse', '$compile', '$rootScope'];
    function mdtAddHtmlContentToCellDirective($parse, $compile, $rootScope){
        return {
            restrict: 'A',
            require: '^?mdtTable',
            link: function($scope, element, attr, ctrl){

                $scope.$watch(function(){
                    //this needs to be like that. Passing only `attr.mdtAddHtmlContentToCell` will cause digest to go crazy 10 times.
                    // so we has to say explicitly that we only want to watch the content and nor the attributes, or the additional metadata.
                    var val = $parse(attr.mdtAddHtmlContentToCell)($scope);

                    return val.value;

                }, function(val){
                    element.empty();

                    var originalValue = $parse(attr.mdtAddHtmlContentToCell)($scope);

                    // ctrl doesn't exist on the first row, making html content impossible to show up.
                    // TODO: make it as a global service .... I know but any better idea?
                    if(originalValue.columnKey && ctrl && ctrl.mdt.getStorage().customCells[originalValue.columnKey]){
                        var customCellData = ctrl.mdt.getStorage().customCells[originalValue.columnKey];

                        var clonedHtml = customCellData.htmlContent;

                        //append value to the scope
                        var localScope = $rootScope.$new();

                        localScope.clientScope = customCellData.scope;
                        localScope.value = val;

                        $compile(clonedHtml)(localScope, function(cloned){
                            element.append(cloned);
                        });

                    }else{
                        element.append(val);
                    }

                }, false);
                // issue with false value. If fields are editable then it won't reflect the change.
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtAddHtmlContentToCell', mdtAddHtmlContentToCellDirective);
}());

(function(){
    'use strict';

    function mdtCustomCellDirective(){
        return {
            restrict: 'E',
            transclude: true,
            template: '<span class="customCell" ng-transclude></span>',
            require: '^mdtTable',
            link: {
                pre: function($scope, element, attrs, ctrl, transclude){
                    transclude(function (clone) {
                        var columnKey = attrs.columnKey;

                        ctrl.mdt.getStorage().customCells[columnKey] = {
                            scope: $scope,
                            htmlContent: clone.clone()
                        };
                    });
                }
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtCustomCell', mdtCustomCellDirective);
}());

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

(function(){
    'use strict';

    function ColumnFilterFeature(){

        var service = this;

        /**
         * This is the first entry point when we initialize the feature.
         *
         * The method adds feature-related variable to the passed object.
         * The variables gets stored afterwards in the dataStorage for the header cell
         *
         * @param $scope
         * @param cellDataToStore
         */
        service.appendHeaderCellData = function($scope, cellDataToStore, dataStorage, element){
            cellDataToStore.columnFilter = {};

            if($scope.columnFilter && $scope.columnFilter.valuesProviderCallback){
                cellDataToStore.columnFilter.isEnabled = true;
                cellDataToStore.columnFilter.filtersApplied = [];
                cellDataToStore.columnFilter.valuesProviderCallback = $scope.columnFilter.valuesProviderCallback;
                cellDataToStore.columnFilter.valuesTransformerCallback = $scope.columnFilter.valuesTransformerCallback;
                cellDataToStore.columnFilter.placeholderText = $scope.columnFilter.placeholderText;
                cellDataToStore.columnFilter.type = $scope.columnFilter.filterType || 'chips';
                cellDataToStore.columnFilter.isActive = false;

                cellDataToStore.columnFilter.setColumnActive = function(bool){
                    //first we disable every column filter if any is active
                    _.each(dataStorage.header, function(headerData){
                        if(headerData.columnFilter.isEnabled){
                            headerData.columnFilter.isActive = false;
                        }
                    });

                    //then we activate ours
                    cellDataToStore.columnFilter.isActive = bool ? true : false;

                    if(bool){
                        element.closest('.mdtTable').css('overflow', 'visible');
                    }else{
                        element.closest('.mdtTable').css('overflow', 'auto');
                    }
                }
            }else{
                cellDataToStore.columnFilter.isEnabled = false;
            }
        };

        /**
         * Generating the needed functions and variables for the header cell which will
         * handle the actions of the column filter component.
         *
         * @param $scope
         * @param headerData
         * @param parentCtrl
         */
        service.initGeneratedHeaderCellContent = function($scope, headerData, parentCtrl){
            if(!headerData.columnFilter.isEnabled){
                return;
            }

            $scope.columnFilterFeature = {};

            $scope.columnFilterFeature.cancelFilterDialog = function(event){
                if(event){
                    event.stopPropagation();
                }

                headerData.columnFilter.setColumnActive(false);
            };

            $scope.columnFilterFeature.confirmFilterDialog = function(params){
                params.event.stopPropagation();

                headerData.columnFilter.setColumnActive(false);

                headerData.columnFilter.filtersApplied = params.selectedItems;

                if($scope.mdtPaginateHandler){
                    parentCtrl.mdtPaginationHelper.fetchPage(1);
                }else{
                    // no support for non-ajax yet
                }
            }
        };

        /**
         * Click handler for the feature when header cell gets clicked
         * @param $scope
         * @param headerRowData
         */
        service.generatedHeaderCellClickHandler = function($scope, headerRowData, element){
            if(!headerRowData.columnFilter.isEnabled) {
                return;
            }

            headerRowData.columnFilter.setColumnActive(!headerRowData.columnFilter.isActive);
        };

        /**
         * Returns with an array of currently applied filters on the columns.
         * @param dataStorage
         * @param callbackArguments
         */
        service.appendAppliedFiltersToCallbackArgument = function(dataStorage, callbackArguments){
            var columnFilters = [];
            var isEnabled = false;

            _.each(dataStorage.header, function(headerData){
                var filters = headerData.columnFilter.filtersApplied || [];

                if(headerData.columnFilter.isEnabled){
                    isEnabled = true;
                }

                columnFilters.push(filters);
            });

            if(isEnabled){
                callbackArguments.filtersApplied = columnFilters;
            }
        }
    }

    angular
        .module('mdDataTable')
        .service('ColumnFilterFeature', ColumnFilterFeature);
}());

(function() {
    'use strict';

    mdtCheckboxColumnFilterDirective.$inject = ['_'];
    function mdtCheckboxColumnFilterDirective(_){
        return{
            restrict: 'E',
            templateUrl: '/main/templates/mdtCheckboxColumnFilter.html',
            scope: {
                confirmCallback: '=',
                cancelCallback: '&',
                headerRowData: '='
            },
            link: function($scope){

                $scope.transformChip = transformChip;
                $scope.selectableItems = [];
                $scope.selectedItems = _.map($scope.headerRowData.columnFilter.filtersApplied, _.clone);

                $scope.headerRowData.columnFilter.valuesProviderCallback().then(function(values){
                    if(values){
                        $scope.selectableItems = values
                    }
                });

                $scope.exists = function (item) {
                    var result = _.findIndex($scope.selectedItems, function(arrayItem){
                        return transformChip(arrayItem) === transformChip(item);
                    });

                    return result != -1;
                };

                $scope.toggle = function (item) {
                    var idx = _.findIndex($scope.selectedItems, function(arrayItem){
                        return transformChip(arrayItem) === transformChip(item);
                    });

                    if (idx > -1) {
                        $scope.selectedItems.splice(idx, 1);
                    }
                    else {
                        $scope.selectedItems.push(item);
                    }
                };

                function transformChip(chip) {
                    if($scope.headerRowData.columnFilter.valuesTransformerCallback){
                        return $scope.headerRowData.columnFilter.valuesTransformerCallback(chip);
                    }

                    return chip;
                }
            }
        }
    }

    angular
        .module('mdDataTable')
        .directive('mdtCheckboxColumnFilter', mdtCheckboxColumnFilterDirective);
})();
(function() {
    'use strict';

    mdtChipsColumnFilterDirective.$inject = ['_', '$timeout'];
    function mdtChipsColumnFilterDirective(_, $timeout){
        return{
            restrict: 'E',
            templateUrl: '/main/templates/mdtChipsColumnFilter.html',
            scope: {
                confirmCallback: '=',
                cancelCallback: '&',
                headerRowData: '='
            },
            link: function($scope, elem){

                $scope.transformChip = transformChip;

                $scope.availableItems = [];
                $scope.selectedItems = _.map($scope.headerRowData.columnFilter.filtersApplied, _.clone);
                $scope.placeholderText = $scope.headerRowData.columnFilter.placeholderText || 'Filter column...';

                //focus input immediately
                $timeout(function(){
                    elem.find('input').focus();
                },0);

                function transformChip(chip) {
                    if($scope.headerRowData.columnFilter.valuesTransformerCallback){
                        return $scope.headerRowData.columnFilter.valuesTransformerCallback(chip);
                    }

                    return chip;
                }
            }
        }
    }

    angular
        .module('mdDataTable')
        .directive('mdtChipsColumnFilter', mdtChipsColumnFilterDirective);
})();
(function() {
    'use strict';

    function mdtDropdownColumnFilterDirective(){
        return{
            restrict: 'E',
            templateUrl: '/main/templates/mdtDropdownColumnFilter.html',
            scope: {
                confirmCallback: '=',
                cancelCallback: '&',
                headerRowData: '='
            },
            link: function($scope){
                $scope.transformChip = transformChip;
                $scope.selectedItem = selectedItem;

                $scope.selectableItems = [];
                $scope.selectedItems = _.map($scope.headerRowData.columnFilter.filtersApplied, _.clone);
                $scope.oneSelectedItem = $scope.selectedItems.length ? transformChip($scope.selectedItems[0]) : undefined;
                $scope.placeholderText = $scope.headerRowData.columnFilter.placeholderText || 'Choose a value';

                $scope.headerRowData.columnFilter.valuesProviderCallback().then(function(values){
                    if(values){
                        $scope.selectableItems = values;
                    }
                });

                function transformChip(chip) {
                    if($scope.headerRowData.columnFilter.valuesTransformerCallback){
                        return $scope.headerRowData.columnFilter.valuesTransformerCallback(chip);
                    }

                    return chip;
                }

                function selectedItem(){
                    if(typeof $scope.oneSelectedItem !== 'undefined'){
                        var result = _.find($scope.selectableItems, function(anItem){
                            return transformChip(anItem) === $scope.oneSelectedItem
                        });

                        if(result){
                            $scope.selectedItems = [result];
                        }
                    }
                }
            }
        }
    }

    angular
        .module('mdDataTable')
        .directive('mdtDropdownColumnFilter', mdtDropdownColumnFilterDirective);
})();