const express = require('express');
const router = express.Router();
const https = require("https");
const parseString = require('xml2js').parseString;
const fs = require('fs');
const Steam = require('steam');
const ethUtil = require('ethereumjs-util');
const async = require('async');
const Tx = require('ethereumjs-tx');
const { oneOf, check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const responseHandler = require('../library/responseHandler');
const Client = require('node-rest-client').Client;
const client = new Client();
const contractssss = require('../assets/files/compiled.json').contracts;
const sqlite3 = require('sqlite3').verbose();
var db = "";
var isWin = process.platform === "win32";

if(isWin){
    db = new sqlite3.Database('firstblood.db');
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}
const constant = require('./constant.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));

var witnessData;

/**
 * @api - /
 * @method - GET
 * @desc - For render configuration page default
 */
router.get('/', function(req, res, next) {
    res.send("FirstBlood app running...");
});

/**
 * @api - /
 * @method - GET
 * @desc - For render configuration page default
 */
router.get('/checkConfig', function(req, res, next) {
    db.all("SELECT * from configuration LIMIT 1", function(err, rows) {
        if(err){
            responseHandler.send(req, res, 'error', 500, null, err)
        }else{
            responseHandler.send(req, res, 'success', 200, rows, null)
        }
    });
});


router.get('/respond', function(req, res, next) {
    Promise.resolve(respond()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });

});


const respond = async() => {
    try {
        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            },
            "Challenge": {
                "type": 'Challenge',
                "address": '0xe9E68FEe4D78c180f90C54cc6DE4773Bd5464681'
            }
        };
        const amountToFund = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(contracts['Challenge'].type, contracts['Challenge'].address, 'respond', ["0x2A10018Aa6B50f2bBDf65c2e953f155A68896F83", 'appy_neo'], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);
        return txHash1;
    } catch (err) {
        console.log(err);
    }
};


router.get('/approve2', function(req, res, next) {
    Promise.resolve(approve2()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });
});




const approve2 = async() => {
    try {
        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            },
            "Challenge": {
                "type": 'Challenge',
                "address": '0xe9E68FEe4D78c180f90C54cc6DE4773Bd5464681'
            }
        };
        const amountToFund = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(
            contracts['1ST'].type, contracts['1ST'].address, 'approve', ["0x2A10018Aa6B50f2bBDf65c2e953f155A68896F83", amountToFund], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);
        return txHash1;
    } catch (err) {
        console.log(err);
    }
};

router.get('/fund', function(req, res, next) {
    Promise.resolve(fund()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });
});

const fund = async() => {
    try {
        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            },
            "Challenge": {
                "type": 'Challenge',
                "address": '0x180c5e32880362ab1420b6b32bd9602c41bdba05'
            }
        };
        const amountToFund = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "40000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(
            contracts['Challenge'].type, contracts['Challenge'].address, 'fund', [], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);
        return txHash1;
    } catch (err) {
        console.log(err);
    }
};

router.get('/approve_challenge', function(req, res, next) {
    Promise.resolve(approveChallnge()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });
});



const approveChallnge = async() => {
    try {
        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            }
        };
        const amountToFund = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "40000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(
            contracts['1ST'].type, contracts['1ST'].address, 'approve', ["0xe9E68FEe4D78c180f90C54cc6DE4773Bd5464681", amountToFund], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);
        return txHash1;
        fund();
    } catch (err) {
        console.log(err);
    }
};



router.get('/create_challenge', function(req, res, next) {
    Promise.resolve(deployChallnge()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });
});
const deployChallnge = async() => {
    try {
        var account = "0xb91b6ecd8d1f21b3553da809eb446cde0de06aa4";
        var username = "test";

        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            }
        };
        const amountToFund = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "40000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(
            contracts['ChallengeFactory'].type, contracts['ChallengeFactory'].address, 'newChallenge', [amountToFund, account, username, referrer], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);

        getTransactionDetails(txHash1);
        return txHash1;
    } catch (err) {
        console.log(err);
    }
};


router.get('/createtoken', function(req, res, next) {
    Promise.resolve(createtoken()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });

});




