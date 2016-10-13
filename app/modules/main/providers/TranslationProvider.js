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
