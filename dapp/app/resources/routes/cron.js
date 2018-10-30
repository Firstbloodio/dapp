const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const path = require("path");
const SolidityEvent = require('web3/lib/web3/event')
const sha3 = require('web3/lib/utils/sha3');
const async = require('async');
const _ = require('underscore');
const Steam = require('steam');
const dota2 = require('dota2');
const constant = require('./constant.js');
const steamClient = new Steam.SteamClient();
const steamUser = new Steam.SteamUser(steamClient);
const Dota2 = new dota2.Dota2Client(steamClient, true);
const ethUtil = require('ethereumjs-util');
const responseHandler = require('../library/responseHandler');
const contracts = require('../assets/files/compiled.json').contracts;
const Tx = require('ethereumjs-tx');
const notifier = require('node-notifier');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
var db = "";
var isWin = process.platform === "win32";

try {
  Steam.servers = JSON.parse(fs.readFileSync(`${process.cwd()}/servers.json`));
} catch (err) {
  console.log(`Error reading servers.json: ${err}`);
}

if(isWin){
    db = new sqlite3.Database('firstblood.db');
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}
const Client = require('node-rest-client').Client;
const client = new Client();
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));
const LogHandler = require('../library/log');

// enable/disable logs
const logger = LogHandler.getLogger(false, 'cron');

function log(level, message) {
    LogHandler.setLogs(logger, level, message);
}


const cron_status_interval = 3 * 60 * 1000;
const network_log_interval = 2 * 60 * 1000;

setTimeout(() => {
    cronRun();
}, 1000);

setInterval(function() {
    cronRun();
}, network_log_interval);

async function cronRun() {
    log("info", "Cron execution start !!!");
    await Promise.all([storeChallengeFactoryLogs(), storeWitnessJuryLog(), storeChallengeLogs(), storeLeaderboardData()]);
    log("info", "Cron successfully executed !!!");
}

/**
 * @method - checkConfigurationExists
 * @desc - Check user loggedIn or not
 */
const checkConfigurationExists = async() => {
    return new Promise((resolve, reject) => {
        try {
            db.all('SELECT * from configuration limit 1', function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    })
}


const checkCronExists = async(type) => {
    return new Promise((resolve, reject) => {
        try {
            db.all("SELECT * from cron_logs where type = '" + type + "'", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            });
        } catch (err) {
            log("error", err);
            reject(err);
        }
    })
}

const saveCron = async(type, action, status) => {
    return new Promise((resolve, reject) => {
        try {
            var query = "";
            const dateTime = "'" + new Date() + "'";
            type = "'" + type + "'";
            status = "'" + status + "'";
            if (action == "insert") {
                query = "INSERT INTO cron_logs( type, dateTime, status) VALUES (" + type + ", " + dateTime + ", " + status + ")";
            } else if (action == "delete") {
                query = "DELETE from cron_logs WHERE type = " + type;
            }
            db.run(query);
            resolve(true);
        } catch (err) {
            log("error", err);
            reject(err);
        }
    })
}

/**
 * @method - cronsUpdate
 * @desc - In every given time interval call cronsUpdate function and delete cron if running from given time
 */

setTimeout(() => {
    db.run("delete from cron_logs");
}, 3000);

setInterval(function() {
    cronsUpdate();
}, cron_status_interval);

async function cronsUpdate() {
    log("info", "Cron update start !!!");
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0) {
        const cronsName = await getExpireCrons();
        log("info", "Cron Names" + JSON.stringify(cronsName));
        if (cronsName && cronsName != undefined && cronsName.length > 0) {
            await Promise.all(cronsName.map(name => saveCron(name, 'delete', 'done')));
        }
        log("info", "Cron update end !!!");
    } else {
        console.log("Configuration not exists 1 !!!");
        return false;
    }
}

/**
 * @method - getExpireCrons
 * @desc - Get running crons name
 */
async function getExpireCrons() {
    log("info", "get expire crons !!!");
    return new Promise((resolve, reject) => {
        db.all("select * from cron_logs", (err, rows) => {
            if (err) {
                log("error", err);
                reject(err);
            }
            var cronsName = [];
            if (rows != undefined && rows.length > 0) {
                _.each(rows, (value) => {

                    var dbTime = new Date(value['dateTime']);
                    dbTime.setMinutes(dbTime.getMinutes() + 2);
                    var dbTime = dbTime.getMinutes();
                    var currntTime = new Date().getMinutes();
                    if (dbTime <= currntTime) {
                        cronsName.push(value['type']);
                    }
                });
                resolve(cronsName);
            } else {
                resolve(cronsName);
            }
        });
    });
}

/**
 * @method - storeChallengeFactoryLogs
 * @desc - In every given time interval call storeChallengeFactoryLogs function and store new network log details   for challenge factory contracts
 */
async function storeChallengeFactoryLogs() {
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0) {
        log("info", "Start fetching challenge factory logs !!!");
        const cronData = await checkCronExists('Challenge Factory');
        if (cronData != undefined && cronData.length > 0) {
            log("info", "Challenge Factory script already running !!!");
            console.log("Challenge Factory script already running !!!");
            return false;
        } else {
            await saveCron('Challenge Factory', 'insert', 'running');

            const blocksPerGroup = 100;
            const contractType = "ChallengeFactory";
            const contractAddress = constant.challengeFactoryAddr;

            const lastBlockNumber = await getLastBlockNumber('Challenge Factory');
            var endBlockNumber = await getCurrentBlockNumber();
            var startBlockNumber = 0;

            if (lastBlockNumber && lastBlockNumber.length > 0) {
                startBlockNumber = parseInt(lastBlockNumber[0]['lastBlockNumber']) + 1;

                if (endBlockNumber > (startBlockNumber + 5000)) {
                    endBlockNumber = (startBlockNumber + 5000);
                }
            } else {
                startBlockNumber = endBlockNumber - 5000;
            }

            const eventsData = await loadEvents(contractType, contractAddress, startBlockNumber, endBlockNumber, blocksPerGroup);

            if (eventsData != undefined && eventsData.length > 0) {
                const saveData = await saveChallengeFactoryLogs(eventsData)
            }
            await saveLastBlockNumber('Challenge Factory', endBlockNumber);
            await saveCron('Challenge Factory', 'delete', 'done');

            console.log("storeChallengeFactoryLogs done !!!");
            log("info", "Challenge Factory script successfully done !!!");
        }
        return true;
    } else {
        return false;
    }
}

/**
 * @method - getLastFactoryBlockNumber
 * @desc - Get challenge factory last block number
 */
