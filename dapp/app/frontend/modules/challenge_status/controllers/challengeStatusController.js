(function(){
    'use strict';
    angular
    .module('app.challengeStatus')
    .controller('challengeStatusController', challengeStatusController);

    challengeStatusController.$inject = ['$scope', '$state', 'CommonService', 'CONSTANTS', 'SERVER_URL', '$rootScope', '$q'];

    function challengeStatusController($scope, $state, CommonService, CONSTANTS, SERVER_URL, $rootScope, $q) { 
        var ctrl = this;
        ctrl.$state = $state;
        $scope.CONSTANTS = CONSTANTS;
        $scope.address = $state.params.address;
        $scope.eventLogs = [];
        $scope.showBecomeAHost = false;
        $scope.isAccountScrolled = false;
        $scope.witnessRespondedWinner = '';
        $scope.alreadyJuryNeeded = false;
        $scope.alreadyVotedData = {};
        $scope.payoutDetails = {};
        $scope.witnessJururCount = 0;
        $scope.witnessCount = 0;
        $scope.jurorCount = 0;
        $scope.resolveTxHash='';
        $scope.getChallengelogs = function() {
            $rootScope.isLoading = true;
            var time = new Date().getTime();
			var url = SERVER_URL + 'infura/getEventLogs?address=' + $scope.address+'&time='+time,
                method = 'get';
                $scope.userKey1 = '';
                $scope.userKey2 = '';

            CommonService.apiCall(url, method, {}).then(function(res) {
                $rootScope.isLoading = false;
                if(res.type == 'success'){
                    $scope.witnessResponded = [];
                    $scope.juryVoted = [];
                    angular.forEach(res.data, (value, data)=>{
                        value.arguments = JSON.parse(value.args);
                        value.date = new Date(value.date);
                        $scope.eventLogs.push(value);

                        if(value['event'] == 'Report') {
                            $scope.witnessRespondedWinner = value.arguments.winner;
                        }

                        if(value['event'] == 'JuryNeeded') {
                            $scope.alreadyJuryNeeded = true;
                        }

                        if(value['event'] == 'NewChallenge') {
                            $scope.userKey1 = value.arguments.key1;
                        }

                        if(value['event'] == 'Respond') {
                            $scope.userKey2 = value.arguments.key2;
                        }

                        if(value['event'] == 'Report') {
                            $scope.witnessJururCount++;
                            $scope.witnessCount++;
                        }
                        if(value['event'] == 'JuryVote') {
                            $scope.witnessJururCount++;
                            $scope.jurorCount++;
                        }

                        if(value['event'] == 'Resolve') {

                            value.arguments.winnerAmount = web3.fromWei(value.arguments.winnerAmount, 'ether');
                            value.arguments.hostAmount = web3.fromWei(value.arguments.hostAmount,'ether');
                            value.arguments.witnessJuryAmount = ((web3.fromWei(value.arguments.witnessJuryAmount,'ether'))/2).toFixed(18);
                            $scope.payoutDetails = value.arguments;
                            $scope.resolveTxHash = value.transactionHash;
                        }

                        if(value['event'] == 'Report') {
                             $scope.witnessResponded.push(value);
                        }
                        
                        // if(value['event'] == 'JuryVoted') {
                        //      $scope.juryVoted.push(value);
                        // }
                    })

                    if(res.data[res.data.length -1].event == 'Respond') {
                        $scope.eventLogs.push({event: "awaitHost"});
                    }

                    if(res.data[res.data.length -1].event == 'Report' && $scope.witnessResponded.length >=2) {
                        $scope.eventLogs.push({event: "winnerDetermine"});
                    }

                    if(res.data[res.data.length -1].event == 'SetWitnessJuryKey') {
                        $scope.eventLogs.push({event: "gameOngoing"});
                        $scope.eventLogs.push({event: "awaitWitness"});
                    }
                }
            },function(err) {
                $rootScope.isLoading = false;
                $scope.getChallengelogs();
            });
        }
        $scope.getChallengelogs(); 

        $scope.jobSatatus = function(address){
            $scope.redirectWithParams('challengeStatus', {address:address});
        }  
        
        $scope.challengeStatus = {};
        $scope.getChallengeStatus = function() {
            $rootScope.isLoading = true;
            var time = new Date().getTime();
            var url = SERVER_URL + 'infura/challengeStatusDetails?address=' + $scope.address+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                $rootScope.isLoading = false;
                if(res.type == 'success'){
                    $scope.challengeStatus = res.data[0];

                    $scope.getChallengeBlockNumber($scope.challengeStatus.address)

                    if(($scope.challengeStatus.event == "Respond" || $scope.challengeStatus.event == "SetWitnessJuryKey") && $scope.challengeStatus.hostKey == ''){
                        $scope.showBecomeAHost = true;
                    }else{
                        $scope.showBecomeAHost = false;
                    }

                    if($scope.challengeStatus.witnessJuryRequestNum && $rootScope.currentUser.userLoginDetails.witnessName) {
                        $scope.checkCanJuryVote($scope.challengeStatus.witnessJuryRequestNum);
                    }


                }
            },function(err) {
                $rootScope.isLoading = false;
            });
        }
        $scope.getChallengeStatus();


        /** getChallengeBlockNumber**/
        $scope.challengeBlock = {};
        $scope.getChallengeBlockNumber = function(address){
            $rootScope.isLoading = true;
            var time = new Date().getTime();
            var url = SERVER_URL + 'challenge/block_number?address=' + address+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                $rootScope.isLoading = false;
                if(res.type == 'success'){
                    $scope.challengeBlock = res.data;
                    $scope.canPayout();    
                }
            },function(err) {
                $rootScope.isLoading = false;
            });
        }



         /** can juryVote**/
        $scope.canJuryVote = false;
        $scope.checkCanJuryVote = function(challengeReqNumber) {
            $rootScope.isLoading = true;
            var time = new Date().getTime(); 
            var ethereumPrivateKey = $rootScope.currentUser.userLoginDetails.ethereumPrivateKey;
            var url = SERVER_URL + 'challenge/can_jury_vote?request_number=' + challengeReqNumber+'&ethereumPrivateKey='+ethereumPrivateKey+'&time='+time,
                method = 'get';
            CommonService.apiCall(url, method, {}).then(function(res) {
                $rootScope.isLoading = false;
                if(res.type == 'success' && res.data && res.data.canVote && res.data.canVote.length > 0) {
                    $scope.canJuryVote = true;

                    if(res.data && res.data.alreadyVoted && res.data.alreadyVoted.length > 0){
                        $scope.alreadyVotedData = res.data.alreadyVoted[0];
                    }
                }

            },function(err) {
                $rootScope.isLoading = false;
            });
        }

        /**
        * for juryVote 
        */
        $scope.juryVote = function(juryResult) {

            var pk = $rootScope.currentUser.userLoginDetails.ethereumPrivateKey;
            var challengeAddr = $scope.challengeStatus.address;
            var requestNumber = $scope.challengeStatus.witnessJuryRequestNum;

            $rootScope.isLoading = true;
            var url = SERVER_URL + 'metamask/vote_jury',
                method = 'POST',
                obj = {challengeAddr: challengeAddr, pk: pk, requestNumber: requestNumber, juryResult: juryResult};
                console.log('obj', obj);
            CommonService.apiCall(url, method, obj).then(function(res) {
                $rootScope.isLoading = false;
                if(res.type == 'success' && res.data && res.data.length > 0 && res.data[0].status == 'Pending') {
                    $scope.canJuryVote = true;
                }
            },function(err) {
                $rootScope.isLoading = false;
            });

        }


        /*  for rescue
        */
