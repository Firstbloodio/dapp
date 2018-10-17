(function() {
    'use strict';
    angular.module('app.home', [])
        .config(Config);

    Config.$inject = ['$stateProvider'];

    function Config($stateProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'modules/home/partials/index.html',
                controller: 'homeController',
                controllerAs: 'ctrl'
            });
    }
})();