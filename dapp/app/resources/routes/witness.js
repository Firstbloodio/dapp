const express = require('express');
const router = express.Router();
const ethUtil = require('ethereumjs-util');
const responseHandler = require('../library/responseHandler');
const _ = require('underscore');
const constant = require('./constant.js');
const async = require('async');
const CompiledContracts = require('../assets/files/compiled.json').contracts;
const sqlite3 = require('sqlite3').verbose();
var db = "";
var isWin = process.platform === "win32";

if(isWin){
    db = new sqlite3.Database('firstblood.db');    
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));

router.get('/get_balance', function(req, res, next) {
    Promise.resolve(getBalance(req.query.pk)).then(function(balance) {
        responseHandler.send(req, res, 'success', 200, { balance: balance }, null)
    }).catch(function(e) {
        responseHandler.send(req, res, 'err', 500, null, e)
    });
});


function getBalance(ethereumPrivateKey) {
    return new Promise((resolve, reject) => {
        const contractType = "WitnessJury";
        const contractAddress = constant.witnessJuryAddr;

        var accountAddress = ethUtil.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString("hex");
        accountAddress = '0x' + accountAddress;

        const abi = JSON.parse(CompiledContracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(contractAddress);

        contract.balanceOf(accountAddress, function(err, balance) {
            if (err) reject(err);

            if(balance)
              balance = web3.fromWei(balance.toNumber(), "ether");
            else
              balance = 0;
          
            resolve(balance);
        });
    })
}


router.post('/account_log', function(req, res, next) {
    const ethereumPrivateKey = req.body.pk;
    var accountAddress = ethUtil.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString("hex");
    accountAddress = '0x' + accountAddress;
    db.all("SELECT date, amount, event, transactionHash from witness_jury where fromAddress = '" + accountAddress + "' AND (event ='Deposit' OR event='Withdraw') order by blockNumber desc ", function(err, rows) {
        if (rows.length > 0) {
            Promise.resolve(getBalance(ethereumPrivateKey)).then(function(balance) {
                var balance = Number(balance);
                for (i = 0; i < rows.length; i++) {
                    const data = rows[i];
                    data.amount = web3.fromWei(data.amount, 'ether')
                    data.date = new Date(data.date)
					if(i == rows.length -1){
						responseHandler.send(req, res, 'success', 200, { logs: rows, amount: balance }, null);
					}
                }
            }).catch(function(e) {
                responseHandler.send(req, res, 'err', 500, null, e)
            });
        } else {
            responseHandler.send(req, res, 'success', 200, rows, null);
        }
    });
});



router.get('/witness_account_status', function(req, res, next) {
    var offset = req.query.page;
    var pageSize = req.query.pageSize;
    var offset = (offset - 1) * pageSize;
    var steamId = req.query.steam_id;
    var ethereumPrivateKey = req.query.ethereumPrivateKey;
    db.all("SELECT my_jobs.status,my_jobs.job,my_jobs.transactionHash,my_jobs.requestNum,my_jobs.amount,challenge_details.address FROM my_jobs INNER JOIN challenge_details on  my_jobs.requestNum = challenge_details.witnessJuryRequestNum  where my_jobs.ethereumPrivateKey='"+ethereumPrivateKey+"' LIMIT " + pageSize + " OFFSET " + offset, (error, rows) => {
        if (error){
            responseHandler.send(req, res, 'err', 500, null, error)
        }else{
            _.each(rows, (value, key) => {
                if (value['amount']) {
                    value['amount'] = web3.fromWei(value['amount'], 'ether');
                }
            });
            responseHandler.send(req, res, 'success', 200, rows, null)
        }
    });
});


router.get('/witness_penalty', function(req, res, next) {

    db.all("select * from my_jobs where job='Witness'", async (error, rows) => {
        if (error) {
            responseHandler.send(req, res, 'err', 500, null, error)
        } else {

            if (rows.length > 0) {
                let requestNumArray = [];
                for (let i = 0; i < rows.length; i++) {
                    requestNumArray.push(rows[i].requestNum)
                }
                let winner = await getWinner(requestNumArray.toString());

                if (winner.length > 0) {
                    let penalty = 0;
                    for (let j = 0; j < winner.length; j++) {
                        let penaltyData = await getPenalty(winner[j].witnessJuryRequestNum, winner[j].winner);

                        if (penaltyData.length == 0)
                            penalty++;
                    }
                    responseHandler.send(req, res, 'success', 200, { witness_penalty: penalty, witness_job: rows.length }, null);
                } else {
                    responseHandler.send(req, res, 'success', 200, { witness_penalty: 0, witness_job: rows.length }, null);
                }
            } else {
                responseHandler.send(req, res, 'success', 200, { witness_penalty: 0, witness_job: 0 }, null);
            }
        }
    });

});

router.get('/player_penalty', function(req, res, next) {
    let playerName = req.query.playerName;
    Promise.resolve(filterUserArray(playerName)).then(function(result){
        responseHandler.send(req, res, 'success', 200, result, null);
    }).catch(function(err){
        responseHandler.send(req, res, 'error', 500, null, err);
    })

});


async function filterUserArray(userName){
    return new Promise( async (resolve, reject) => {
        let penalty = 0;
        db.all("select * from challenge_details where (key1='"+userName+"' OR key2='"+userName+"') AND winner != ''", async (err, rows) => {
            if (err){
                reject(err);  
            } else {
                if (rows.length > 0) {
                    let userAccountArray = [];

                    async.each(rows, function(r, cb){
                        if(r.key1 == userName){
                           userAccountArray.push({address:r.user1,requestNum:r.witnessJuryRequestNum,winner:r.winner});
                        }

                        if(r.key2 == userName){
                           userAccountArray.push({address:r.user2,requestNum:r.witnessJuryRequestNum,winner:r.winner});
                        }  
                        cb();            
                    }, async (err) => {
                        if (err){
                            reject(err);  
                        }
                        if(userAccountArray.length > 0){
                            var userArray = await Promise.all(userAccountArray.map(user => getReportedWinner(user)));
                            userArray = [].concat.apply([], userArray);
                            resolve({ witness_penalty: userArray.length });
                        }else{
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

/**
 * @method - getPenalty
 * @desc - return data of a user has winner 
 */
const getReportedWinner = (obj) => {
    return new Promise((resolve, reject) => {
        db.all("select * from witness_jury where requestNum='" + obj.requestNum + "' AND fromAddress='"+obj.address+"' AND event='Report' AND winner !='" + obj.winner + "'", function(err, result) {
            if (err){
                reject(err);  
            } 
            resolve(result);
        });
    });
}

/**
 * @method - getWinner
 * @desc - return data of a user has winner 
 */
const getWinner = (requestNum) => {
    return new Promise((resolve, reject) => {
        db.all("select winner,witnessJuryRequestNum from challenge_details where witnessJuryRequestNum IN (" + requestNum + ") AND winner != ''", function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}



/**
 * @method - getPenalty
 * @desc - return data of a user has winner 
 */
const getPenalty = (requestNum, winner) => {
    return new Promise((resolve, reject) => {
        db.all("select * from witness_jury where requestNum='" + requestNum + "' AND event='Report' AND winner='" + winner + "'", function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}


module.exports = router;