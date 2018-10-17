const express = require('express');
const router = express.Router();
const _ = require('underscore');
const responseHandler = require('../library/responseHandler');
const contracts = require('../assets/files/compiled.json').contracts;
const sqlite3 = require('sqlite3').verbose();


var db = "";
var isWin = process.platform === "win32";

if(isWin){
    db = new sqlite3.Database('firstblood.db');    
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}

const async = require('async');
const ethUtil = require('ethereumjs-util');
const constant = require('./constant.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));


router.get('/challengeStatusByUser', function(req, res, next) {
    db.serialize(function() {
        db.all("SELECT * from challenge_details where event != 'Finish' AND ( key1 = '" + req.query.userName + "' OR key2 = '" + req.query.userName + "' )", function(err, result) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                responseHandler.send(req, res, 'success', 200, result, null)
            }
        });
    });
});

router.post('/rescue_funds', function(req, res, next) {
    const challengeAdress = req.body.address;
    console.log('rescue_funds', challengeAdress);
    Promise.resolve(rescueFunds(challengeAdress)).then(function(balance) {
        responseHandler.send(req, res, 'success', 200, { balance: balance }, null)
    }).catch(function(e) {
        responseHandler.send(req, res, 'err', 500, null, e)
    });
});

function rescueFunds(challengeAdress) {
    return new Promise((resolve, reject) => {
        const contractType = "challenge";
        const abi = JSON.parse(contracts[contractType].interface);
        const contract = web3.eth.contract(abi).at(challengeAdress);
        contract.rescue(function(err, result) {
            if (err) reject(err);
            console.log(result);
            resolve(result);
        });

    })
}

router.get('/block_number', function(req, res, next) {
    db.all("SELECT min(challenge_logs.blockNumber) as challenge_block,challenge_details.witnessJuryKey, challenge_details.witnessJuryRequestNum from challenge_logs, challenge_details where challenge_logs.address = '" + req.query.address + "' and  challenge_details.address = '" + req.query.address + "'", function(err, row) {
        if (!err && row && row.length) {
            db.all("select winner from witness_jury where requestNum = " + row[0].witnessJuryRequestNum + " and event = 'Report' ", async function(error, winner) {
                var gotWinner = (winner && winner.length > 1) ? true : false;
                await web3.eth.getBlockNumber(function(error, result) {
                    if (!error) {
                        responseHandler.send(req, res, 'success', 200, { current_block: result, challenge_block: row[0].challenge_block, witnessJuryKey: row[0].witnessJuryKey, elapsed: (result - row[0].challenge_block), gotWinner: gotWinner }, null);
                    } else {
                        responseHandler.send(req, res, 'error', 500, null, error);
                    }
                });
            });
        } else {
            responseHandler.send(req, res, 'error', 500, null, err);
        }
    });
});

router.get('/can_jury_vote', function(req, res, next) {
    var requestNumber = req.query.request_number;
    var ethereumPrivateKey = req.query.ethereumPrivateKey;
    db.serialize(function() {
        db.all("SELECT * from my_jobs where requestNum ='" + requestNumber + "' and job ='Juror' and ethereumPrivateKey= '" + ethereumPrivateKey +"'", function(err, result) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                db.all("select * from configuration", function(err,config){

                    var accountAddress = ethUtil.privateToAddress(Buffer.from(config[0].ethereumPrivateKey, 'hex')).toString("hex");
                    accountAddress = '0x'+ accountAddress;
                    db.all("select * from witness_jury where requestNum = '" +requestNumber +"' and event='JuryVote' and ( fromAddress = '"+ accountAddress.toUpperCase() +"' or fromAddress = '"+ accountAddress.toLowerCase() +"')", function(error, juryVote){
                        var newData = {};
                        newData['canVote'] = result;
                        newData['alreadyVoted'] = juryVote;
                        responseHandler.send(req, res, 'success', 200, newData, null)
                    })
                })
            }
        });
    });
});

/*router.post('/insertCreateChallenge', function(req, res, next) {
    db.serialize(function() {

        db.run("INSERT INTO challenge_details (address,event,user1,key1,isFunded,amount,date,lastBlockNumber) VALUES ('"+req.body.address+"','"+req.body.event+"','"+req.body.user1+"','"+req.body.key1+"','yes',"+req.body.amount+",'"+req.body.date+"','"+req.body.lastBlockNumber+"')");
        responseHandler.send(req, res, 'success', 200, null, 'success')
    });
});*/

/*router.put('/updateChallenge', function(req, res, next) {
    db.serialize(function() {
        db.all("UPDATE challenge_details SET key2='"+req.body.key2+"',user2='"+req.body.user2+"',date='"+req.body.date+"',event='"+req.body.event+"' where address='"+req.body.address+"'", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                responseHandler.send(req, res, 'success', 200, null, err)
            }
        });
    });
})*/

module.exports = router;