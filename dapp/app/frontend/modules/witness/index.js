(function () {
    'use strict';
    angular.module('app.witness', [])
        .config(Config);

        Config.$inject = ['$stateProvider'];
        
        function Config($stateProvider) {
            $stateProvider
                .state('witness', {
                    url:'/witness',
                    templateUrl: 'modules/witness/partials/index.html',
                    controller: 'witnessController',
                    controllerAs: 'ctrl'
                });
        }
})();