(function () {
    'use strict';
    angular.module('app.challenge', [])
        .config(Config);

        Config.$inject = ['$stateProvider'];
        
        function Config($stateProvider) {
            $stateProvider
                .state('challenge', {
                    url:'/challenge',
                    templateUrl: 'modules/challenge/partials/index.html',
                    controller: 'challengeController',
                    controllerAs: 'ctrl'
                });
        }
})();