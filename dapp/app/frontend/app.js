(function(){
    'use strict';
var SERVER_URL = "http://localhost:3000/";
    angular.module('app',[
		'ngAnimate',	
		'toaster',	
		'ngMaterial',
		'ui.router', 
		'app.configuration',
		'app.home',
		'app.challenge',
		'app.common',
		'app.witness',
		'app.notification',
		'app.challengeStatus',
	])

	.config(Config)
	.controller('MainController', MainController)
	.value('SERVER_URL', SERVER_URL);
	
	Config.$inject = ['$urlRouterProvider', '$qProvider']


	function Config($urlRouterProvider, $qProvider) {
		$urlRouterProvider.otherwise("/configuration");
	    $qProvider.errorOnUnhandledRejections(false); //Uncomment on server
	}
	
	MainController.$inject = ["$scope", "$state", "SERVER_URL", "CommonService", "$rootScope", "CONSTANTS", "$q", '$sce', 'toaster', '$filter'];
	
	function MainController($scope, $state, SERVER_URL, CommonService, $rootScope, CONSTANTS, $q, $sce, toaster, $filter){
		$scope.$state = $state;
		$rootScope.currentUser = JSON.parse(CommonService.getStorage('user'));
		$rootScope.isLoading = false;
		$rootScope.leaderboardInterval = null;
		$rootScope.openChallengeInterval = null;
		$rootScope.gameInterval = null;
		$rootScope.notificationInterval = null;

		$rootScope.showToast = function(type, message) {
			console.log("Toast Called...");
			toaster.pop({
                type: type,
                body: message,
                timeout: 5000
            });
		}

		$scope.logout = function(){
			var url = SERVER_URL + 'logout',
                method = 'GET';
            CommonService.apiCall(url, method, {}).then(function(res) {
            	if(res.type == 'sucess') {
            		localStorage.removeItem('hideLoader');
            		localStorage.clear();            		
            	}
            });  
	 		$state.go(CONSTANTS.beforeLoginUrl);
		}

		$scope.redirect = function(state){
			$scope.clearIntervals();
			$scope.navigation = false;
			$state.go(state);
		}

		$scope.clearIntervals = function(){
			if($rootScope.leaderboardInterval)
		    	clearInterval($rootScope.leaderboardInterval);
		    if($rootScope.gameInterval)
		    	clearInterval($rootScope.gameInterval);
		    if($rootScope.openChallengeInterval)
		    	clearInterval($rootScope.openChallengeInterval);
		    if($rootScope.witnessLogInterval)
		    	clearInterval($rootScope.witnessLogInterval);
		    if($rootScope.notificationInterval)
		    	clearInterval($rootScope.notificationInterval);
		}

		$scope.redirectWithParams=function(state, params)  {
			$scope.clearIntervals();
	      	$state.go(state, params);
	    }
        
        $scope.openlink = function(link) {
            chrome.ipcRenderer.send('new-window', link);
        }

        $scope.openTransaction = function(tx) {
        	var link = CONSTANTS.etherscanHost + tx;
            chrome.ipcRenderer.send('new-window', link);
        }

        $scope.getBlockrange = function() {
            var url = SERVER_URL + 'infura/syncedBlocks/?isPlayer='+$rootScope.currentUser.userDetails.isPlayer,
                method = 'GET';
            CommonService.apiCall(url, method, {}).then(function(res) {
               console.log("getBlockrange-----",res);
               $scope.blockrange = res.data;
            });
        }

	    $scope.notifications =[];
	    $scope.unReadCount = 0;
	    $rootScope.getNotification = function() {
	    	var playerName = JSON.parse(CommonService.getStorage('user')).userLoginDetails.playerName;
	    	playerName = (playerName) ? '?playerName='+playerName : '';
            var url = SERVER_URL + 'infura/getNotificationsCount/'+playerName,
                method = 'GET';
            CommonService.apiCall(url, method, {}).then(function(res) {
            	if(res.data){
                    angular.forEach(res.data.notification, (value, key)=>{
                	var notificationDate = $filter('date')(new Date(value['dateTime']), 'MM/dd/yyyy - h:mm a')
                	value['message'] +=  '<span class="txt-goToChallenge">'+ notificationDate +'</span>'
                	value['message'] = $sce.trustAsHtml(value['message'].replace("<<username>>", '<span class="link-blueTxt">'+ value['username'] +'</span>' ));
                	$scope.notifications.push(value);
                });
                $scope.unreadCount = res.data.unreadCount;
            	}else{
            		$scope.unreadCount = 0;
            	}
                
            });            
        }

        if(CommonService.isLoggedIn()) { 
        	$scope.unReadCount = 0;
        	$scope.notifications =[];
	        $rootScope.getNotification();	       
	    }

     	setInterval(function() {
     		if(CommonService.isLoggedIn()) { 
	        	$scope.unReadCount = 0;
	            $scope.notifications =[];
	        	$rootScope.getNotification();
	        }
        }, 60000);

        $scope.readNotification = function() {
        	var playerName = JSON.parse(CommonService.getStorage('user')).userLoginDetails.playerName;
            var url = SERVER_URL + 'infura/setReadNotifications',
                method = 'PUT';
            CommonService.apiCall(url, method, {'playerName': playerName}).then(function(res) {
            	if(res.type == 'success') {
                	$scope.unreadCount = 0;            		
            	}
            }); 
        }

	    $scope.showOtherUserModal = function(name) {
            
            var playerName = name;
            var url = SERVER_URL + 'infura/getProfile/?playerName='+playerName,
                method = 'GET';
            CommonService.apiCall(url, method, {}).then(function(res) {
                $rootScope.otherUserProfile = res.data[0];

                url = SERVER_URL + 'witness/player_penalty/?playerName='+playerName;
                
                CommonService.apiCall(url, method, {}).then(function(result) {
	                $rootScope.otherUserProfile['witnessPenalty'] = result.data['witness_penalty'];	                
	                $('#other_profile').modal('show');
	            });
            });   
	    }

	    $scope.openMetamask = function(message) {
            chrome.ipcRenderer.send(message);
        }

	    if (typeof window.web3 !== 'undefined') {
          window.web3 = new Web3(window.web3.currentProvider);
        } else {
          window.web3 = new Web3(new Web3.providers.HttpProvider(CONSTANTS.web3Provider));
        }

	}
})();