const createtoken = async() => {
    try {
        const selectedAccount = {
            "address": '0xb91B6Ecd8D1F21b3553DA809eB446cde0de06aA4',
            "privateKey": '58bd152483f7c8aef652ebe83b8582ad6cf47004c552b202f1d7f4d7c49bd344'
        };
        const contracts = {
            "1ST": {
                "type": 'StandardToken',
                "address": '0xe49c32368d1045f0dc1e4fd527d66762b64328f3'
            },
            "WitnessJury": {
                "type": 'WitnessJury',
                "address": '0x66534c223df067f4a029cf880157b0df0954f660'
            },
            "ChallengeFactory": {
                "type": 'ChallengeFactory',
                "address": '0x20f5c4e09fda42f2242fc9126a099d02c7dd9825'
            },
            "Challenge": {
                "type": 'Challenge',
                "address": '0xa5F8548c63FE827b9bb78F7F3139FdbC947B35Ef'
            }
        };
        const amountToCreate = toWei(1);
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const pk = selectedAccount.privateKey;
        const referrer = '0x0';
        const addressNonce = await getNonce(selectedAccount.address);
        const txHash1 = await sendData(
            'ReserveToken', contracts['1ST'].address, 'create', [selectedAccount.address, amountToCreate], value, gasLimit, gasPrice, pk, addressNonce);
        console.log(txHash1);
        return txHash1;
    } catch (err) {
        console.log(err);
    }
};

router.get('/report', function(req, res, next) {
    Promise.resolve(report()).then(function(result) {
        res.send("ok")
    }).catch(function(e) {
        console.log('storeNetworkLogs : error ->', e);
        return false;
    });
});

