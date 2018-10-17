(function() {
    'use strict';
    angular
        .module('app.configuration')
        .directive('blockSpecialChar', function() {
            function link(scope, elem, attrs, ngModel) {
                ngModel.$parsers.push(function(viewValue) {
                    var reg = /^[^`~!@#$%\^&*()_+={}|[\]\\:';"<>?,./0-9]*$/;
                    // if view values matches regexp, update model value
                    if (viewValue.match(reg)) {
                        console.log("match")
                        return viewValue;
                    }
                    // keep the model value as it is
                    var transformedValue = ngModel.$modelValue;
                    ngModel.$setViewValue(transformedValue);
                    ngModel.$render();
                    return transformedValue;
                });
            }

            return {
                restrict: 'A',
                require: 'ngModel',
                link: link
            };
        })
        .controller('configurationController', configurationController);

    configurationController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope'];

    function configurationController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope) {
        var ctrl = this;
        ctrl.$state = $state;
        $scope.loginData = {
            playerName: '',
            referrerEthereumAddress: '',
            ethereumPrivateKey: '',
            steamId: '',
            witnessName: '',
            steamPassword: '',

        };

        $scope.loginError = '';
        $scope.errors = [];
        $scope.removeSpace = function(str) {
            $scope.loginData.referrerEthereumAddress = str.replace(/\s/g, '');
        }

        $scope.runningLoginAPi = false;
        $scope.login = function(loginForm) {
            if($scope.runningLoginAPi)
                return false;
            $scope.runningLoginAPi = true;
            $scope.loginError = '';
            $scope.errors = [];
            if (loginForm.playerName === loginForm.witnessName) {
                $scope.loginError = 'Witness and Player username must be different';
                $scope.runningLoginAPi = false;
                return false;
            }
            var url = SERVER_URL + 'login',
                method = 'POST',
                obj = loginForm;
            $rootScope.isLoading = true;
            CommonService.apiCall(url, method, obj).then(function(res) {
            $scope.runningLoginAPi = false;
                $rootScope.isLoading = false;
                if (res.message == 'success') {
                    var localObj = {};
                    localObj.userLoginDetails = loginForm;

                    var userDetails = { isPlayer: false, isWitness: false };
                    var redirectTo = '';
                    if (loginForm.witnessName) {
                        userDetails.isWitness = true;
                        redirectTo = 'witness';
                    }
                    if (loginForm.playerName) {
                        userDetails.isPlayer = true;
                        redirectTo = 'home';
                    }

                    localObj.userDetails = userDetails;
                    localObj.isLogin = true;

                    if (res.result['playerInfo']) {
                        localObj.playerInfo = res.result['playerInfo'];
                    }

                    if (res.result['witnessInfo']) {
                        localObj.witnessInfo = res.result['witnessInfo'];
                    }

                    $rootScope.currentUser = localObj;


                    CommonService.setStorage('user', JSON.stringify(localObj));
                    $rootScope.getNotification();
                    $state.go(redirectTo);
                } else {
                    $scope.errors = res.error;
                }
            },function(err) {
                $rootScope.isLoading = false;
                $rootScope.showToast("error", "Configuring your server. Please wait for a while...")
            });
        }

        setTimeout(() => {

            $(".box-scroll").mCustomScrollbar({
                scrollbarPosition: "outside",               
            });
        }, 10);
    };

})();