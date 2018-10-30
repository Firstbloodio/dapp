const express = require('express');
const router = express.Router();
const https = require("https");
const parseString = require('xml2js').parseString;
const fs = require('fs');
const steam = require('steam');
const dota2 = require('dota2')
const ethUtil = require('ethereumjs-util');
const Tx = require('ethereumjs-tx');
const async = require('async');
const BigNumber = require('bignumber.js');
const Client = require('node-rest-client').Client;
const client = new Client();
const sqlite3 = require('sqlite3').verbose();
var db = "";
var isWin = process.platform === "win32";

try {
  steam.servers = JSON.parse(fs.readFileSync(`${process.cwd()}/servers.json`));
} catch (err) {
  console.log(`Error reading servers.json: ${err}`);
}

if(isWin){
    db = new sqlite3.Database('firstblood.db');
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}
const responseHandler = require('../library/responseHandler');
const constant = require('./constant.js');
const CompiledContracts = require('../assets/files/compiled.json').contracts;
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));

const contracts = {
  "1ST":{
      "type": 'StandardToken',
      "address": constant.standardTokenAddress
  },
  "WitnessJury":{
      "type": 'WitnessJury',
      "address": constant.witnessJuryAddr
  },
  "ChallengeFactory":{
      "type": 'ChallengeFactory',
      "address": constant.challengeFactoryAddr
  }
};

router.get('/', function(req, res, next) {
  res.send("ok");
});

router.post('/createHost', function(req, res, next) {
    const challengeAddr = req.body.challengeAddr;
    const hostName = req.body.hostName;
    const user1 = req.body.user1;
    const user2 = req.body.user2;
    const witness_name = req.body.witness_name;
    const steam_password = req.body.steam_password;
    const pk = req.body.pk;
    var accountAddress = ethUtil.privateToAddress(Buffer.from(pk, 'hex')).toString("hex");
    accountAddress = '0x' + accountAddress;


    Promise.resolve(steamConnect(witness_name, steam_password)).then(function(steamConnected){
      if(steamConnected) {
        Promise.resolve(createHost(challengeAddr, hostName, user1, user2, witness_name, steam_password, accountAddress, pk)).then(function(result){

            responseHandler.send(req, res, 'success', 200, result, null);


        }).catch(function(e) {
          console.log('createHost : error ->', e);
          responseHandler.send(req, res, 'error', 500, null, e);
        });

      } else {
        responseHandler.send(req, res, 'error', 500, null, 'Steam connection failed. Please try again');
      }
      console.log('steamConnected', steamConnected);

        //responseHandler.send(req, res, 'success', 200, result, null);


    }).catch(function(e) {
      responseHandler.send(req, res, 'error', 500, null, 'Steam connection failed. Please try again');
    })


});

const steamConnect = async(witness_name, steam_password) => {
    return new Promise((resolve, reject) => {
      try{
        const steamClient = new steam.SteamClient();
        const steamUser = new steam.SteamUser(steamClient);
        const Dota2 = new dota2.Dota2Client(steamClient, true);
        var onSteamLogOn = function onSteamLogOn(logonResp) {
          if(logonResp.eresult == steam.EResult.OK) {
            Dota2.launch(logonResp)
            Dota2.on('ready', function() {
              Dota2.exit();
              steamClient.disconnect();
              resolve(true);
            });
          } else {
            resolve(false);
          }
        }

        steamClient.connect();
        steamClient.on('connected', function() {
            steamUser.logOn({
                account_name: witness_name,
                password: steam_password
            });
        });
        console.log('steamClient.loggedOn', steamClient.loggedOn);
        const onSteamError = function onSteamError() {
            console.log('Steam error');
            resolve(false);
        };
        if(steamClient.loggedOn == undefined) {
          steamClient.on('logOnResponse', onSteamLogOn);
        } else {
            resolve(false);
        }
        steamClient.on('error', onSteamError);
      } catch(e) {
        console.log('steam error '+e);
        resolve(false);
      }
    });
};

const createHost = async(challengeAddr, hostName, user1, user2, witness_name, steam_password, accountAddress, pk) => {
    try {
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const user1SteamId = await getsteamID64(user1);
        const user2SteamId = await getsteamID64(user2);
        const addressNonce = await getNonce(accountAddress);
        const hostTxHash = await sendData('Challenge', challengeAddr, 'host', [hostName], value, gasLimit, gasPrice, pk, addressNonce);
        //const hostTxHash = await sendData('Challenge', challengeAddr, 'host', [hostName], value, pk, addressNonce);
        console.log(hostTxHash);
        const match_id = await createLobby(witness_name, steam_password, user1SteamId.toString(), user2SteamId.toString(), user1, user2);
        console.log('------------match_id-------------------', match_id);
        if(match_id) {
          console.log('setWitnessJuryKeyTxHash called', match_id.toString());
          const setWitnessJuryKeyTxHash = await setWitnessJuryKey(challengeAddr, match_id.toString(), accountAddress, pk);
        }

        return match_id;
    } catch (err) {
        console.log(err);
    }
};