const report = async() => {
    try {

        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";

        const pk =  "510F8855A244D218987A0A6ABBE3BB431D8257CEC8E36A2905F29EF3C5E905E3";
        const witnessAccountAddress = ethUtil.privateToAddress(Buffer.from(pk, 'hex')).toString("hex");

        const addressNonce = await getNonce('0x'+witnessAccountAddress);
        const match_data = {"match_id":"4062775817","start_time":1534422884,"duration":65,"game_mode":"DOTA_GAMEMODE_1V1MID","players":[{"account_id":0,"hero_id":84,"kills":2,"deaths":0,"assists":0,"items":[12,0,40,0,0,46],"player_slot":0},{"account_id":0,"hero_id":42,"kills":0,"deaths":2,"assists":0,"items":[0,0,0,0,0,46],"player_slot":128}],"match_outcome":"k_EMatchOutcome_RadVictory"};
        const txHash1 = await sendData(
            'WitnessJury', "0xfba5cedcd1eedf88d9bcbe8740e03f9e063328c4", 'report', [8, JSON.stringify(match_data), 1 ], value, gasLimit, gasPrice, pk, addressNonce);


        console.log(txHash1);
        return txHash1;
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

function sendData(contractType, contractAddr, fn, args, value, gasLimit, gasPrice, pk, nonce) {
    return new Promise((resolve, reject) => {
        web3.eth.getGasPrice(async function(error, result) {
          if (!error) {
            gasPrice = result.toNumber();
            const abi = JSON.parse(contractssss[contractType].interface);
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

function getTransactionDetails(transactionHash) {
    web3.eth.getTransactionReceipt("0xf68de4db3d90c6df2d0abb672c4636d0a45eed765a279d519ea61d22f10c67fb", (err, result) => {
        console.log(err);
        console.log(result);
    });
}

function toWei(amount) {
    return web3.toWei(amount, 'ether');
}

function fromWei(amount) {
    return web3.fromWei(amount);
}

function getNonce(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getTransactionCount(address, (err, nonce) => {
            if (err) reject(err);
            console.log("nonce", nonce);
            resolve(nonce);
        });
    });
}

/**
 * @api - /login
 * @method - POST
 * @desc - Login in application with the help of valid details
 */
router.post('/login', [
    check('playerName')
    .trim()
    .custom((value, { req, location, path }) => {
        if (value) {
            return new Promise((resolve, reject) => {
                validateName(value, req, 'player').then(result => {
                    if (!result) {
                        reject("There's no such player username available.");
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(true);
                });
            });
        } else {
            return true;
        }
    }),
    check('referrerEthereumAddress')
    .trim()
    .custom(value => {
        if (value) {
            return new Promise((resolve, reject) => {
                validateAddress(value).then(result => {
                    if (!result) {
                        reject("Referrer Ethereum Address is invalid.");
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(true);
                });
            });
        } else {
            return true;
        }
    }),
    check('ethereumPrivateKey')
    .trim()
    .custom(value => {
        if (value) {
            return new Promise((resolve, reject) => {
                validateKey(value).then(result => {
                    if (!result) {
                        reject('Ethereum Private Key is invalid.');
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(true);
                });
            });
        } else {
            return true;
        }
    }),
    check('steamId')
    .trim()
    .custom((value, { req, location, path }) => {
        if (value) {
            return new Promise((resolve, reject) => {
                validateName(value, req, 'witness').then(result => {
                    if (!result) {
                        reject("There's no such witness username available.");
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(true);
                });
            });
        } else {
            return true;
        }
    }),
    check('witnessName')
    .trim()
    .custom((value, { req, location, path }) => {
        if (value) {
            return new Promise((resolve, reject) => {
                validateWitness(value, req.body.steamPassword).then(result => {
                    if (result != 1) {
                        reject("There's no Steam User associated with the provided detail.");
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(true);
                });
            });
        } else {
            return true;
        }
    })
], (req, res, next) => {
    const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
        return `${msg}`;
    };
    const result = validationResult(req).formatWith(errorFormatter);
    var obj = {};
    if (!result.isEmpty()) {
        obj.error = result.array();
        obj.message = 'error';
        console.log('error');
        res.send(obj);
    } else {
        obj.message = 'success';
        obj.result = {};
        if (req.session.playerInfo)
            obj.result['playerInfo'] = req.session.playerInfo;

        if (req.session.witnessInfo)
            obj.result['witnessInfo'] = req.session.witnessInfo;

        Promise.resolve(storeLoginDetails(req)).then(function(result) {
            res.send(obj);
        }).catch(function(e) {
            console.log('error ->', e);
        });
    }
});

/**
 * @method - validateAddress
 * @param - address : string
 * @desc - For validate ethereum address
 */
function validateAddress(address) {
    return new Promise((resolve, reject) => {
        if (ethUtil.isValidAddress(address)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

/**
 * @method - validateKey
 * @param - key : buffer
 * @desc - For validate ethereum private key
 */
function validateKey(privateKey) {
    return new Promise((resolve, reject) => {
        if (ethUtil.isValidPrivate(Buffer.from(privateKey, 'hex'))) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

/**
 * @method - validateName
 * @param - userName
 * @desc - For validate player & witness name in steam community
 */
function validateName(userName, req, type) {
    return new Promise((resolve, reject) => {
        client.get("https://steamcommunity.com/id/" + userName + "/?xml=1", function(data, response) {
            if (data.profile == undefined) {
                resolve(false);
            } else {
                if (type == 'player') {
                    req.session.playerInfo = data.profile;
                } else if (type == 'witness') {
                    req.session.witnessInfo = data.profile;
                    witnessData = data;
                }
                resolve(data.profile);
            }
        });
    });
}

/**
 * @method - validateWitness
 * @param - steamId, steamPassword
 * @desc - For validate witness account based on account name & password
 */
function validateWitness(witnessName, steamPassword) {
    return new Promise((resolve, reject) => {
        var steamClient = new Steam.SteamClient();
        var steamUser = new Steam.SteamUser(steamClient);
        steamClient.connect();
        steamClient.on('connected', function() {
            steamUser.logOn({
                account_name: witnessName,
                password: steamPassword
            });
        });
        steamClient.on('logOnResponse', function(log) {
            if(witnessData && log.client_supplied_steamid == witnessData.profile.steamID64){
              resolve(log.eresult);
            }else{
                resolve(false);
            }
        });

        steamClient.on('error', function onSteamError() {
            resolve(false);
        });

        steamClient.on('servers', function(servers) {
            console.log("servers", servers)
        });

    });
}

/**
 * @method - storeLoginDetails
 * @param - data (login details)
 * @desc - For storing login details in database
 */

function storeLoginDetails(data) {
    return new Promise((resolve, reject) => {
        db.serialize(function() {
            db.run("DELETE FROM configuration");
            const columnName = "playerName, disclaimerAgreed, referrerEthereumAddress, ethereumPrivateKey, steamId, witnessName, steamPassword";
            const columnValues = "'" + data.body.playerName + "' , 1, '" + data.body.referrerEthereumAddress + "', '" + data.body.ethereumPrivateKey + "', '" + data.body.steamId + "', '" + data.body.witnessName + "', '" + data.body.steamPassword + "' ";
            db.run("INSERT INTO configuration (" + columnName + ") VALUES (" + columnValues + ")");

            db.all("select * from leaderboard where player='" + data.body.playerName + "'", function(err, result) {
                    if(err) {
                        log.error(err);
                    }
                    var query = "";
                    if ((result.length == 0 && !data.body.witnessName) || (result.length == 0 && data.body.witnessName && data.body.playerName) ) {
                     query = "INSERT into leaderboard(player, wins, losses, mmr, winStreak, winRate, totalChallenges,reputation) VALUES (" + "'" + data.body.playerName + "',0, 0, 1200, 0, 0, 0, 0)";
                        db.run(query);
                    }
                });
        });
        resolve(true)
    });
}

router.get('/logout', function(req, res, next) {
    const tables = ['configuration', 'cron_logs']
    Promise.resolve(deleteAllRecords(tables)).then(function(result){
        responseHandler.send(req, res, 'success', 200, result, null);
    }).catch(function(e){
        responseHandler.send(req, res, 'error', 500, null, e);
    })
});

function deleteAllRecords(tables){
    return new Promise((resolve, reject) => {
        async.each(tables, function(tableName, cb){
            db.run('DELETE FROM ' +tableName);
            cb();
        }, function(err){
            console.log(err);
            if(err) reject(err);
            resolve(true);
        })
    });
}

module.exports = router;
