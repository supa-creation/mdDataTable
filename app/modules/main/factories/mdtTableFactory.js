(function () {
  'use strict';

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
