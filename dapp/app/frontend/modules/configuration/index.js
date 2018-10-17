(function() {
    'use strict';
    angular.module('app.configuration', [])
        .config(Config);

    function checkConfig(CommonService, SERVER_URL, cb) {
        var url = SERVER_URL + 'checkConfig';
        CommonService.apiCall(url, 'get', {}).then(function(res) {
            if (res.type == 'success' && res.data.length > 0) {
                cb(true);
            } else {
                localStorage.clear();
                cb(false);
            }
        }, function(err) {
            console.log(err);
        });
    }

    Config.$inject = ['$stateProvider'];

    function Config($stateProvider) {
        $stateProvider
            .state('configuration', {
                url: '/configuration',
                templateUrl: 'modules/configuration/partials/index.html',
                controller: 'configurationController',
                controllerAs: 'ctrl',
                resolve: {
                    afterAuthLogin: function($rootScope, CommonService, $state, CONSTANTS, SERVER_URL) {
                        if (CommonService.isLoggedIn()) {
                            $rootScope.isLoading = true;
                            /* var redirectTo =  ($rootScope.currentUser.userDetails.isPlayer) ? 'home' : 'witness';
                            setTimeout(() =>{$state.go(redirectTo);}, 0);*/
                            var interval = setInterval(function() {
                                checkConfig(CommonService, SERVER_URL, function(status) {
                                    if (status) {
                                        $rootScope.isLoading = false;

                                        var redirectTo = ($rootScope.currentUser.userDetails.isPlayer) ? 'home' : 'witness';
                                        setTimeout(() => { $state.go(redirectTo); }, 0);
                                    } else {
                                        $rootScope.isLoading = false;

                                        setTimeout(() => { $state.go('configuration'); }, 0);
                                    }
                                    clearInterval(interval);
                                })
                            }, 500);
                        }
                    }
                }
            });
    }
})();