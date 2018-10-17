(function () {
    'use strict';
    angular.module('app.challengeStatus', [])
        .config(Config);

        Config.$inject = ['$stateProvider'];
        
        function Config($stateProvider) {
            $stateProvider
                .state('challengeStatus', {
                    url:'/challengeStatus',
                    params: {
                        address:''
                    },
                    templateUrl: 'modules/challenge_status/partials/index.html',
                    controller: 'challengeStatusController',
                    controllerAs: 'ctrl'
                });
        }
})();