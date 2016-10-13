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
      controller: function mdtTable($scope) {
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
      },
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
