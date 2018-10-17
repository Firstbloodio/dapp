(function() {
    'use strict';
    angular
        .module('app.witness')
        .controller('witnessController', witnessController);

    witnessController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope'];

    function witnessController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope) {
        var ctrl = this;
        /*if (!($rootScope.currentUser.userDetails.isPlayer && $rootScope.currentUser.userDetails.isWitness)) {
            $scope.appConfigureModal = true;
            $('#configure').modal({ "backdrop": "static", "keyboard": false, "show": true });
        }*/
        ctrl.$state = $state;
        $scope.CONSTANTS = CONSTANTS;
        $rootScope.isLoading = true;
        $scope.depositEnable = true;
        $scope.withdrawEnable = true;
        $scope.balance = 0;
        $scope.transactionAmt = '';
        
        $scope.getBalance = function() {
            var time = new Date().getTime();
            var url = SERVER_URL + 'witness/get_balance?pk=' + $rootScope.currentUser.userLoginDetails.ethereumPrivateKey + '&time=' + time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                if (res.type == 'success') {
                    $scope.balance = res.data.balance;
                } else {
                    $rootScope.showToast('error', res.message);
                }
                $rootScope.isLoading = false;
            });
        }
        $scope.getBalance();

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

        $scope.transaction = function(transactionMethod) {
            $scope.showProcessingModal();
            const url = (transactionMethod == 'deposit') ? SERVER_URL + 'metamask/deposit_amount' : SERVER_URL + 'metamask/withdraw_amount';
            const method = 'POST';
            const obj = { amount: $scope.transactionAmt, pk: $rootScope.currentUser.userLoginDetails.ethereumPrivateKey }
            CommonService.apiCall(url, method, obj).then(function(res) {
                $scope.transactionAmt = '';
                if (res.type == 'success' && res.data.status == '0x1') {
                    const message = (transactionMethod == 'deposit') ? 'Successful Deposit.' : 'Successful Withdrawal.';
                    $rootScope.showToast('success', message);
                    $scope.getBalance();
                    $scope.getAccountLogs();
                    var witnessTx = (CommonService.getStorage('witnessTx')) ? JSON.parse(CommonService.getStorage('witnessTx')) : [];

                    var witnessTxCount = $scope.accountLogs.length + 1;

                    obj.event = (transactionMethod == 'deposit') ? 'Deposit' : 'Withdraw';
                    obj.date = new Date();
                    obj.transactionHash = res.data.transactionHash;
                    witnessTx.push(obj);
                    CommonService.setStorage('witnessTx', JSON.stringify(witnessTx));
                    CommonService.setStorage('witnessTxCount', witnessTxCount);
                    $scope.hideProcessingModal();
                } else {
                    const message = (transactionMethod == 'deposit') ? "There's some error while making a Deposit. Please try again!" : "There's some error while making a  Withdrawal. Please try again!";
                    $rootScope.showToast('error', message);
                    $scope.hideProcessingModal();
                }
                setTimeout(()=>{
                    $scope.depositEnable = true;
                    $scope.withdrawEnable = true;
                },500);
            }, function(err) {
                const message = (transactionMethod == 'deposit') ? "There's some error while making a Deposit. Please try again!" : "There's some error while making a  Withdrawal. Please try again!";
                $rootScope.showToast('error', message);
                $scope.hideProcessingModal();
                $scope.depositEnable = true;
                $scope.withdrawEnable = true;
            });
        }

        $scope.jobSatatus = function(address) {
            $scope.redirectWithParams('challengeStatus', { address: address });
        }


        $scope.accountLogs = [];
        $scope.getAccountLogs = function() {
            var url = SERVER_URL + 'witness/account_log',
                method = 'POST',
                obj = { pk: $rootScope.currentUser.userLoginDetails.ethereumPrivateKey };
            CommonService.apiCall(url, method, obj).then(function(res) {
                if (res.type == 'success') {
                    var witnessTxCount = (CommonService.getStorage('witnessTxCount')) ? CommonService.getStorage('witnessTxCount') : 0;
                    var witnessTx = (CommonService.getStorage('witnessTx')) ? JSON.parse(CommonService.getStorage('witnessTx')) : [];
                    if(!res.data.logs) {
                        res.data.logs = [];
                    }

                    const logsLength = (res.data && res.data.logs) ? res.data.logs.length : 0 ;

                    if (witnessTxCount > logsLength) {
                        var tempLog = witnessTxCount - logsLength;
                        for (var i = 0; i < tempLog; i++) {
                            res.data.logs.splice(0, 0, witnessTx[i]);
                        }
                    } else if (witnessTxCount == logsLength) {
                        CommonService.deleteStorage('witnessTxCount');
                        CommonService.deleteStorage('witnessTx');
                    }
                    var balance = res.data.amount;
                    angular.forEach(res.data.logs, (data) => {
                        data.balance = balance;
                        switch (data.event) {
                            case 'Deposit':
                                balance -= (!isNaN(Number(data.amount))) ? Number(data.amount) : 0;
                                break;
                            case 'Withdraw':
                                balance += (!isNaN(Number(data.amount))) ? Number(data.amount) : 0;
                                break;
                        }
                    })
                    $scope.accountLogs = res.data.logs;
                }
                $rootScope.isLoading = false;
            });
        }
        $scope.getAccountLogs();

        $scope.accountStatus = [];
        $scope.myJobPage = 1;
        $scope.myJobPageSize = CONSTANTS.pageSize;
        $scope.canMyJobScroll = true;
        $scope.getAccountStatus = function() {
            $scope.getBlockrange();
            var time = new Date().getTime();
            var steamId = $rootScope.currentUser.userLoginDetails.steamId;
            var ethereumPrivateKey = $rootScope.currentUser.userLoginDetails.ethereumPrivateKey;
            var url = SERVER_URL + 'witness/witness_account_status?ethereumPrivateKey=' +ethereumPrivateKey+ '&page=' + $scope.myJobPage + '&pageSize=' + $scope.myJobPageSize+'&steam_id='+steamId+'&time='+time,
                method = 'GET',
                obj = {};
            CommonService.apiCall(url, method, obj).then(function(res) {
                if (res.type == 'success') {
                    angular.forEach(res.data, function(value, key) {
                        $scope.accountStatus.push(value)
                    });

                    if (res.data.length < $scope.myJobPageSize) {
                        $scope.canMyJobScroll = false;
                    }
                }
                $rootScope.isLoading = false;
            });
        }

        $scope.getPenalty = function() {
           
            var url = SERVER_URL + 'witness/witness_penalty',
                method = 'GET',
                obj = {};
            CommonService.apiCall(url, method, obj).then(function(res) {
                if (res.type == 'success') {
                    $rootScope.witnessPenaltyCount = res.data.witness_penalty;
                    $rootScope.witnessJobCount = res.data.witness_job;
                }
            });
        }
        $scope.getAccountStatus();
        $scope.getPenalty();
        setInterval(function() {
            $scope.accountStatus = [];
            $scope.myJobPage = 1;
            $scope.canMyJobScroll = true;
            $scope.getAccountStatus();
            $scope.getAccountLogs();
            $scope.getPenalty();
        }, 60000);

        $scope.getMoreAccountStatus = function() {
            if ($scope.canMyJobScroll) {
                $scope.myJobPage++;
                $scope.getAccountStatus();
            }
        }

        setTimeout(() => {
            $(".box-scroll").mCustomScrollbar({
                scrollbarPosition: "outside",
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