/**
 * @method - getsteamID64
 * @param - userName
 * @desc - For validate player & witness name in steam community
 */
function getsteamID64(userName) {
    return new Promise((resolve, reject) => {
        client.get("https://steamcommunity.com/id/" + userName + "/?xml=1", function(data, response) {
            if (data.profile == undefined) {
                resolve(false);
            } else {
                resolve(data.profile.steamID64);
            }
        });
    });
}


const setWitnessJuryKey = async(challengeAddr, match_id, accountAddress, pk) => {
    try {
      console.log('challengeAddr',challengeAddr);
      console.log('match_id',match_id);
      console.log('accountAddress',accountAddress);
      const value = 0;
      const gasLimit = 400000;
      const gasPrice = "10000000000";
      const addressNonce = await getNonce(accountAddress);
      //const setTxHash = await sendData('Challenge', challengeAddr, 'setWitnessJuryKey', [match_id], value, pk, addressNonce);
      const setTxHash = await sendData('Challenge', challengeAddr, 'setWitnessJuryKey', [match_id], value, gasLimit, gasPrice, pk, addressNonce);
      console.log('setWitnessJuryKey', setTxHash);
      return setTxHash;
    } catch (err) {
      console.log(err);
    }
};

function generateRawTransaction(pkIn, nonceIn, to, data, valueIn, gasLimitIn, gasPriceIn) {
    const value = web3.toHex(web3.toWei(valueIn, 'Ether'));
    const gasLimit = web3.toHex(gasLimitIn);
    const gasPrice = web3.toHex(gasPriceIn);
    const nonce = web3.toHex(nonceIn);
    const privateKey = new Buffer(pkIn, 'hex');
    const rawTx = {
      nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
    };
    const tx = new Tx(rawTx);
    tx.sign(privateKey);
    const serializedTx = `0x${tx.serialize().toString('hex')}`;
    return serializedTx;
}

function sendData(contractType, contractAddr, fn, args, value, gasLimit, gasPrice, pk, nonce){
  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice(async function(error, result) {
      if (!error) {
        gasPrice = result.toNumber();
        const abi = JSON.parse(CompiledContracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(contractAddr);
        const data = `${contract[fn].getData.apply(null, args)}`;

        /*var result1 = await web3.eth.estimateGas({
          to: contractAddr,
          data: data
        });
        gasLimit = parseInt(result1*30/100) + result1;
        console.log('gasPrice', gasPrice);
        console.log('gasLimit', gasLimit);*/
        const rawTx = generateRawTransaction(pk, nonce, contractAddr, data, value, gasLimit, gasPrice);
        web3.eth.sendRawTransaction(rawTx, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      } else {
          reject(error);
      }
    });
  });
}

function getTransactionReceipt(transactionHash){
  return new Promise((resolve, reject) => {
    var txInterval = setInterval(function(){
      web3.eth.getTransactionReceipt(transactionHash, (err, result) => {
        if(err) reject(err);
        if(result){
          clearInterval(txInterval);
          resolve(result);
        }
      });
    }, 1000);
  });
}

function toWei(amount) {
    return web3.toWei(amount, 'ether');
}

function fromWei(amount) {
    return web3.fromWei(amount);
}

function callBigNumber(contractType, contractAddr, fn, args){
    return new Promise((resolve, reject) => {
      const abi = JSON.parse(CompiledContracts[contractType].interface);
      const contract = web3.eth.contract(abi).at(contractAddr);
      const data = `${contract[fn].getData.apply(null, args)}`;
      const to = contractAddr;
      web3.eth.call({ to, data }, (err, result) => {
        if (err) reject(err);
        resolve(new BigNumber(result));
      });
    });
}

function getNonce(address){
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionCount(address, (err, nonce) => {
        if (err) reject(err);
        resolve(nonce);
      });
    });
}


