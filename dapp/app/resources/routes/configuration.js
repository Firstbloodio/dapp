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