const getLastFactoryBlockNumber = async() => {
    return new Promise((resolve, reject) => {
        try {
            db.all('SELECT blockNumber from challenge_factory_logs order by blockNumber desc limit 1', function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    });
};

/**
 * @method - getCurrentBlockNumber
 * @desc - Get current latest block number from web3
 */
const getCurrentBlockNumber = async() => {
    return new Promise((resolve, reject) => {
        try {
            web3.eth.getBlockNumber(function(err, result) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(result);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    })
};

/**
 * @method - saveChallengeFactoryLogs
 * @desc - Save challenge factory logs in local DB
 */
async function saveChallengeFactoryLogs(eventsData) {
    try {
        var query = "";
        for (var i = 0; i < eventsData.length; i++) {
            const timestamp = "'" + eventsData[i]['timestamp'] + "',";
            const blockNumber = eventsData[i]['blockNumber'] + ",";
            const transactionHash = "'" + eventsData[i]['transactionHash'] + "',";
            const fromAddress = "'" + eventsData[i]['from'] + "',";
            const toAddress = "'" + eventsData[i]['to'] + "',";
            const transactionIndex = eventsData[i]['transactionIndex'] + ",";
            const logIndex = eventsData[i]['logIndex'] + ",";
            const eventType = "'" + eventsData[i]['event'] + "',";

            const args = JSON.parse(eventsData[i]['arguments']);

            const address = "'" + args['addr'] + "',";
            const arguments = "'" + eventsData[i]['arguments'] + "', ";
            const challengeCurrentBlockNumber = eventsData[i]['blockNumber'] + ", ";
            const resolved = 0;

            query += "(" + timestamp + blockNumber + transactionHash + fromAddress + toAddress + transactionIndex + logIndex + eventType + address + arguments + challengeCurrentBlockNumber + resolved + "), ";
        }

        query = query.replace(/,\s*$/, "");

        db.run("INSERT into challenge_factory_logs(timestamp, blockNumber, transactionHash, fromAddress, toAddress, transactionIndex, logIndex, event, address, arguments, challengeCurrentBlockNumber, resolved) VALUES " + query);

        return true;
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

/**
 * @method - storeChallengeLogs
 * @desc - In every given time interval call storeChallengeLogs function and store new network log details for challenge contracts
 */
async function storeChallengeLogs() {
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0) {
        log("info", "Start fetching challenge logs !!!");
        const cronData = await checkCronExists('Challenge');

        if (cronData != undefined && cronData.length > 0) {
            log("info", "Challenge script already running !!!");
            return false;
        } else {
            await saveCron('Challenge', 'insert', 'running');

            const contractType = "Challenge";
            const contract = contracts[contractType];

            const factoryData = await getChallengeFactoryLogs();

            if (factoryData != undefined && factoryData.length > 0) {
                const eventsArrays = await Promise.all(factoryData.map(log =>
                    getNetworkLog(contract, log.address, log.challengeCurrentBlockNumber, 'latest')));

                const eventsData = [].concat.apply([], eventsArrays);

                if (eventsData != undefined && eventsData.length > 0) {
                    const saveData = await saveChallengeLogs(eventsData); // Save challenge logs data

                    log("info", "saveChallengeLogs completed !!!");

                    const saveDetails = await Promise.all(eventsArrays.map(events => {
                        if (events.length > 0) {
                            return saveChallengeDetails(events, events[0]['address'])
                        } else {
                            return [{ "notificationArray": [], "resolvedEvents": [] }];
                        }
                    }));

                    log("info", "saveDetails completed !!!");

                    if (configData[0].playerName) {
                        const pluckedNotificationArray = _.pluck(saveDetails, 'notificationArray')
                        const pluckedResolveArray = _.pluck(saveDetails, 'resolvedEvents')
                        const notificationData = [].concat.apply([], pluckedNotificationArray);

                        //log("info",{"notificationData" : JSON.stringify(notificationData)});

                        if (notificationData != undefined && notificationData.length > 0) {
                            await storeNotifications(notificationData, configData[0].playerName, 'challenge');
                            console.log("Notification saved successfully !!!");
                            log("info", "Notification saved successfully !!!");
                        }

                        const resolvedArray = [].concat.apply([], pluckedResolveArray);
                        if (resolvedArray != undefined && resolvedArray.length > 0) {
                            await Promise.all(
                                resolvedArray.map(resolveData => updateUserMMR(resolveData)));
                        }
                    }
                }
            }

            await saveCron('Challenge', 'delete', 'done');

            console.log("storeChallengeLogs done !!!");

            log("info", "Challenge script successfully done !!!");
        }
    } else {
        return false;
    }
}

async function updateUserMMR(resolveData) {
    return new Promise(async(resolve, reject) => {
        if (resolveData != undefined && resolveData.address != undefined) {
            db.all("SELECT key1, key2 from challenge_details where address='" + resolveData.address + "' limit 1", async function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                } else if (rows != undefined && rows.length > 0) {
                    db.all("SELECT * from leaderboard where player IN ('" + rows[0]['key1'] + "', '" + rows[0]['key2'] + "')", async function(err, result) {
                        if (err) {
                            log("error", err);
                            reject(err);
                        } else if (result != undefined && result.length == 2) {
                            const mmrData = await calculateMMR(result[0]['mmr'], result[1]['mmr'], resolveData.winner);
                            for (prop in mmrData) {
                                if (prop == 'p1MMR') {
                                    db.run("UPDATE leaderboard SET mmr=" + mmrData[prop] + " where player = '" + rows[0]['key1'] + "'")
                                } else if (prop == 'p2MMR') {
                                    db.run("UPDATE leaderboard SET mmr=" + mmrData[prop] + " where player = '" + rows[0]['key2'] + "'")
                                }
                            }
                            setTimeout(() => {
                                resolve(true);
                            }, 1000)
                        } else {
                            resolve(true);
                        }
                    });
                } else {
                    resolve(true);
                }
            });
        } else {
            resolve(true);
        }
    })
}

/**
 * @method - calculateMMR
 * @desc - Calculate MMR value for each user
 */
const calculateMMR = async(mmr1, mmr2, winner) => {
    console.log(mmr1, mmr2, winner);
    return new Promise((resolve, reject) => {
        let mmr = { p1MMR: mmr1, p2MMR: mmr2 },
            adjustment;
        const k = 39;

        let p1WinningProbability = 1 / (1 + Math.pow(10, ((mmr.p2MMR - mmr.p1MMR) / 400)));
        let p2WinningProbability = 1 / (1 + Math.pow(10, ((mmr.p1MMR - mmr.p2MMR) / 400)));

        if (winner == "1") {
            adjustment = 39 * (1 - p1WinningProbability);
            mmr.p1MMR = mmr.p1MMR + adjustment;
            mmr.p2MMR = mmr.p2MMR - adjustment;
        } else if (winner == "2") {
            adjustment = 39 * (1 - p2WinningProbability);
            mmr.p1MMR = mmr.p1MMR - adjustment;
            mmr.p2MMR = mmr.p2MMR + adjustment;
        }
        resolve(mmr);
    }).catch((err) => {
        log("error", err);
        reject(err);
    });
}

/**
 * @method - getChallengeFactoryLogs
 * @desc - Get challenge factory all records
 */
async function getChallengeFactoryLogs() {
    return new Promise((resolve, reject) => {
        try {
            db.all("SELECT address, challengeCurrentBlockNumber from challenge_factory_logs where resolved=0", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            });
        } catch (err) {
            log("error", err);
            reject(err);
        }
    });
}

/**
 * @method - saveChallengeLogs
 * @desc - Save challenge contract logs in local DB
 */
async function saveChallengeLogs(eventsData) {
    try {
        var query = "";
        for (var i = 0; i < eventsData.length; i++) {
            const address = "'" + eventsData[i]['address'] + "',";
            const blockHash = "'" + eventsData[i]['blockHash'] + "',";
            const blockNumber = eventsData[i]['blockNumber'] + ",";
            const logIndex = eventsData[i]['logIndex'] + ",";
            const transactionHash = "'" + eventsData[i]['transactionHash'] + "',";
            const transactionIndex = eventsData[i]['transactionIndex'] + ",";
            const transactionLogIndex = "'" + eventsData[i]['transactionLogIndex'] + "',";
            const date = "'" + eventsData[i]['date'] + "',";
            const eventType = "'" + eventsData[i]['event'] + "',";
            const args = "'" + JSON.stringify(eventsData[i]['args']) + "'";

            query += "(" + address + blockHash + blockNumber + logIndex + transactionHash + transactionIndex + transactionLogIndex + date + eventType + args + "), ";
        }

        query = query.replace(/,\s*$/, "");

        db.run("INSERT into challenge_logs(address, blockHash, blockNumber, logIndex, transactionHash, transactionIndex, transactionLogIndex, date, event, args) VALUES " + query);

        return true;
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

/**
 * @method - saveChallengeDetails
 * @desc - Save challenge contract logs details in local DB
 */
async function saveChallengeDetails(eventsData, challengeAddress) {
    return new Promise((resolve, reject) => {
        try {
            db.all("SELECT * from challenge_details where address = '" + challengeAddress + "'", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }

                var notificationArray = [];
                var resolvedEvents = [];

                if (rows != undefined && rows.length == 0) {
                    var obj = { "user2": "", "key2": "", "host": "", "hostKey": "", "witnessJuryRequestNum": "", "witnessJuryKey": "", "isFunded": "no", "winner": "" };

                    async.each(eventsData, function(eventObj, cb) {
                        obj['address'] = eventObj['address'];
                        obj['event'] = eventObj['event'];
                        obj['date'] = eventObj['date'];
                        obj['lastBlockNumber'] = eventObj['blockNumber'];

                        if (eventObj['event'] == 'NewChallenge') {
                            obj['user1'] = eventObj['args']['user1'];
                            obj['key1'] = eventObj['args']['key1'];
                            obj['amount'] = eventObj['args']['amount'];
                        }

                        if (['Fund', 'Respond', 'Host', 'SetWitnessJuryKey', 'RequestJury', 'Resolve'].indexOf(eventObj['event']) > -1) {
                            obj['isFunded'] = "yes";
                        }

                        if (eventObj['event'] == 'Resolve') {
                            obj['winner'] = eventObj['args']['winner'];
                            resolvedEvents.push({ 'address': eventObj['address'], 'winner': obj['winner'] });
                        }

                        if (eventObj['event'] == 'Respond') {
                            obj['user2'] = eventObj['args']['user2'];
                            obj['key2'] = eventObj['args']['key2'];

                            notificationArray.push({ 'address': eventObj['address'], 'event': eventObj['event'], 'userName': eventObj['args']['key2'], "transactionHash": eventObj['transactionHash'] });
                        }

                        if (eventObj['event'] == 'Host') {
                            obj['host'] = eventObj['args']['host'];
                            obj['hostKey'] = eventObj['args']['hostKey'];
                        }

                        if (eventObj['event'] == 'SetWitnessJuryKey') {
                            obj['witnessJuryRequestNum'] = eventObj['args']['witnessJuryRequestNum'];
                            obj['witnessJuryKey'] = eventObj['args']['witnessJuryKey'];

                            notificationArray.push({ 'address': eventObj['address'], 'event': eventObj['event'], 'userName': obj['hostKey'], "transactionHash": eventObj['transactionHash'] });
                        }

                        cb();
                    }, function(err) {
                        if (err) {
                            log("error", err);
                            reject(err);
                        }

                        const address = "'" + obj['address'] + "', ";
                        const eventType = "'" + obj['event'] + "', ";
                        const user1 = "'" + obj['user1'] + "', ";
                        const key1 = "'" + obj['key1'].replace(/\'/g, "''") + "', ";
                        const user2 = "'" + obj['user2'] + "', ";
                        const key2 = "'" + obj['key2'].replace(/\'/g, "''") + "', ";
                        const date = "'" + obj['date'] + "', ";
                        const host = "'" + obj['host'] + "', ";
                        const hostKey = "'" + obj['hostKey'].replace(/\'/g, "''") + "', ";
                        const witnessJuryRequestNum = "'" + obj['witnessJuryRequestNum'] + "', ";
                        const witnessJuryKey = "'" + obj['witnessJuryKey'].replace(/\'/g, "''") + "', ";
                        const isFunded = "'" + obj['isFunded'] + "', ";
                        const amount = obj['amount'] + ", ";
                        const lastBlockNumber = obj['lastBlockNumber'] + ", ";
                        const winner = "'" + obj['winner'] + "'";

                        var query = "(" + address + eventType + user1 + key1 + user2 + key2 + date + host + hostKey + witnessJuryRequestNum + witnessJuryKey + isFunded + amount + lastBlockNumber + winner + ")";


                        db.run("INSERT into challenge_details(address, event, user1, key1, user2, key2, date, host, hostKey, witnessJuryRequestNum, witnessJuryKey, isFunded, amount, lastBlockNumber, winner) VALUES " + query);

                        const challengeCurrentBlockNumber = parseInt(obj['lastBlockNumber']) + 1;

                        db.run("UPDATE challenge_factory_logs SET challengeCurrentBlockNumber = " + challengeCurrentBlockNumber + " where address = '" + challengeAddress + "'");

                        resolve({ 'notificationArray': notificationArray, 'resolvedEvents': resolvedEvents });
                    });
                } else if (rows != undefined && rows.length > 0) {
                    var obj = { "user2": "", "key2": "", "host": "", "hostKey": "", "witnessJuryRequestNum": "", "witnessJuryKey": "", "isFunded": "no", "winner": "" };
                    async.each(eventsData, function(eventObj, cb) {
                        obj['address'] = eventObj['address'];
                        obj['event'] = eventObj['event'];
                        obj['date'] = eventObj['date'];
                        obj['lastBlockNumber'] = eventObj['blockNumber'];

                        if (eventObj['event'] == 'NewChallenge') {
                            obj['user1'] = eventObj['args']['user1'];
                            obj['key1'] = eventObj['args']['key1'];
                            obj['amount'] = eventObj['args']['amount'];
                        }

                        if (['Fund', 'Respond', 'Host', 'SetWitnessJuryKey', 'RequestJury', 'Resolve'].indexOf(eventObj['event']) > -1) {
                            obj['isFunded'] = "yes";
                        }

                        if (eventObj['event'] == 'Resolve') {
                            obj['winner'] = eventObj['args']['winner'];
                            resolvedEvents.push({ 'address': eventObj['address'], 'winner': obj['winner'] });
                        }

                        if (eventObj['event'] == 'Respond') {
                            obj['user2'] = eventObj['args']['user2'];
                            obj['key2'] = eventObj['args']['key2'];

                            notificationArray.push({ 'address': eventObj['address'], 'event': eventObj['event'], 'userName': eventObj['args']['key2'], "transactionHash": eventObj['transactionHash'] });
                        }

                        if (eventObj['event'] == 'Host') {
                            obj['host'] = eventObj['args']['host'];
                            obj['hostKey'] = eventObj['args']['hostKey'];
                        }

                        if (eventObj['event'] == 'SetWitnessJuryKey') {
                            obj['witnessJuryRequestNum'] = eventObj['args']['witnessJuryRequestNum'];
                            obj['witnessJuryKey'] = eventObj['args']['witnessJuryKey'];

                            notificationArray.push({ 'address': eventObj['address'], 'event': eventObj['event'], 'userName': rows[0]['hostKey'], "transactionHash": eventObj['transactionHash'] });
                        }

                        cb();
                    }, function(err) {
                        if (err) {
                            log("error", err);
                            reject(err);
                        }

                        var query = "";
                        for (prop in obj) {
                            if (obj[prop] != "undefined" && prop != "address" && obj[prop] != '') {
                                if (prop == 'lastBlockNumber' || prop == 'amount') {
                                    query += prop + "=" + obj[prop] + ",";
                                } else {
                                    query += prop + "='" + obj[prop] + "',";
                                }
                            }
                        }
                        if (query) {
                            query = query.replace(/,\s*$/, "");
                            db.run("UPDATE challenge_details SET " + query + " where address = '" + obj['address'] + "'");

                            const challengeCurrentBlockNumber = parseInt(obj['lastBlockNumber']) + 1;

                            db.run("UPDATE challenge_factory_logs SET challengeCurrentBlockNumber = " + challengeCurrentBlockNumber + " where address = '" + challengeAddress + "'");

                            resolve({ 'notificationArray': notificationArray, 'resolvedEvents': resolvedEvents });
                        }
                    });
                }
            })
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
}

/**
 * @method - storeWitnessJuryLog
 * @desc - In every given time interval call storeWitnessJuryLog function and store new network log details for witness jury contracts
 */
async function storeWitnessJuryLog() {
    console.log("Witness Jury called");
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0) {
        log("info", "Start fetching Witness Jury logs !!!");
        const cronData = await checkCronExists('Witness Jury');
        if (cronData && cronData.length > 0) {
            log("info", "Witness Jury script already running !!!");
            return false;
        } else {
            await saveCron('Witness Jury', 'insert', 'running');

            var privateKey = '',
                accountAddress = '',
                steamId = '',
                steamPassword = '';
            const blocksPerGroup = 100;
            const contractType = "WitnessJury";
            const contractAddress = constant.witnessJuryAddr;

            if (configData[0].witnessName) {
                pk = configData[0].ethereumPrivateKey;
                steamId = configData[0].steamId;
                steamPassword = configData[0].steamPassword;
                accountAddress = ethUtil.privateToAddress(Buffer.from(pk, 'hex')).toString("hex");
            }

            const lastBlockNumber = await getLastBlockNumber("Witness Jury");
            var endBlockNumber = await getCurrentBlockNumber();
            var startBlockNumber = 0;

            if (lastBlockNumber && lastBlockNumber.length > 0) {
                startBlockNumber = parseInt(lastBlockNumber[0]['lastBlockNumber']) + 1;

                if (endBlockNumber > (startBlockNumber + 5000)) {
                    endBlockNumber = (startBlockNumber + 5000);
                }
            } else {
                startBlockNumber = endBlockNumber - 5000;
            }

            const eventsData = await loadEvents(contractType, contractAddress, startBlockNumber, endBlockNumber, blocksPerGroup);
            if (eventsData != undefined && eventsData.length > 0) {
                const saveData = await saveWitnessJuryLogs(eventsData);
                if (configData[0].witnessName && configData[0].steamPassword) {
                    const setWitnessData = await setWitnessJobs(eventsData, accountAddress, configData[0].steamId,configData[0].ethereumPrivateKey);
                }
                await saveLastBlockNumber('Witness Jury', endBlockNumber);

                if (configData[0].playerName && saveData.notificationArray != undefined && saveData.notificationArray.length > 0) {
                    const notificationData = saveData.notificationArray;
                    await storeNotifications(notificationData, configData[0].playerName, 'witness');
                    console.log("Notification saved successfully !!!");

                    log("info", "Notification saved successfully !!!");
                }

                if (saveData.resolvedEvents != undefined && saveData.resolvedEvents.length > 0) {
                    const resolvedData = await Promise.all(saveData.resolvedEvents.map(num => updateResolveStatus(num)));
                }

                if (configData[0].witnessName && saveData.juryEvents != undefined && saveData.juryEvents.length > 0) {
                    const progressJobData = await Promise.all(saveData.juryEvents.map(num => progressMyJob(num, configData[0].ethereumPrivateKey)));
                }

                if (configData[0].witnessName && saveData.resolvedEvents != undefined && saveData.resolvedEvents.length > 0) {
                    const finishJobData = await Promise.all(saveData.resolvedEvents.map(num => finishMyJob(num, configData[0].ethereumPrivateKey)));
                }
            }else{
                await saveLastBlockNumber('Witness Jury', endBlockNumber);
            }

            await saveCron('Witness Jury', 'delete', 'done');
            console.log("storeWitnessJuryLog done !!!");
            log("info", "Witness Jury script successfully done !!!");
        }
    } else {
        console.log("Configuration not exists 2 !!!");
        return false;
    }
}

const saveLastBlockNumber = async(type, blockNumber) => {
    return new Promise((resolve, reject) => {
        try {
            var query = "";
            db.all("SELECT id from cron_blocks where type = '" + type + "'", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }

                if (rows != undefined && rows.length > 0) {
                    query = "UPDATE cron_blocks SET lastBlockNumber = " + blockNumber + " where type = '" + type + "'";
                } else {
                    query = "INSERT into cron_blocks (type, lastBlockNumber) values ('" + type + "', " + blockNumber + ")";
                }
                db.run(query);
                resolve(true);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    });
}


async function progressMyJob(obj, ethereumPrivateKey) {
    return new Promise((resolve, reject) => {
        db.all("SELECT id from my_jobs where requestNum = " + obj.requestNum + " and job='Juror' and ethereumPrivateKey='" + ethereumPrivateKey + "' limit 1", function(err, rows) {
            if (err) {
                log("error", err);
                reject(err);
            } else if (rows != undefined && rows.length > 0) {
          var accountAddress = ethUtil.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString("hex");
        accountAddress = '0x' + accountAddress;
                for (var i = 0; i < rows.length; i++) {
                    if(accountAddress== obj.address){
                      db.run("UPDATE my_jobs set status='In Progress', transactionHash='" + obj.transactionHash + "'  where requestNum=" + obj.requestNum + " and job='Juror'  and ethereumPrivateKey='" + ethereumPrivateKey + "' ");
                    }
                }
                resolve(true);
            } else {
                resolve(true);
            }
        });
    });
}

async function finishMyJob(obj, ethereumPrivateKey) {
    return new Promise(async (resolve, reject) => {

        const reqDetails = await getRequestDetails(obj.requestNum);

        if(reqDetails.length > 0){
            const challengeAddress = reqDetails[reqDetails.length - 1];
            const contract = contracts['Challenge'];
            const payoutDetails = await getPayoutDetails(contract, challengeAddress, obj.blockNumber, "latest");
            var amount = payoutDetails[0]['args']["witnessJuryAmount"]
            if(payoutDetails.length > 0 && amount != undefined){

                db.all("SELECT count(*) as count from witness_jury where requestNum = "+obj.requestNum+" and ( event = 'Report' OR event = 'JuryVote')", async function(err, rows){
                    if(err){
                        log("error", err);
                        reject(err);
                    }

                    if(rows != undefined && rows.length > 0){
                        amount = amount/rows[0]['count'];
                        db.run("UPDATE my_jobs set status='Finished', transactionHash='" + obj.transactionHash + "', amount='" + amount + "'  where requestNum=" + obj.requestNum + " and ethereumPrivateKey='" + ethereumPrivateKey + "'");
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                });
            }else{
                resolve(false)
            }
        }else{
            resolve(false);
        }


        /*db.run("UPDATE my_jobs set status='Finished', transactionHash='" + obj.transactionHash + "', amount='" + obj.args['amount'] + "'  where requestNum=" + obj.requestNum + " and steamId='" + steamId + "'");
        resolve(true)*/
    });
}


async function getRequestDetails(requestNum){
    return new Promise((resolve, reject) => {
        const abi = JSON.parse(contracts['WitnessJury'].interface);
        const contract = web3.eth.contract(abi).at(constant.witnessJuryAddr);
        contract.getRequest(requestNum, function(err, result) {
            if (err) {
                log("error", err);
                reject(err);
            }
            resolve(result);
        });
    });
}

async function getPayoutDetails(contract, contractAddress, fromBlock, toBlock) {
    function decodeEvent(item) {
        const eventAbi = contract.abi.find(eventAbi => {
            const isEvent = eventAbi.type === 'event';
            const fn = `${eventAbi.name}(${eventAbi.inputs.map(x => x.type).join()})`;
            const topic = `0x${sha3(fn)}`;
            return isEvent && item.topics[0] === topic;
        });
        if (eventAbi) {
            const event = new SolidityEvent(web3, eventAbi, contractAddress);
            const result = event.decode(item);
            return result;
        }
        return null;
    }
    try {
        const eventFilter = {
            fromBlock: web3.toHex(fromBlock),
            toBlock: (toBlock == 'latest') ? 'latest' : web3.toHex(toBlock),
            address: contractAddress,
            topics: [],
            limit: 1
        };
        const url = "https://mainnet.infura.io/Za7wVPPWB81BCrN95zy1";
        const headers = {
            'Content-Type': 'application/json',
            Connection: 'keep-alive',
        };
        const body = JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [eventFilter],
            id: 1,
        });
        const options = {
            url,
            headers,
            body,
            method: 'POST',
        };
        const result = await rp(options);
        const items = JSON.parse(result).result;
        const events = [];
        for (let i = 0; i < items.length; i += 1) {
            const item = items[i];
            const blockNumber = parseInt(item.blockNumber, 16);
            const timestamp = await blockTimestamp(blockNumber);
            const date = new Date(timestamp * 1000);
            Object.assign(item, {
                blockNumber,
                date,
                logIndex: parseInt(item.logIndex, 16),
                transactionIndex: parseInt(item.transactionIndex, 16),
            });
            const event = decodeEvent(item);
            events.push(event);
        }
        return events;
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

async function updateResolveStatus(obj) {
    return new Promise((resolve, reject) => {
        db.all("SELECT address from challenge_details where witnessJuryRequestNum = " + obj.requestNum + " limit 1", function(err, rows) {
            if (err) {
                log("error", err);
                reject(err);
            } else if (rows != undefined && rows.length > 0) {
                for (var i = 0; i < rows.length; i++) {
                    db.run("UPDATE challenge_factory_logs set resolved=1 where address='" + rows[0]['address'] + "'");
                }
                resolve(true);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * @method - getLastFactoryBlockNumber
 * @desc - Get challenge factory last block number
 */
const getLastBlockNumber = async(type) => {
    return new Promise((resolve, reject) => {
        try {
            db.all("SELECT lastBlockNumber from cron_blocks where type = '" + type + "'", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            })
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
};

/**
 * @method - saveWitnessJuryLogs
 * @desc - Save witness jury logs in local DB
 */

async function saveWitnessJuryLogs(eventsData) {
    return new Promise((resolve, reject) => {
        try {
            var query = "";
            var notificationArray = [];
            var resolvedEvents = [];
            var juryEvents = [];


            async.each(eventsData, function(evt, cb) {
                const timestamp = "'" + evt['timestamp'] + "',";
                const blockNumber = evt['blockNumber'] + ",";
                const transactionHash = "'" + evt['transactionHash'] + "',";
                const fromAddress = "'" + evt['from'] + "',";
                const toAddress = "'" + evt['to'] + "',";
                const transactionIndex = evt['transactionIndex'] + ",";
                const logIndex = evt['logIndex'] + ",";
                const eventType = "'" + evt['event'] + "',";

                const args = JSON.parse(evt['arguments']);

                const requestNum = ((args['requestNum']) ? "'" + args['requestNum'] + "'" : null) + ", ";
                const amount = ((args['amount']) ? "'" + args['amount'] + "'" : null) + ", ";
                const winner = ((args['winner']) ? "'" + args['winner'] + "'" : null) + ", ";
                const vote = ((args['vote']) ? "'" + args['vote'] + "'" : null) + ", ";
                const juror = ((args['juror']) ? "'" + args['juror'] + "'" : null) + ", ";
                const answer = ((args['answer']) ? "'" + args['answer'] + "'" : null) + ", ";

                const arguments = "'" + evt['arguments'] + "'";


                if (['Report', 'Rescue', 'JuryNeeded', 'JuryVote', 'Resolve'].indexOf(evt['event']) > -1) {
                    notificationArray.push({ 'requestNum': args['requestNum'], 'event': evt['event'], 'transactionHash': evt['transactionHash'], 'userName': null });
                }

                if (evt['event'] == 'Resolve') {
                    resolvedEvents.push({ "requestNum": args['requestNum'], "transactionHash": evt['transactionHash'], "blockNumber": evt['blockNumber'] })
                }

                if (evt['event'] == 'JuryVote') {
                    juryEvents.push({ "requestNum": args['requestNum'], "transactionHash": evt['transactionHash'], "address":args['juror'] });
                }


                query += "(" + requestNum + fromAddress + toAddress + blockNumber + transactionHash + timestamp + eventType + transactionIndex + logIndex + amount + answer + winner + juror + vote + arguments + "), ";

                cb();
            }, function(err) {
                if (err) {
                    log('error', err);
                    reject(err);
                }

                query = query.replace(/,\s*$/, "");

                db.run("INSERT into witness_jury(requestNum, fromAddress, toAdress, blockNumber, transactionHash, date, event, transactionIndex, logIndex, amount, answer, winner, juror, vote, arguments) VALUES " + query);

                resolve({ "resolvedEvents": resolvedEvents, "notificationArray": notificationArray, "juryEvents": juryEvents });
            });
        } catch (err) {
            log("error", err);
            throw new Error(err);
        }
    });
}

/**
 * @method - setWitnessJobs
 * @desc - Set witness & juror jobs in local DB based on New request & jury needed events
 */
async function setWitnessJobs(eventsData, accountAddress, steamId, ethereumPrivateKey) {
    try {
        for (var i = 0; i < eventsData.length; i++) {
            const args = JSON.parse(eventsData[i]['arguments']);
            const requestNum = (args['requestNum']) ? args['requestNum'] : null;
            if (eventsData[i]['event'] == 'NewRequest' || eventsData[i]['event'] == 'JuryNeeded') {
                const contractType = "WitnessJury";
                const witnessAddr = constant.witnessJuryAddr;

                var job = (eventsData[i]['event'] == 'NewRequest') ? 'Witness' : 'Juror';
                var isWitness = false;
                var isJuror = false;
                if (eventsData[i]['event'] == 'NewRequest') {
                    isWitness = await callIsWitness(contractType, witnessAddr, 'isWitness', requestNum, '0x' + accountAddress);
                }

                if (eventsData[i]['event'] == 'JuryNeeded') {
                    isJuror = await callIsJuror(contractType, witnessAddr, 'isJuror', requestNum, '0x' + accountAddress);
                }

                if (isWitness || isJuror) {
                    const status = 'Pending';
                    db.all("INSERT INTO my_jobs (status, job,  transactionHash, requestNum, steamId, ethereumPrivateKey) Values ( '" + status + "', '" + job + "', '', '" + requestNum + "', '" + steamId + "', '"+ethereumPrivateKey+"' ) ");
                }
            } else if (eventsData[i]['event'] == 'Resolve') {
                db.run("delete from my_jobs where status='Pending' and requestNum=" + requestNum)

            }
        }
        return true;
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
}

/**
 * @method - callIsWitness
 * @desc - Check is witness
 */
async function callIsWitness(contractType, contractAddr, fn, witnessJuryRequestNum, witnessAccountAddress) {
    return new Promise((resolve, reject) => {
        const abi = JSON.parse(contracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(contractAddr);
        contract.isWitness(witnessJuryRequestNum, witnessAccountAddress, async function(err, result) {
            if (err) {
                log("error", err);
                reject(err);
            }

             const reqDetails = await getRequestDetails(witnessJuryRequestNum);
             if(result){

             if(reqDetails[1] != '0x0000000000000000000000000000000000000000' && reqDetails[2] != '0x0000000000000000000000000000000000000000'){
                resolve(false);
             }else{
                resolve(true);
             }
         }else{
            resolve(result);
         }
        });
    });
}

/**
 * @method - callIsJuror
 * @desc - Check is juror
 */
async function callIsJuror(contractType, contractAddr, fn, witnessJuryRequestNum, witnessAccountAddress) {
    return new Promise((resolve, reject) => {
        const abi = JSON.parse(contracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(contractAddr);
        contract.isJuror(witnessJuryRequestNum, witnessAccountAddress, function(err, result) {
            if (err) {
                log("error", err);
                reject(err);
            }
            resolve(result);
        });
    });
}

/**
 * @method - loadEvents
 * @desc - For given contract load all events according to block group
 */
async function loadEvents(contractType, contractAddress, startBlockNumber, endBlockNumber, blocksPerGroup) {
    try {
        const contract = contracts[contractType];
        const blockRanges = [];
        for (let i = startBlockNumber; i <= endBlockNumber; i += blocksPerGroup) {
            const fromBlock = i;
            const toBlock = Math.min(endBlockNumber, (i + blocksPerGroup) - 1);
            if (toBlock >= fromBlock) {
                blockRanges.push({ fromBlock, toBlock });
            }
        }

        log("info", `Considering blocks in range ${startBlockNumber}-${endBlockNumber}`);

        const eventsArrays = await Promise.all(blockRanges.map(range =>
            getNetworkLog(contract, contractAddress, range.fromBlock, range.toBlock)));

        const rawEvents = [].concat.apply([], eventsArrays);
        if (blockRanges.length > 0) {
            log("info", `Found ${rawEvents.length} events in ${startBlockNumber}-${endBlockNumber} for ${contractAddress} and ${contractType}`);
        }
        if (rawEvents.length > 0) {
            const events = [];
            for (let i = 0; i < rawEvents.length; i += 1) {
                const rawEvent = rawEvents[i];
                const tx = await getTransaction(rawEvent.transactionHash);
                const event = {
                    timestamp: rawEvent.date,
                    blockNumber: rawEvent.blockNumber,
                    transactionHash: rawEvent.transactionHash,
                    from: tx.from,
                    to: rawEvent.address,
                    transactionIndex: rawEvent.transactionIndex,
                    logIndex: rawEvent.logIndex,
                    event: rawEvent.event,
                    arguments: JSON.stringify(rawEvent.args),
                };
                events.push(event);
            }
            return events;
        }
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

/**
 * @method - getTransaction
 * @desc - Get transaction details by transaction hash
 */
const getTransaction = async(transactionHash) => {
    return new Promise((resolve, reject) => {
        try {
            web3.eth.getTransaction(transactionHash, function(err, result) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(result);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    });
}

/**
 * @method - getNetworkLog
 * @desc - For fetch event logs from infura
 */
async function getNetworkLog(contract, contractAddress, fromBlock, toBlock) {
    function decodeEvent(item) {
        const eventAbi = contract.abi.find(eventAbi => {
            const isEvent = eventAbi.type === 'event';
            const fn = `${eventAbi.name}(${eventAbi.inputs.map(x => x.type).join()})`;
            const topic = `0x${sha3(fn)}`;
            return isEvent && item.topics[0] === topic;
        });
        if (eventAbi) {
            const event = new SolidityEvent(web3, eventAbi, contractAddress);
            const result = event.decode(item);
            return result;
        }
        return null;
    }
    try {
        const eventFilter = {
            fromBlock: web3.toHex(fromBlock),
            toBlock: (toBlock == 'latest') ? 'latest' : web3.toHex(toBlock),
            address: contractAddress,
            topics: []
        };
        const url = "https://mainnet.infura.io/Za7wVPPWB81BCrN95zy1";
        const headers = {
            'Content-Type': 'application/json',
            Connection: 'keep-alive',
        };
        const body = JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [eventFilter],
            id: 1,
        });
        const options = {
            url,
            headers,
            body,
            method: 'POST',
        };
        const result = await rp(options);
        const items = JSON.parse(result).result;
        const events = [];
        for (let i = 0; i < items.length; i += 1) {
            const item = items[i];
            const blockNumber = parseInt(item.blockNumber, 16);
            const timestamp = await blockTimestamp(blockNumber);
            const date = new Date(timestamp * 1000);
            Object.assign(item, {
                blockNumber,
                date,
                logIndex: parseInt(item.logIndex, 16),
                transactionIndex: parseInt(item.transactionIndex, 16),
            });
            const event = decodeEvent(item);
            events.push(event);
        }
        return events;
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

/**
 * @method - blockTimestamp
 * @desc - for get timestamp of event by blockNumber
 */
const blockTimestamp = async(blockNumber) => {
    return new Promise((resolve, reject) => {
        web3.eth.getBlock(blockNumber, (err, result) => {
            if (err) reject(err);
            if (result && result.timestamp) {
                resolve(result.timestamp);
            } else {
                reject("failed to get timestamp");
            }
        });
    });
}

/**
 * @method - leaderboardUpdate
 * @desc - In every given time interval call leaderboardUpdate function and store leaderboard data
 */
async function storeLeaderboardData() {
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0) {
        log("info", "Start processing leaderboard data !!!");
        const cronData = await checkCronExists('Leaderboard');
        if (cronData && cronData.length > 0) {
            log("info", "Leaderboard script already running !!!");
            return false;
        } else {
            await saveCron('Leaderboard', 'insert', 'running');

            const userList = await getUniqueUsers();
            if (userList.length > 0) {
                const boardArrays = await Promise.all(userList.map(user => setLeaderboardData(user)));
            }
            await saveCron('Leaderboard', 'delete', 'done');
            log("info", "Leaderboard script successfully done !!!");
        }
    } else {
        console.log("Configuration not exists 3 !!!");
        return false;
    }
}

/**
 * @method - getUniqueUsers
 * @desc - Find unique username from local db
 */
async function getUniqueUsers() {
    return new Promise((resolve, reject) => {
        db.all('select key1, key2 from challenge_details', function(err, rows) {
            if (err) reject(err);
            var userList = [];
            if (rows != undefined && rows.length > 0) {
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i]['key1'] && userList.indexOf(rows[i]['key1']) == -1)
                        userList.push(rows[i]['key1']);

                    if (rows[i]['key2'] && userList.indexOf(rows[i]['key2']) == -1)
                        userList.push(rows[i]['key2']);
                }
            }
            setTimeout(() => {
                resolve(userList);
            }, 1000);
        });
    });
}

/**
 * @method - setLeaderboardData
 * @desc - Store leaderboard data in local DB
 */
function setLeaderboardData(userName) {
    return new Promise(async(resolve, reject) => {

        let leaderboardData = await getLeaderboardData(userName);

        db.all("select * from leaderboard where player='" + userName + "'", function(err, result) {
            if (err) {
                log("error", err);
                reject(err);
            }
            var query = "";
            if (result.length > 0) {
                query = "UPDATE leaderboard SET wins=" + leaderboardData.win + ", losses=" + leaderboardData.loss + ", winStreak=" + leaderboardData.winStreak + ", winRate=" + leaderboardData.winRate + ", totalChallenges=" + leaderboardData.totalChallenges + ", reputation=" + leaderboardData.reputation + " where player = '" + userName + "'";
                db.run(query);
            } else {
                query = "INSERT into leaderboard(player, wins, losses, mmr, winStreak, winRate, totalChallenges,reputation) VALUES (" + "'" + userName + "'," + leaderboardData.win + "," + leaderboardData.loss + ", " + leaderboardData.mmr + ", 0," + leaderboardData.winRate + "," + leaderboardData.totalChallenges + "," + leaderboardData.reputation + ")";
                db.run(query);
            }
            resolve(true);
        });
    });
}

/**
 * @method - getLeaderboardData
 * @desc - return data of a challenge_details
 */
function getLeaderboardData(userName) {
    return new Promise((resolve, reject) => {
        db.all("select * from challenge_details where key1='" + userName.replace(/\'/g, "''") + "' OR key2='" + userName.replace(/\'/g, "''") + "'", async function(err, profile) {
            if (err) reject(err);

            var leaderboardData = { totalChallenges: 0, win: 0, loss: 0, winRate: 0, reputation: 0, mmr: 1200, winStreak: 0, totalMatchPlayed: 0 };
            var witnessResponseCount = 0;
            leaderboardData.totalChallenges = profile.length;
            var winnerArray = _.pluck(profile, 'winner');

            for (let i = 0; i < winnerArray.length; i++) {
                if (winnerArray[i] == 1) {
                    winnerArray[i] = profile[i].key1
                } else if (winnerArray[i] == 2) {
                    winnerArray[i] = profile[i].key2
                }
            }

            var winnerCount = _.chain(winnerArray).countBy().value()[userName];

            if (winnerCount != undefined && winnerCount) {
                leaderboardData.win = winnerCount;
            }

            var tempWinStreak = 0;

            for (let winner of winnerArray) {

                if (winner == userName || winner == '') {
                    if (winner == userName) {
                        tempWinStreak += 1;
                        leaderboardData.winStreak = tempWinStreak;
                    }
                } else {;
                    tempWinStreak = 0;
                }
            }

            var eventArray = _.pluck(profile, 'event');
            var matchCount = _.chain(eventArray).countBy().value()['Resolve'];
            if (matchCount != undefined && matchCount) {
                leaderboardData.totalMatchPlayed = matchCount;
            }

            var accountAddrs;

            for (let j = 0; j < profile.length; j++) {
                if (profile[j].key1 == userName && profile[j].user1) {
                    accountAddrs = profile[j].user1;
                    break;
                } else if (profile[j].key2 == userName && profile[j].user2) {
                    accountAddrs = profile[j].user2;
                    break;
                }
            }

            leaderboardData.loss = leaderboardData.totalMatchPlayed - leaderboardData.win;

            if (leaderboardData.totalMatchPlayed > 10) {
                leaderboardData.winRate = leaderboardData.win / leaderboardData.totalMatchPlayed;
            }

            leaderboardData.reputation = await getReputation(userName, leaderboardData, accountAddrs);
            resolve(leaderboardData);
        });
    });
}

/**
 * @method - getReputation
 * @desc - return calculated reputation
 */
const getReputation = (userName, leaderboardData, accountAddrs) => {
    return new Promise((resolve, reject) => {
        Promise.resolve(filterUserArray(userName)).then(function(penalty) {
            db.all("select * from witness_jury where fromAddress='" + accountAddrs + "' AND event='Report'", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }

                let reputation = (leaderboardData.totalMatchPlayed + (rows.length / 10)) / (penalty.witness_penalty + 1);
                resolve(reputation);
            });
        }).catch(function(err) {
            if (err) {
                log("error", err);
                reject(err);
            }
        });
    });
}

async function filterUserArray(userName) {
    return new Promise(async(resolve, reject) => {
        let penalty = 0;
        db.all("select * from challenge_details where (key1='" + userName + "' OR key2='" + userName + "') AND winner != ''", async(err, rows) => {
            if (err) {
                reject(err);
            } else {
                if (rows.length > 0) {
                    let userAccountArray = [];

                    async.each(rows, function(r, cb) {
                        if (r.key1 == userName) {
                            userAccountArray.push({ address: r.user1, requestNum: r.witnessJuryRequestNum, winner: r.winner });
                        }

                        if (r.key2 == userName) {
                            userAccountArray.push({ address: r.user2, requestNum: r.witnessJuryRequestNum, winner: r.winner });
                        }
                        cb();
                    }, async(err) => {
                        if (err) {
                            reject(err);
                        }
                        if (userAccountArray.length > 0) {
                            var userArray = await Promise.all(userAccountArray.map(user => getReportedWinner(user)));
                            userArray = [].concat.apply([], userArray);
                            resolve({ witness_penalty: userArray.length });
                        } else {
                            resolve({ witness_penalty: 0 });
                        }
                    });
                } else {
                    resolve({ witness_penalty: 0 });
                }
            }
        });
    });
}


const getReportedWinner = (obj) => {
    return new Promise((resolve, reject) => {
        db.all("select * from witness_jury where requestNum='" + obj.requestNum + "' AND fromAddress='" + obj.address + "' AND event='Report' AND winner !='" + obj.winner + "'", function(err, result) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

/**
 * @method - witnessReport
 * @desc - In given time interval call witnessReport function for report on jobs
 */
setInterval(function() {
    witnessReport();
}, 3 * 60 * 1000);

async function witnessReport() {
    const configData = await checkConfigurationExists();
    if (configData && configData.length > 0 && configData[0].witnessName && configData[0].steamPassword) {
        const cronData = await checkCronExists('Witness Report');
        if (cronData && cronData.length > 0) {
            console.log("Witness report script already running !!!");
            return false;
        } else {
            await saveCron('Witness Report', 'insert', 'running');

            const witnessPk = configData[0].ethereumPrivateKey;
            const witnessAccountAddress = ethUtil.privateToAddress(Buffer.from(witnessPk, 'hex')).toString("hex");
            const witnessAddr = constant.witnessJuryAddr;
            const witnessName = configData[0].witnessName;
            const steamPassword = configData[0].steamPassword;

            const jobsData = await getMyJobs(configData[0].ethereumPrivateKey);

            if (jobsData != undefined && jobsData.length > 0) {
                const reportData = await intializeReport(jobsData, 'WitnessJury', witnessAddr, witnessAccountAddress, witnessPk, witnessName, steamPassword);
                console.log('reportData', reportData);
                if (reportData != undefined && reportData.length > 0) {
                    const updateData = await Promise.all(reportData.map(report => updateMyJob(report, configData[0].ethereumPrivateKey)));
                }
            }

            await saveCron('Witness Report', 'delete', 'done');
        }
    } else {
        console.log("Configuration not exists 4 !!!");
        return false;
    }
}




async function intializeReport(jobsData, contractType, witnessAddr, witnessAccountAddress, witnessPk, witnessName, steamPassword) {
    return new Promise(async(resolve, reject) => {
        var reportMyJobData = [];
        for (var i = 0; i < jobsData.length; i++) {
            const needToSteamConnect = (i == 0) ? true : false;

            var result = await reportMyJob(contractType, witnessAddr, 'report', jobsData[i].requestNum, '0x' + witnessAccountAddress, jobsData[i].match_id, witnessPk, needToSteamConnect, witnessName, steamPassword);

            reportMyJobData.push(result);

            if (i == jobsData.length - 1) {
                resolve(reportMyJobData);
            }
        }
    });
}


/**
 * @method - getMyJobs
 * @desc - Get my jobs from local DB
 */
async function getMyJobs(ethereumPrivateKey) {
    return new Promise((resolve, reject) => {
        try {
            db.all("select my_jobs.requestNum, challenge_details.witnessJuryKey as match_id from my_jobs join challenge_details on my_jobs.requestNum = challenge_details.witnessJuryRequestNum where my_jobs.ethereumPrivateKey='" + ethereumPrivateKey + "' and my_jobs.status = 'Pending' and my_jobs.job = 'Witness' and challenge_details.witnessJuryKey != ''", function(err, rows) {
                if (err) {
                    log("error", err);
                    reject(err);
                }
                resolve(rows);
            })
        } catch (err) {
            log("error", err);
            reject(err);
        }
    })
}

/**
 * @method - reportMyJob
 * @desc - Report on my pending jobs
 */
async function reportMyJob(contractType, contractAddr, fn, witnessJuryRequestNum, witnessAccountAddress, match_id, pk, needToSteamConnect, witnessName, steamPassword) {
    try {
        const value = 0;
        const gasLimit = 400000;
        const gasPrice = "10000000000";
        const addressNonce = await getNonce(witnessAccountAddress);
        const match_data = await getMatchDetails(match_id, needToSteamConnect, witnessName, steamPassword);
        if (match_data && (match_data.match_outcome == 2 || match_data.match_outcome == 3)) {
            const reportTxHash = await sendData(contractType, contractAddr, fn, [witnessJuryRequestNum, JSON.stringify(match_data), match_data.match_outcome - 1], value, gasLimit, gasPrice, pk, addressNonce);
            return { 'reportTxHash': reportTxHash, 'requestNum': witnessJuryRequestNum };
        } else {
            return { 'reportTxHash': "", 'requestNum': witnessJuryRequestNum };;
        }
    } catch (err) {
        log("error", err);
        throw new Error(err);
    }
}

/**
 * @method - updateMyJob
 * @desc - Update my job details in DB
 */
async function updateMyJob(report, ethereumPrivateKey) {
    return new Promise(async(resolve, reject) => {
        if (report.reportTxHash) {
            const status = 'In Progress';
            db.run("update my_jobs set status = '" + status + "',   transactionHash ='" + report.reportTxHash + "'  where  requestNum=" + report.requestNum + " and job='Witness' and ethereumPrivateKey='" + ethereumPrivateKey + "'");
            resolve(true);
        } else {
            resolve(true);
        }
    });
}


/**
 * @method - getMatchDetails
 * @desc - Get match details by match id
 */
async function getMatchDetails(match_id, needToConnect, witnessName, steamPassword) {
    return new Promise((resolve, reject) => {
        var onSteamLogOn = function onSteamLogOn(logonResp) {
            Dota2.launch();
            Dota2.on('ready', async function() {
                await Dota2.requestMatchMinimalDetails([match_id], function(err, result) {
                    Dota2.exit();
                    if (!err && result && result.matches && result.matches.length === 1) {
                        var match = result.matches[0];
                        resolve(match);
                    } else {
                        resolve(false);
                    }
                });
            });
        }

        setTimeout(async() => {
            if (needToConnect) {
                await steamClient.connect();
                await steamClient.on('connected', function() {
                    steamUser.logOn({
                        account_name: witnessName,
                        password: steamPassword
                    });
                });
                await steamClient.on('logOnResponse', onSteamLogOn);
            } else {
                onSteamLogOn('logOnResponse');
            }
        }, 5000);
    });
}

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

        const abi = JSON.parse(contracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(contractAddr);
        const data = `${contract[fn].getData.apply(null, args)}`;

        const rawTx = generateRawTransaction(pk, nonce, contractAddr, data, value, gasLimit, gasPrice);
        web3.eth.sendRawTransaction(rawTx, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
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

async function storeNotifications(notificationData, playerName, type) {
    try {
        const myChallenges = await getMyChallenges(playerName);
        if (myChallenges && myChallenges.length > 0) {
            const filteredNotifications = await filterMyNotification(myChallenges, notificationData, type);
            if (filteredNotifications && filteredNotifications.length > 0) {
                const newNotificationArray = await updateNotificationData(filteredNotifications);
                await saveNotification(newNotificationArray, playerName);
                return true;
            } else {
                return true;
            }
        } else {
            return true
        }
    } catch (err) {
        log("error", err);
        return true;
    }
}

async function getHostDetails(address) {
    return new Promise((resolve, reject) => {
        const abi = JSON.parse(contracts['Challenge'].interface);
        const contract = web3.eth.contract(abi).at(address);

        contract.hostKey.call(function(err, res){
            if(err){
                reject(err);
            }else{
                resolve(res);
            }
        });
    });
}

async function getMyChallenges(username) {
    return new Promise((resolve, reject) => {
        db.serialize(function() {
            db.all("SELECT * from challenge_details where key1='" + username + "' OR key2='" + username + "'", function(err, rows) {
                if (err) reject(err);
                resolve(rows);
            });
        });
    });
}

async function filterMyNotification(myChallenges, notificationData, type) {
    return new Promise((resolve, reject) => {
        var filterArr = [];
        async.each(myChallenges, function(challenge, cb) {
            var results = [];
            if (type == 'witness') {
                results = notificationData.filter(function(n) { return n.requestNum == challenge.witnessJuryRequestNum; });


                results.forEach(function(t) { t['address'] = challenge.address; });
            } else {
                results = notificationData.filter(function(n) { return n != undefined && n != null && n && n.address == challenge.address; });
            }
            if (results.length > 0) {
                filterArr.push(results);
            }
            cb();
        }, function(err) {
            if (err) {
                log("error", err);
                reject(err);
            }
            filterArr = [].concat.apply([], filterArr);
            resolve(filterArr);
        });
    });
}

async function updateNotificationData(filteredNotifications) {
    return new Promise(async(resolve, reject) => {
        var newNotificationArray = [];
        for (var i = 0; i < filteredNotifications.length; i++) {
            if (filteredNotifications[i]['event'] == 'SetWitnessJuryKey') {
                if (filteredNotifications[i]['userName'] == undefined || filteredNotifications[i]['userName'] == null || !filteredNotifications[i]['userName'] || filteredNotifications[i]['userName'] == '') {
                    var hostKey = await getHostDetails(filteredNotifications[i]['address']);
                    filteredNotifications[i]['userName'] = hostKey;
                    newNotificationArray.push(filteredNotifications[i]);
                } else {
                    newNotificationArray.push(filteredNotifications[i]);
                }
            } else {
                newNotificationArray.push(filteredNotifications[i]);
            }

            if (i == filteredNotifications.length - 1) {
                resolve(newNotificationArray);
            }
        }
    });
}

async function saveNotification(notificationData, playerName) {
    return new Promise((resolve, reject) => {
        var query = "";
        async.each(notificationData, function(notification, cb) {
            const isRead = "no";
            var message = "";
            if (notification['event'] == 'Respond' && notification['userName'] != playerName) {
                message = "Your challenge has been accepted by <<username>>";
            } else if (notification['event'] == 'SetWitnessJuryKey') {
                message = "A Lobby has been created for your match. your host is: <<username>>";
            } else if (notification['event'] == 'Report') {
                message = "A witness has been found for your open challenge. Click to reach the details.";
            } else if (notification['event'] == 'Rescue') {
                message = "Your challenge is rescued, click to reach the challenge.";
            } else if (notification['event'] == 'JuryNeeded') {
                message = "A jury was requested for one of your recent matches - Click to reach the challenge.";
            } else if (notification['event'] == 'JuryVote') {
                message = "A jury decisioned to one of your matches - click to reach details.";
            } else if (notification['event'] == 'Resolve') {
                message = "Your challenge has been paid. Click to reach the details.";
            }
            if (message) {
                query += "(" + "'" + playerName + "'," + "'" + notification['address'] + "'," + "'" + notification['event'] + "'," + "'" + message + "'," + "'" + notification['userName'] + "'," + "'" + notification['transactionHash'] + "'," + "'" + isRead + "', '" + new Date() + "' ),";

                // Show notification popup
                const notificationMsg = (notification['userName']) ? message.replace("<<username>>", notification['userName']) : message;
                showNotification(notificationMsg);
            }

            cb();
        }, function(err) {
            if (err) {
                log("error", err);
                reject(err);
            }
            query = query.replace(/,\s*$/, "");

            db.run("INSERT into notification (player, address, type, message, username, transactionHash, isRead, dateTime) values " + query);
            resolve(true);
        });
    });
}

function showNotification(message) {
    notifier.notify({
        title: 'New message on First Blood',
        message: message,
        icon: path.join(__dirname, '../../frontend/assets/images/img-oponent.jpg'),
        sound: true
    });
}


module.exports = router;