/*        $scope.rescue = function() {
            $rootScope.isLoading = true;
            var url = SERVER_URL + 'challenge/rescue_funds',
                method = 'POST',
                obj = {address: $scope.address}                
            CommonService.apiCall(url, method, obj).then(function(res) {
                $rootScope.isLoading = false;
                
            },function(err) {
                $rootScope.isLoading = false;
            });

        }*/

        /** for requestJury **/        

        $scope.requestJury = function() {        
            $scope.sendToElectron('open-metamask-popup');
            $scope.selectedAddress = web3.eth.accounts[0];
            var accountInterval = setInterval(function() {
                if (web3.eth.accounts[0] !== $scope.selectedAddress) {
                    $scope.selectedAddress = web3.eth.accounts[0];
                    $scope.requestJuryChallenge(); 
                    clearInterval(accountInterval);
                }else if($scope.selectedAddress){
                    $scope.requestJuryChallenge(); 
                    clearInterval(accountInterval);
                }
            }, 100);
        }

        $scope.requestJuryChallenge = function(contractFunction) {
            $scope.sendToElectron('open-metamask-notification-2');            
            var challengeAddr = $scope.challengeStatus.address;
            console.log(challengeAddr);
            var ChallengeContract = web3.eth.contract(CONSTANTS.challengeAbi);
            var ChallengeContractInstance = ChallengeContract.at(challengeAddr);   
            var args = [];
            var data = `${ChallengeContractInstance['requestJury'].getData.apply(null, args)}`;
            web3.eth.sendTransaction({to: challengeAddr, data: data}, (err, requestJuryHash) => {
                if (err){
                    console.log("respond err", err);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }else{
                    console.log("requestJury hash", requestJuryHash);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }
            });            
        }

        /** for rescue **/
        $scope.rescue = function() {
        
            $scope.sendToElectron('open-metamask-popup');
            $scope.selectedAddress = web3.eth.accounts[0];
            var accountInterval = setInterval(function() {
                if (web3.eth.accounts[0] !== $scope.selectedAddress) {
                    $scope.selectedAddress = web3.eth.accounts[0];
                    $scope.rescueChallenge(); 
                    clearInterval(accountInterval);
                }else if($scope.selectedAddress){
                    $scope.rescueChallenge(); 
                    clearInterval(accountInterval);
                }
            }, 100);
        }

        $scope.rescueChallenge = function(contractFunction) {

            $scope.sendToElectron('open-metamask-notification-2');            

            var challengeAddr = $scope.challengeStatus.address;
            
            var ChallengeContract = web3.eth.contract(CONSTANTS.challengeAbi);
            var ChallengeContractInstance = ChallengeContract.at(challengeAddr);   

            var args = [];
            var data = `${ChallengeContractInstance['rescue'].getData.apply(null, args)}`;
            web3.eth.sendTransaction({to: challengeAddr, data: data}, (err, requestJuryHash) => {
                if (err){
                    console.log("rescue err", err);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }else{
                    console.log("rescue hash", requestJuryHash);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }
            }); 
        }

        /**for payout fund**/
        $scope.payout = function() {
            $scope.sendToElectron('open-metamask-popup');
            $scope.selectedAddress = web3.eth.accounts[0];
            var accountInterval = setInterval(function() {
                if (web3.eth.accounts[0] !== $scope.selectedAddress) {
                    $scope.selectedAddress = web3.eth.accounts[0];
                    $scope.payoutFund(); 
                    clearInterval(accountInterval);
                }else if($scope.selectedAddress){
                    $scope.payoutFund(); 
                    clearInterval(accountInterval);
                }
            }, 100);
        }

        $scope.payoutFund = function() {            
            $scope.sendToElectron('open-metamask-notification-2');          

            var witnessAddr =  CONSTANTS.witnessAddr;            
            var witnessJuryContract = web3.eth.contract(CONSTANTS.witnessJuryAbi);
            var witnessJuryContractInstance = witnessJuryContract.at(witnessAddr);   

            var args = [parseInt($scope.challengeStatus.witnessJuryRequestNum)];
            var data = `${witnessJuryContractInstance['resolve'].getData.apply(null, args)}`;
            web3.eth.sendTransaction({to: witnessAddr, data: data}, (err, payoutFundHash) => {
                if (err){
                    console.log("payoutFundHash err", err);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }else{
                    console.log("payoutFundHash hash", payoutFundHash);
                    $scope.closeMetamaskNotification();
                    $scope.closeMetamaskPopup();
                }
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
                if(res.type == 'success') {
                    
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
                $rootScope.isLoading = false;
            });
        }

        if($rootScope.currentUser.userDetails.isWitness) {
            $scope.getAccountStatus();
        }

        $scope.getMoreAccountStatus = function(){
            if ($scope.canMyJobScroll) {
                $scope.myJobPage++;
                $scope.isAccountScrolled = true;
                $scope.getAccountStatus();
            }
        }

        $scope.payoutFlag = false;
        $scope.blockPeriod = 6000;
        
        $scope.canPayout = function(){           
            var url = SERVER_URL + 'infura/canPayout?address=' + $scope.address,
                method = 'get';

            CommonService.apiCall(url, method, {}).then(function(res) {              
                $scope.blockPeriod = parseInt(res.data.blockPeriod);
                if(res.type == 'success'){
                    if(res.data.blockNumber != null && $scope.challengeBlock.current_block > res.data.blockNumber + $scope.blockPeriod){
                        $scope.payoutFlag = res.data.canPayout;
                    }else{
                        $scope.payoutFlag = false;
                    }
                }
            },function(err) {
                console.log('err in can payout')
            });
        }

        

        setInterval(function(){
            $scope.myJobPage = 1;
            $scope.canMyJobScroll = true;
            $scope.getAccountStatus();
        }, 60000);

        setTimeout(() => {
            $(".eventScroll").mCustomScrollbar({
                scrollbarPosition: "outside"                
            });
            $(".my_jobs_scroll").mCustomScrollbar({
                scrollbarPosition: "outside",
                callbacks: {
                    onScroll : function() {
                        if(this.mcs.topPct == 100)
                            $scope.getMoreAccountStatus()
                    }
                }
            });
        }, 10);

        /**
        *   Respond Challenge script
        */

        $scope.selectedAddress = "";
        $scope.amount = 0;

        $scope.isElectron = function() {
          if(chrome.ipcRenderer) return true;
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
                    $scope.respondChallenge(); 
                    clearInterval(accountInterval);
                }else if($scope.selectedAddress){
                    $scope.respondChallenge(); 
                    clearInterval(accountInterval);
                }
            }, 100);
        }

        $scope.showProcessingModal = function() {
            $('#processing').modal({ // wire up the actual modal functionality and show the dialog
                "backdrop"  : "static",
                "keyboard": true,
                "show": true // ensure the modal is shown immediately
            });
        }

        $scope.hideProcessingModal = function() {
            setTimeout(function(){
                $('#processing').modal('hide');
            },1000);
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

        $scope.updateChallenge = function(data) {

            var url = SERVER_URL + 'challenge/updateChallenge',
                method = 'put';
            CommonService.apiCall(url, method, data).then(function(res) {
               console.log(res);
            }, function(err) {
               console.log(err)
               
            });
        }

        $scope.respondChallenge = function(contractFunction) {            
            $scope.sendToElectron('open-metamask-notification-2');
            var amount = web3.toWei($scope.challengeStatus.amount);
            var account = $scope.selectedAddress;
            var challengeAddr = $scope.challengeStatus.address;
            var username = $rootScope.currentUser.userLoginDetails.playerName;
            var contractAddr = CONSTANTS.standardTokenAddr;
            var StandardToken = web3.eth.contract(CONSTANTS.standardTokenAbi);
            var StandardTokenInstance = StandardToken.at(contractAddr);   

            var args = [challengeAddr, amount];
            var data = `${StandardTokenInstance['approve'].getData.apply(null, args)}`;
            
            /*var updateChallenge = {};
            updateChallenge['user2'] = account;
            updateChallenge['key2'] = username;
            updateChallenge['event'] = 'Respond';*/

            web3.eth.sendTransaction({to: contractAddr, data: data}, (err, transactionHash) => {
                if (err){
                    $scope.closeMetamaskPopup();
                    console.log("approve err", err);
                }else{
                    $scope.closeMetamaskPopup();
                    console.log("transactionHash", transactionHash);
                    getApproveTransactionReceipt(transactionHash);
                    $scope.showProcessingModal();
                }
            });            

            function getApproveTransactionReceipt(transactionHash){
                var deferred = $q.defer();
                var txInterval = setInterval(function(){
                    web3.eth.getTransactionReceipt(transactionHash, (err, reciept) => {
                        console.log("Waiting for approve reciept...");
                        if (err) {
                            console.log('approve reciept error', err);
                            $scope.closeMetamaskPopup();
                        }else if(reciept){
                            console.log("Approve transaction reciept", reciept);

                            $scope.sendToElectron('open-metamask-notification');

                            var ChallengeContract = web3.eth.contract(CONSTANTS.challengeAbi);
                            var ChallengeContractInstance = ChallengeContract.at(challengeAddr);   

                            /*updateChallenge['address'] = challengeAddr;
                            updateChallenge['date'] = new Date().toUTCString();*/

                            var args = [account, username];
                            var data = `${ChallengeContractInstance['respond'].getData.apply(null, args)}`;
                            web3.eth.sendTransaction({to: challengeAddr, data: data}, (err, transactionHash) => {
                                if (err){
                                    console.log("respond err", err);
                                    $scope.closeMetamaskNotification();
                                    $scope.closeMetamaskPopup();
                                }else{
                                    console.log("respond transactionHash", transactionHash);
                                }
                                setTimeout(function(){
                                    $scope.closeMetamaskNotification();
                                    $scope.closeMetamaskPopup();
                                    $scope.hideProcessingModal();
                                    $state.go('home');
                                }, 500);
                            }); 
                            clearInterval(txInterval);
                        }
                    });
                }, 1000);
            }
        }



        $scope.becomeAHost = function(){
            $scope.showProcessingModal();
            var challengeAddr = $scope.challengeStatus.address;
            var witnessName = $rootScope.currentUser.userLoginDetails.witnessName;
            var steam_id = $rootScope.currentUser.userLoginDetails.steamId;
            var steam_password = $rootScope.currentUser.userLoginDetails.steamPassword;
            var pk = $rootScope.currentUser.userLoginDetails.ethereumPrivateKey;
            var key1 = $scope.challengeStatus.key1;
            var key2 = $scope.challengeStatus.key2;
            var data = {"challengeAddr": challengeAddr, 'hostName': witnessName, 'user1': key1, 'user2': key2, 'witness_name': witnessName, 'steam_password': steam_password, 'pk': pk};
            var url = SERVER_URL + "metamask/createHost";
            var method = "POST";
            CommonService.apiCall(url, method, data).then(function(hostResult) {              
                if(hostResult.type == "success"){
                    $scope.showBecomeAHost = false;
                    $scope.hideProcessingModal();
                    if(hostResult.data) {
                        $rootScope.showToast('success', "We've successfully created your lobby.");  
                        $state.go('home');                        
                    } else {
                        $rootScope.showToast('error', 'Some error occured , Lobby destroyed!');  
                    }
                }else{
                    $scope.hideProcessingModal();
                }
            },function(err) {
                if(err && !err.data) {
                    $rootScope.showToast('error', 'Something went wrong.');                    
                } else{
                    $rootScope.showToast('error', err.data.message);                    
                }
                $scope.hideProcessingModal();                    

                
            });
        }        
    };

})();