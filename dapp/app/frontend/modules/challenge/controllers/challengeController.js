(function() {
    'use strict';
    angular
        .module('app.challenge')
        .controller('challengeController', challengeController);

    challengeController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope', '$q', 'toaster'];

    function challengeController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope, $q, toaster) {
        var ctrl = this;
        ctrl.$state = $state;
        $scope.negative = false;
        $scope.challengePage = 1;
        $scope.challengePageSize = CONSTANTS.pageSize;
        $scope.logs = [];
        $scope.canChallengeScroll = true;
        $scope.tableLoader = true;
        $scope.openTableLoader = true;
        $scope.amount = "";
        $scope.isGameScrolled = false;
        $scope.isChallengesScrolled = false;

        $scope.getOpenChallenge = function() {
            $scope.openTableLoader = true;
            var time = new Date().getTime();
            var url = SERVER_URL + 'infura/getLogs?page=' + $scope.challengePage + '&pageSize=' + $scope.challengePageSize + '&status=open&reputation=-1&myGameOnly=false&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.data.length < $scope.challengePageSize) {
                    $scope.canChallengeScroll = false;
                }

                if (!$scope.isChallengesScrolled)
                    $scope.logs = [];
                else
                    $scope.isChallengesScrolled = false;

                for (var i = 0; i < res.data.length; i++) {
                    $scope.logs.push(res.data[i]);
                }
                $scope.openTableLoader = false;
            }, function(err) {
                $scope.openTableLoader = false;
                $scope.getOpenChallenge();
            });
        }

        $scope.getOpenChallenge();

        $rootScope.openChallengeInterval = setInterval(function() {
            if($state.current.name == 'challenge'){
                $scope.challengePage = 1;
                $scope.logs = [];
                $scope.getOpenChallenge();                
            }
        }, 60000);

        $scope.getMoreOpenChallenge = function() {
            if ($scope.canChallengeScroll) {
                $scope.challengePage++;
                $scope.isChallengesScrolled = true;
                $scope.getOpenChallenge();
            }
        }

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

        $scope.canCreateChallenge = false;

        $scope.canCreateChallengeFun = function() {
            var time = new Date().getTime();            
            var url = SERVER_URL + 'challenge/challengeStatusByUser?userName=' + $rootScope.currentUser.userLoginDetails.playerName+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.data.length > 0) {
                    $scope.canCreateChallenge = false;
                } else {
                    $scope.canCreateChallenge = true;
                }
            }, function(err) {
                $scope.canCreateChallengeFun();
            });
        }

        $scope.canCreateChallengeFun();

        $scope.CONSTANTS = CONSTANTS;
        $scope.currentUserName = $rootScope.currentUser.userLoginDetails.playerName;
        $scope.filter = { myGameOnly: false, open: true, inProgess: true, finished: true, reputation: 0 };
        $scope.games = [];
        $scope.gamePage = 1;
        $scope.gamePageSize = CONSTANTS.pageSize;
        $scope.canGameScroll = true;

        $scope.getGameList = function() {
            //$rootScope.isLoading = true;
            $scope.tableLoader = true;
            var status = [];
            for (var filter in $scope.filter) {
                if ($scope.filter[filter] && filter == 'open') {
                    status.push(filter);
                } else if ($scope.filter[filter] && filter == 'inProgess') {
                    status.push(filter);
                } else if ($scope.filter[filter] && filter == 'finished') {
                    status.push(filter);
                }
            }

            var newStatus = '';
            if (status.length > 0) {
                newStatus += '&status=' + status
            }

            var reputation;
            if ($scope.filter.reputation == undefined)
                reputation = 0;
            else
                reputation = $scope.filter.reputation;
            var time = new Date().getTime();
            var url = SERVER_URL + 'infura/getLogs?page=' + $scope.gamePage + '&pageSize=' + $scope.gamePageSize + '&myGameOnly=' + $scope.filter.myGameOnly + '&reputation=' + reputation + newStatus+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.data.length < $scope.gamePageSize) {
                    $scope.canGameScroll = false;
                }

                if (!$scope.isGameScrolled)
                    $scope.games = [];
                else
                    $scope.isGameScrolled = false;


                for (var i = 0; i < res.data.length; i++) {
                    $scope.games.push(res.data[i]);
                }
                $scope.tableLoader = false;
            }, function(err) {
                $scope.tableLoader = false;
                $scope.getGameList();
            });
        }

        $scope.getGameList();

        $rootScope.gameInterval = setInterval(function() {
            if($state.current.name == 'challenge'){
                $scope.games = [];
                $scope.gamePage = 1;
                $scope.getGameList();
            }
        }, 60000);

        $scope.getMoreGameList = function() {
            if ($scope.canGameScroll) {
                $scope.gamePage++;
                $scope.isGameScrolled = true;
                $scope.getGameList();
            }
        }

        $scope.filteredGameLIst = function() {
            $scope.canGameScroll = true;
            $scope.gamePage = 1;
            $scope.games = [];
            $scope.getGameList();
        }

        setTimeout(() => {
            $(".gameScroll").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll: function() {
                        if (this.mcs.topPct == 100)
                            $scope.getMoreGameList()
                    }
                }
            });
            $(".challengeScroll").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll: function() {
                        if (this.mcs.topPct == 100)
                            $scope.getMoreOpenChallenge()
                    }
                }
            });
        }, 100);

        /**
         *   Create Challenge script
         */

        $scope.selectedAddress = "";

        $scope.isElectron = function() {
            if (chrome.ipcRenderer) return true;
            return false;
        }

        $scope.sendToElectron = function(message) {
            chrome.ipcRenderer.send(message);
        }

        chrome.ipcRenderer.on('close-metamask', function(event, arg){
           $scope.hideProcessingModal();
        });

        $scope.openMetamaskPopup = function() {
            $scope.sendToElectron('open-metamask-popup');
            $scope.selectedAddress = web3.eth.accounts[0];
            var accountInterval = setInterval(function() {
                if (web3.eth.accounts[0] !== $scope.selectedAddress) {
                    $scope.selectedAddress = web3.eth.accounts[0];
                    $scope.createChallenge();
                    clearInterval(accountInterval);
                } else if ($scope.selectedAddress) {
                    $scope.createChallenge();
                    clearInterval(accountInterval);
                }
            }, 100);
        }

        $scope.showProcessingModal = function() {
            $('#processing').modal({ // wire up the actual modal functionality and show the dialog
                "backdrop": "static",
                "keyboard": false,
                "show": true // ensure the modal is shown immediately
            });
        }

        $scope.hideProcessingModal = function() {
            $('#processing').modal('hide');
        }

        $scope.openMetamaskNotification = function() {
            $scope.sendToElectron('open-metamask-notification');
        }

        $scope.closeMetamaskPopup = function() {
            $scope.sendToElectron('close-metamask-popup');
        }

        $scope.closeMetamaskNotification = function() {
            $scope.sendToElectron('close-metamask-notification');
        }

        $scope.$on('showProcessing', function(event, result) { 
            setTimeout(function(){
                if(result){
                    $scope.showProcessingModal();
                }else{
                    $scope.hideProcessingModal();
                }
            }, 1000)
        });

        $scope.createChallenge = function(contractFunction) {
            $scope.sendToElectron('open-metamask-notification-2');

            var amount = web3.toWei($scope.amount, 'ether');
            var account = $scope.selectedAddress;
            var username = $rootScope.currentUser.userLoginDetails.playerName;
            var referrer = $rootScope.currentUser.userLoginDetails.referrerEthereumAddress ? $rootScope.currentUser.userLoginDetails.referrerEthereumAddress : '0x0';
            var contractAddr = CONSTANTS.challengeFactoryAddr;
            var ChallengeFactory = web3.eth.contract(CONSTANTS.challengeFactoryAbi);
            var challengeFactoryInstance = ChallengeFactory.at(contractAddr);

            var args = [amount, account, username, referrer];
            var data = `${challengeFactoryInstance['newChallenge'].getData.apply(null, args)}`;

            web3.eth.sendTransaction({ to: contractAddr, data: data }, (err, transactionHash) => {
                $scope.closeMetamaskPopup();
                if (err) {
                    $scope.$broadcast('showProcessing', false);
                } else {
                    console.log("create transactionHash", transactionHash);                    
                    getCreateTransactionReceipt(transactionHash);
                    $scope.$broadcast('showProcessing', true);
                }
            });

            function getCreateTransactionReceipt(transactionHash) {
                var deferred = $q.defer();
                var txInterval = setInterval(function() {
                    web3.eth.getTransactionReceipt(transactionHash, (err, reciept) => {
                        console.log("Waiting for create reciept...");
                        if (err) {
                            $scope.$broadcast('showProcessing', false);
                        } else if (reciept) {
                            clearInterval(txInterval);
                            console.log("Create transaction reciept", reciept);
                            $scope.sendToElectron('open-metamask-notification');

                            if (reciept && reciept.logs && reciept.logs.length > 0) {
                                var challengeAddr = reciept.logs[0]["address"];

                                var StandardToken = web3.eth.contract(CONSTANTS.standardTokenAbi);
                                var StandardTokenInstance = StandardToken.at(CONSTANTS.standardTokenAddr);

                                var args = [challengeAddr, amount];
                                var data = `${StandardTokenInstance['approve'].getData.apply(null, args)}`;

                                web3.eth.sendTransaction({ to: CONSTANTS.standardTokenAddr, data: data }, (err, transactionHash) => {
                                    if (err) {
                                        $scope.closeMetamaskNotification();
                                        $scope.closeMetamaskPopup();
                                        $scope.$broadcast('showProcessing', false);
                                    } else {
                                        console.log("approve transactionHash", transactionHash);
                                        $scope.closeMetamaskNotification();
                                        $scope.closeMetamaskPopup();
                                        getApproveTransactionReceipt(transactionHash, challengeAddr);
                                    }
                                });
                            } else {
                                $scope.closeMetamaskNotification();
                            }
                        }
                    });
                }, 1000);
            }

            function getApproveTransactionReceipt(transactionHash, challengeAddr) {
                $scope.$broadcast('showProcessing', true);
                var deferred = $q.defer();
                var txInterval = setInterval(function() {
                    web3.eth.getTransactionReceipt(transactionHash, (err, reciept) => {
                        console.log("Waiting for approve reciept...");
                        if (err) {
                            $scope.$broadcast('showProcessing', false);
                        } else if (reciept) {
                            console.log("Approve transaction reciept", reciept);
                            $scope.sendToElectron('open-metamask-notification');

                            var ChallengeContract = web3.eth.contract(CONSTANTS.challengeAbi);
                            var ChallengeContractInstance = ChallengeContract.at(challengeAddr);

                            var args = [];
                            var data = `${ChallengeContractInstance['fund'].getData.apply(null, args)}`;

                            web3.eth.sendTransaction({ to: challengeAddr, data: data }, (err, transactionHash) => {
                                if (err) {
                                    $scope.closeMetamaskNotification();
                                    $scope.closeMetamaskPopup();
                                    $scope.$broadcast('showProcessing', false);
                                } else {
                                    console.log("fund transactionHash", transactionHash);
                                    $scope.closeMetamaskNotification();
                                    $scope.closeMetamaskPopup();
                                }

                                setTimeout(function() {
                                    $scope.$broadcast('showProcessing', false);
                                    $scope.amount = "";
                                }, 100);
                            });
                            clearInterval(txInterval);
                        }
                    });
                }, 1000);
            }
        }
    };
})();