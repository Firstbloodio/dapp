(function () {
    'use strict';
    angular.module('app.notification', [])
        .config(Config);

        Config.$inject = ['$stateProvider'];
        
        function Config($stateProvider) {
            $stateProvider
                .state('notification', {
                    url:'/notification',
                    templateUrl: 'modules/notification/partials/index.html',
                    controller: 'notificationController',
                    controllerAs: 'ctrl'
                });
        }
})();