function createLobby(account_name, account_password, user1SteamId, user2SteamId, user1Name, user2Name){
  return new Promise((resolve, reject) => {
  const steamClient = new steam.SteamClient();
  const steamUser = new steam.SteamUser(steamClient);
  const Dota2 = new dota2.Dota2Client(steamClient, true);
    var memberTeam = [];
      memberTeam[user1SteamId] = 0;
      memberTeam[user2SteamId] = 1;

    var reinviteUser;
    var lobbyName = 'FIRSTBLOODTEST';
    const lobbyPassword = 'password';
    var gameMode = 21; // All pick
    var serverRegion = 0;
    var isStarted = false;
    var matchId = '';
    var properties = {
                game_name: lobbyName,
                server_region: serverRegion,
                game_mode: gameMode,
                series_type: 0,
                game_version: 1,
                allow_cheats: false,
                fill_with_bots: false,
                allow_spectating: true,
                pass_key: lobbyPassword,
                radiant_series_wins: 0,
                dire_series_wins: 0,
                allchat: false,
                leagueid: 5520,
                pause_setting: 1,
                dota_tv_delay: 2
            };

    var onSteamLogOn = function onSteamLogOn(logonResp) {
      if(logonResp.eresult == steam.EResult.OK) {
        Dota2.launch(logonResp)
        Dota2.on('ready', function() {

          if(!isStarted) {
            isStarted = true;
            setTimeout(() => {
              Dota2.leavePracticeLobby(function(err, body) {
                  Dota2.createPracticeLobby(properties, function(err, data) {
                      console.log("lobby created---------", (data))
                      Dota2.joinPracticeLobby(lobbyName, lobbyPassword, function(err1, lobydata) {
                        Dota2.inviteToLobby(user1SteamId);
                        Dota2.inviteToLobby(user2SteamId);
                       })
                  })
              });
            }, 5000);

            setTimeout(()=>{
              Dota2.abandonCurrentGame(function () {});
              Dota2.exit();
              if(matchId) {
                resolve(matchId)
              } else {
                resolve('');
              }
            }, 60 * 1000);

            var checkTeamInterval;
            var isChatJoin = false;
            var canLunch = true;
            Dota2.on('practiceLobbyUpdate', function(lobby) {
              if(lobby) {
                clearTimeout(checkTeamInterval);
                checkTeamInterval = setTimeout(()=>{
                  const joinRightTeam = [];

                  lobby.members.forEach(function (member) {
                      var memberId = member.id.toString();
                      if (member.team === memberTeam[memberId]) {
                          joinRightTeam.push(memberId);
                      } else {
                          Dota2.practiceLobbyKickFromTeam(Dota2.ToAccountID(memberId));
                      }
                  });

                  setInterval(()=>{
                    if(joinRightTeam.length == 2 && canLunch) {
                      canLunch = false;
                      Dota2.launchPracticeLobby(function(err, body) {
                      console.log("in err------------launchPracticeLobby--------------------", err)
                      console.log("in body-----------launchPracticeLobby---------------------", body)
                      })
                    }
                  },100);

                },100);

              }

              if(lobby) {
                Dota2.joinChat("Lobby_"+lobby.lobby_id , 3);
                setTimeout(()=>{
                  Dota2.sendMessage(user1Name+ ': Join Radiant', "Lobby_"+lobby.lobby_id, 3);
                  Dota2.sendMessage(user2Name+ ': Join Dire', "Lobby_"+lobby.lobby_id, 3);
                  setTimeout(()=>{
                  isChatJoin = true
                    Dota2.practiceLobbyKickFromTeam(Dota2.ToAccountID(lobby.members[0].id.toString()));
                  },200);

                },1000);

              }
              Dota2.on('chatJoin', function(channel, joinerName, joinerSteamId) {
                console.log('-------------channel', channel);
                console.log('-------------joinerName', joinerName);
                console.log('-------------joinerSteamId', joinerSteamId);
              });

              if (lobby && lobby.match_id && lobby.match_id.toNumber()) {
                matchId = lobby.match_id.toNumber();
                console.log('lobby.match_id', lobby.match_id.toNumber());
                Dota2.abandonCurrentGame(function () {});
                Dota2.exit();
                resolve(lobby.match_id.toNumber());

              }
            });
          }
        })

      } else {
        resolve('')
      }
    }

    steamClient.connect();
    steamClient.on('connected', function() {
        steamUser.logOn({
            account_name: account_name,
            password: account_password
        });
    });

    const onSteamError = function onSteamError() {
        console.log('Steam error');
    };

    steamClient.on('logOnResponse', onSteamLogOn);
    steamClient.on('error', onSteamError);

  });
}

router.post('/deposit_amount', function(req, res, next) {
  if(req.body.amount && req.body.pk){
    const amount = req.body.amount;
    const ethereumPrivateKey = req.body.pk;
    var accountAddress = ethUtil.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString("hex");
    accountAddress = '0x'+accountAddress;

    Promise.resolve(transactionApprove(amount, ethereumPrivateKey, accountAddress)).then(function(result) {
      Promise.resolve(transactionAmount(amount, ethereumPrivateKey, accountAddress, 'deposit')).then(function(result) {
        responseHandler.send(req, res, 'success', 200, result, null);
      }).catch(function(e) {
        console.log('transactionAmount : error ->', e);
        responseHandler.send(req, res, 'error', 500, null, e);
      });

    }).catch(function(e) {
      console.log('transactionApprove : error ->', e);
      responseHandler.send(req, res, 'error', 500, null, e);
    });
  }else{
    responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.");
  }
});

