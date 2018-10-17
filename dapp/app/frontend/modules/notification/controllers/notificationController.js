(function(){
    'use strict';
    angular
    .module('app.notification')
    .controller('notificationController', notificationController);

    notificationController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope', '$sce', '$filter'];

    function notificationController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope, $sce, $filter) {
        var ctrl = this;
        ctrl.$state = $state;

	    $scope.allNotifications =[];
        $scope.notificationPage = 1;
        $scope.notificationPageSize = CONSTANTS.pageSize;
        $scope.canNotificationScroll = true;

	    $scope.getNotification = function() {
            var playerName = JSON.parse(CommonService.getStorage('user')).userLoginDetails.playerName;
            var url = SERVER_URL + 'infura/getNotifications?page=' + $scope.notificationPage + '&pageSize=' + $scope.notificationPageSize + '&playerName='+ playerName ,
                method = 'GET';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.data.length < $scope.notificationPageSize) {
                    $scope.canNotificationScroll = false;
                }

                angular.forEach(res.data, (value, key)=>{
                    var notificationDate = $filter('date')(new Date(value['dateTime']), 'MM/dd/yyyy - h:mm a')
                    value['message'] +=  '<span class="txt-goToChallenge">'+ notificationDate +'</span>'
                	value['message'] = $sce.trustAsHtml(value['message'].replace("<<username>>", '<span class="link-blueTxt">'+ value['username'] +'</span> <span class="txt-goToChallenge">Go to challenge</span>' ));
                	$scope.allNotifications.push(value);
                });
            });            
        }
        $scope.getNotification();

        $scope.findMatch = function() {
            var time = new Date().getTime();
            let name = JSON.parse(CommonService.getStorage('user')).userLoginDetails.playerName;
            var url = SERVER_URL + 'findmatch/findMatch?playerName=' + name+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.type == 'success') {
                    $state.go('challengeStatus', { address: res.data[0].address });
                } else {
                    $('#Info').modal('show');
                }
            }, function(err) {
                console.log(err)
            });
        }

        $rootScope.notificationInterval = setInterval(function() {
            $scope.allNotifications =[];
            $scope.getNotification();
        }, 60000);

        $scope.getMoreNotification = function() {
        	if($scope.canNotificationScroll) {
                $scope.notificationPage++;
                $scope.getNotification();               
        	}
        }

        setTimeout(() => {
            $(".box-notification").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll : function() {
                        if(this.mcs.topPct == 100)
                            $scope.getMoreNotification();
                    }
                }
            });
        }, 10);
    };

})();