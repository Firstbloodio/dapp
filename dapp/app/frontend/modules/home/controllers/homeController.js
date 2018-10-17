(function() {
    'use strict';
    angular
        .module('app.home')
        .controller('homeController', homeController);

    homeController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope'];

    function homeController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope) {
        var ctrl = this;
        console.log(localStorage.getItem('hideLoader'));
        if(angular.isUndefined(localStorage.getItem('hideLoader')) || localStorage.getItem('hideLoader') == 'false' || localStorage.getItem('hideLoader') == null){
            $scope.appConfigureModal = true;
            $('#configure').modal({ "backdrop": "static", "keyboard": false, "show": true });            
        }

       

        $scope.checkLastBlockInterval = setInterval(function(){
            if(angular.isUndefined(localStorage.getItem('hideLoader')) || localStorage.getItem('hideLoader') == 'false' || localStorage.getItem('hideLoader') == null){
               $scope.checkLastBlock();    
            }
        }, 10000);

        $scope.checkLastBlock = function() {
            var url = SERVER_URL + 'infura/checkLastBlock',
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if(res.type=='success' && res.data){
                    clearInterval($scope.checkLastBlockInterval);
                    $scope.appConfigureModal = false;
                    setTimeout(function() {
                        $('#configure').modal('hide');
                        localStorage.setItem('hideLoader', 'true');
                    }, 300);
                }
            }, function(err) {
                $scope.tableLoader = false;
                $rootScope.isLoading = false;
                $scope.getGameList();
            });
        }

        ctrl.$state = $state;
        $scope.leaderLoader = true;
        $scope.tableLoader = true;
        $scope.CONSTANTS = CONSTANTS;
        $scope.currentUserName = $rootScope.currentUser.userLoginDetails.playerName;
        $scope.filter = { myGameOnly: false, open: true, inProgess: true, finished: true, reputation: 0 };
        $scope.isLeaderScrolled = false;
        $scope.isGameScrolled = false;
        $scope.isAccountScrolled = false;
        $scope.games = [];
        $scope.gamePage = 1;
        $scope.gamePageSize = CONSTANTS.pageSize;
        $scope.canGameScroll = true;

        $scope.getGameList = function() {
             $scope.getBlockrange();
            
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
            var url = SERVER_URL + 'infura/getLogs?page=' + $scope.gamePage + '&pageSize=' + $scope.gamePageSize + '&myGameOnly=' + $scope.filter.myGameOnly + '&reputation=' + reputation + newStatus + '&time=' + time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res) {
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
                    if ($scope.games.length > 0) {
                        $scope.appConfigureModal = false;

                        setTimeout(function() {
                            $('#configure').modal('hide');
                            localStorage.setItem('hideLoader', 'true');
                        }, 300);
                    }
                }
                $scope.tableLoader = false;
                $rootScope.isLoading = false;
            }, function(err) {
                $scope.tableLoader = false;
                $rootScope.isLoading = false;
                $scope.getGameList();
            });
        }

        $scope.getGameList();


        $rootScope.gameInterval = setInterval(function() {
            if ($state.current.name == 'home') {
                $scope.gamePage = 1;
                $scope.games = [];
                $scope.canGameScroll = true;
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

        $scope.jobSatatus = function(address) {
            $scope.redirectWithParams('challengeStatus', { address: address });
        }

        $scope.filteredGameLIst = function() {
            $scope.canGameScroll = true;
            $scope.gamePage = 1;
            $scope.games = [];
            $scope.getGameList();
        }

        $rootScope.leaderboard = [];
        $scope.leaderboardPage = 1;
        $scope.leaderboardPageSize = CONSTANTS.pageSize;
        $scope.canLeaderboardScroll = true;

        $scope.getLeaderBoardList = function() {
            $scope.leaderLoader = true;
            var time = new Date().getTime();
            var url = SERVER_URL + 'infura/leaderboard?page=' + $scope.leaderboardPage + '&pageSize=' + $scope.leaderboardPageSize + '&orderBy=' + $scope.orderBy + '&time=' + time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.data.length < $scope.leaderboardPageSize) {
                    $scope.canLeaderboardScroll = false;
                }

                if (!$scope.isLeaderScrolled)
                    $rootScope.leaderboard = [];
                else
                    $scope.isLeaderScrolled = false;

                if ($scope.appConfigureModal == false) {

                    angular.forEach(res.data, function(value, key) {
                        $rootScope.leaderboard.push(value)
                    });
                }

                $rootScope.userProfile = $rootScope.leaderboard.filter(function(data,index){
                     return $rootScope.currentUser.userLoginDetails.playerName == data.player;
                });

                $scope.leaderLoader = false;
            }, function(err) {
                $scope.leaderLoader = false;
                $scope.getLeaderBoardList();
            });
        }

        $scope.orderBy = 'winRate';
        $scope.getLeaderBoardList();

        $rootScope.leaderboardInterval = setInterval(function() {
            $rootScope.leaderboard = [];
            $scope.leaderboardPage = 1;
            $scope.canLeaderboardScroll = true;
            $scope.getLeaderBoardList();
        }, 60000);

        $scope.LeaderboardOrderBy = function(orderByColumn) {
            $rootScope.leaderboard = [];
            $scope.orderBy = orderByColumn;
            $scope.leaderboardPage = 1;
            $scope.getLeaderBoardList();
        }

        $scope.getMoreLeaderBoardList = function() {
            if ($scope.canLeaderboardScroll) {
                $scope.leaderboardPage++;
                $scope.leaderLoader = true;
                $scope.isLeaderScrolled = true;
                $scope.getLeaderBoardList();
            }
        }

        $scope.findMatch = function() {
            var time = new Date().getTime();
            let name = JSON.parse(CommonService.getStorage('user')).userLoginDetails.playerName;
            var url = SERVER_URL + 'findmatch/findMatch?playerName=' + name + '&time=' + time,
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

        /** for my job if login as witness **/

        $scope.accountStatus = [];
        $scope.myJobPage = 1;
        $scope.myJobPageSize = CONSTANTS.pageSize;
        $scope.canMyJobScroll = true;
        $scope.getAccountStatus = function() {
            var time = new Date().getTime();
            var steamId = $rootScope.currentUser.userLoginDetails.steamId;
            var ethereumPrivateKey = $rootScope.currentUser.userLoginDetails.ethereumPrivateKey;
            var url = SERVER_URL + 'witness/witness_account_status?ethereumPrivateKey=' +ethereumPrivateKey+ '&page=' + $scope.myJobPage + '&pageSize=' + $scope.myJobPageSize+'&steam_id='+steamId+'&time='+time,
                method = 'GET',
                obj = {};
            CommonService.apiCall(url, method, obj).then(function(res) {
                if (res.type == 'success') {

                    if (!$scope.isAccountScrolled)
                        $scope.accountStatus = [];
                    else
                        $scope.isAccountScrolled = false;

                    angular.forEach(res.data, function(value, key) {
                        $scope.accountStatus.push(value)
                    });

                    if (res.data.length < $scope.myJobPageSize) {
                        $scope.canMyJobScroll = false;
                    }
                }
            });
        }

        if ($rootScope.currentUser.userDetails.isWitness) {
            $scope.getAccountStatus();
        }

        $scope.getMoreAccountStatus = function() {
            if ($scope.canMyJobScroll) {
                $scope.myJobPage++;
                $scope.isAccountScrolled = true;
                $scope.getAccountStatus();
            }
        }


        setInterval(function() {
            if ($state.current.name == 'home' && $rootScope.currentUser.userDetails.isWitness) {
                $scope.myJobPage = 1;
                $scope.canMyJobScroll = true;
                $scope.getAccountStatus();
            }
        }, 60000);

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
            $(".leaderboardScroll").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll: function() {
                        if (this.mcs.topPct == 100)
                            $scope.getMoreLeaderBoardList()
                    }
                }
            });
            $(".my_jobs_scroll").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll: function() {
                        if (this.mcs.topPct == 100)
                            $scope.getMoreAccountStatus()
                    }
                }
            });
        }, 10);
    };
})();