router.post('/withdraw_amount', function(req, res, next) {
  const amount = req.body.amount;
  const ethereumPrivateKey = req.body.pk;
  var accountAddress = ethUtil.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString("hex");
  accountAddress = '0x'+accountAddress;
  Promise.resolve(transactionAmount(amount, ethereumPrivateKey, accountAddress, 'withdraw')).then(function(result) {
    responseHandler.send(req, res, 'success', 200, result, null);
  }).catch(function(e) {
    console.log('transactionAmount : error ->', e);
    responseHandler.send(req, res, 'error', 500, null, e);
  });

});

const transactionApprove = async(amount, ethereumPrivateKey, accountAddress ) => {
  return new Promise(async (resolve, reject) => {
    try {
        const contractType = contracts['WitnessJury'].type;
        const contractAddr = contracts['WitnessJury'].address;
        amount = toWei(amount);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const pk = ethereumPrivateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(accountAddress);
        //const txHash1 = await sendData(contracts['1ST'].type, contracts['1ST'].address, 'approve', [contractAddr, amount], value, pk, addressNonce);
        const txHash1 = await sendData(contracts['1ST'].type, contracts['1ST'].address, 'approve', [contractAddr, amount], value, gasLimit, gasPrice, pk, addressNonce);

        const approveReciept = await getTransactionReceipt(txHash1);
        resolve(approveReciept);
    } catch (err) {
        reject(err);
        console.log(err);
    }
  });
};

function getTransactionReceipt(transactionHash){
  return new Promise((resolve, reject) => {
    var txInterval = setInterval(function(){
      web3.eth.getTransactionReceipt(transactionHash, (err, result) => {
        if(err) reject(err);
        if(result){
          clearInterval(txInterval);
          resolve(result);
        }
      });
    }, 1000);
  });
}


const transactionAmount = async (amount, ethereumPrivateKey, accountAddress , method) => {
  return new Promise(async (resolve, reject) => {
    amount = toWei(amount);
    const contractType = contracts['WitnessJury'].type;
    const contractAddr = contracts['WitnessJury'].address;
    const abi = JSON.parse(CompiledContracts[contractType].interface);
    const contract = web3.eth.contract(abi).at(contractAddr);
    try {
      const value = 0;
      const gasLimit = 7500000;
      const gasPrice = "4500000000";
      const pk = ethereumPrivateKey;
      const addressNonce = await getNonce(accountAddress);
      //const txHash = await sendData(contractType, contractAddr, method, [amount], value, pk, addressNonce);
      const txHash = await sendData(contractType, contractAddr, method, [amount], value, gasLimit, gasPrice, pk, addressNonce);
      const transactionReceipt = await getTransactionReceipt(txHash);
      resolve(transactionReceipt);
    } catch (err) {
      console.log(err);
      reject(err);

    }
  });
};
/** for voteJury **/
router.post('/vote_jury', function(req, res, next) {
    const challengeAddr = contracts['WitnessJury'].address;
    const pk = req.body.pk;
    const requestNumber = parseInt(req.body.requestNumber);
    const juryResult = req.body.juryResult;

    var accountAddress = ethUtil.privateToAddress(Buffer.from(pk, 'hex')).toString("hex");
    accountAddress = '0x' + accountAddress;
    console.log('requestNumber', typeof requestNumber);
    Promise.resolve(voteJury(challengeAddr, requestNumber, juryResult, accountAddress, pk)).then(function(result){
      responseHandler.send(req, res, 'success', 200, result, null);
    }).catch(function(e) {
      console.log('voteJury : error ->', e);
      responseHandler.send(req, res, 'error', 500, null, e);
    });
});

const voteJury = async(challengeAddr,  requestNumber, juryResult, accountAddress, pk) => {
    try {
      console.log('requestNumber', requestNumber, typeof requestNumber, 'juryResult' , juryResult, typeof juryResult);
      const value = 0;
      const gasLimit = 400000;
      const gasPrice = "10000000000";
      const addressNonce = await getNonce(accountAddress);
      //const setTxHash = await sendData('WitnessJury', challengeAddr, 'juryVote', [requestNumber, juryResult], value, pk, addressNonce);
      const setTxHash = await sendData('WitnessJury', challengeAddr, 'juryVote', [requestNumber, juryResult], value, gasLimit, gasPrice, pk, addressNonce);
      console.log('jury voted', setTxHash);
      return setTxHash;
    } catch (err) {
      console.log(err);
    }
};

module.exports = router;
