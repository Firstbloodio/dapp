const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const SolidityEvent = require('web3/lib/web3/event')
const sha3 = require('web3/lib/utils/sha3');
const async = require('async');
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
const constant = require('./constant.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(constant.etherscanHost));



router.get('/checkLastBlock', function(req, res, next) {
    db.all("SELECT lastBlockNumber from cron_blocks where type='Challenge Factory'", function(err, rows) {
        if (err) {
            responseHandler.send(req, res, 'error', 500, null, err)
        } else {
            if (rows.length > 0) {
                responseHandler.send(req, res, 'success', 200, true, null)
            } else {
                responseHandler.send(req, res, 'success', 200, false, null)
            }
        }
    })
});

router.get('/syncedBlocks', function(req, res, next) {
    if(req.query.isPlayer == 'true'){
      db.all("SELECT lastBlockNumber from cron_blocks where type='Challenge Factory'", function(err, rows) {
        if (err) {
            responseHandler.send(req, res, 'error', 500, null, err)
        } else {
            if (rows.length > 0) {
                db.all("select min(lastBlockNumber) as minBlock from challenge_details", function(err1, rows1) {
                    if (err1) {
                        responseHandler.send(req, res, 'error', 500, null, err)
                    } else {
                        if (rows1.length > 0 && rows1[0].minBlock != null) {
                            responseHandler.send(req, res, 'success', 200, {minBlock:rows1[0].minBlock,maxBlock:rows[0].lastBlockNumber}, null)
                        } else {
                            responseHandler.send(req, res, 'success', 200, null, null)
                        }
                    }
                })
            } else {
                responseHandler.send(req, res, 'success', 200, null, null)
            }
        }
    })
    }else{

        db.all("SELECT lastBlockNumber from cron_blocks where type='Witness Jury'", function(err, rows) {
        if (err) {
            responseHandler.send(req, res, 'error', 500, null, err)
        } else {
            if (rows.length > 0) {
                db.all("select min(blockNumber) as minBlock from witness_jury", function(err1, rows1) {
                    if (err1) {
                        responseHandler.send(req, res, 'error', 500, null, err)
                    } else {
                        if (rows1.length > 0 && rows1[0].minBlock != null) {
                            responseHandler.send(req, res, 'success', 200, {minBlock:rows1[0].minBlock,maxBlock:rows[0].lastBlockNumber}, null)
                        } else {
                            responseHandler.send(req, res, 'success', 200, null, null)
                        }
                    }
                })
            } else {
                responseHandler.send(req, res, 'success', 200, null, null)
            }
        }
    })
    }
});

/**
 * @api - getLogs
 * @params - req, res, next
 * @description - showing game logs on game table
 */
router.get('/getLogs', function(req, res, next) {
    if (req.query.page && req.query.pageSize) {
        var offset = req.query.page;
        var pageSize = req.query.pageSize;
        var offset = (offset - 1) * pageSize;
        var conditionQuery = '';
        var conditionParams = [];
        conditionQuery += "where  ";
        conditionParams.push("cd.isFunded = 'yes' ");


        if (req.query.reputation && req.query.reputation > 0 && req.query.myGameOnly == 'false') {
            conditionParams.push("l.reputation > " + req.query.reputation);
        }

        if (req.query.status) {
            const logStatus = [];
            var status = req.query.status.split(',');
            for (var i = 0; i < status.length; i++) {
                if (status[i] == 'open') {
                    logStatus.push("cd.event = 'NewChallenge'");
                    logStatus.push("cd.event = 'Fund'");
                }
                if (status[i] == 'inProgess') {
                    logStatus.push("cd.event = 'Respond'");
                    logStatus.push("cd.event = 'Host'");
                    logStatus.push("cd.event = 'SetWitnessJuryKey'");
                    logStatus.push("cd.event = 'RequestJury'");
                }

                if (status[i] == 'finished') {
                    logStatus.push("cd.event = 'Resolve'");
                    logStatus.push("cd.event = 'Rescue'");
                }

            }

            conditionParams.push(" (" + logStatus.join(' OR ') + ")");
        }

        if (req.query.myGameOnly == 'true') {
            db.all("SELECT * from configuration LIMIT 1", function(err, rows) {
                if (err) {
                    responseHandler.send(req, res, 'error', 500, null, err)
                } else if (rows.length > 0) {
                    conditionParams.push(" (cd.key1 = '" + rows[0].playerName + "' OR cd.key2 = '" + rows[0].playerName + "')");
                    conditionQuery += conditionParams.join(' AND ');
                    selectChallengeDetails(req, res, conditionQuery, pageSize, offset);
                } else {
                    responseHandler.send(req, res, 'success', 200, [], null)
                }
            });
        } else {
            conditionQuery += conditionParams.join(' AND ');
            selectChallengeDetails(req, res, conditionQuery, pageSize, offset);
        }
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.")
    }
});

function selectChallengeDetails(req, res, conditionQuery, pageSize, offset) {
    if (req.query.reputation && req.query.myGameOnly == 'false') {
        reputationFilter(conditionQuery, pageSize, offset).then((rows, err) => {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                _.each(rows, (value, key) => {
                    value['amount'] = web3.fromWei(value['amount'], 'ether');
                });
                responseHandler.send(req, res, 'success', 200, rows, null)
            }
        });

    } else {
        filterWithoutReputation(conditionQuery, pageSize, offset).then((rows, err) => {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                _.each(rows, (value, key) => {
                    value['amount'] = web3.fromWei(value['amount'], 'ether');
                });
                responseHandler.send(req, res, 'success', 200, rows, null)
            }
        });
    }
}

/**
 * @method - reputationFilter
 * @desc - get Game table data filtered using reputaion 
 */
function reputationFilter(conditionQuery, pageSize, offset) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * from challenge_details cd INNER JOIN leaderboard l ON cd.key1 = l.player OR cd.key2 = l.player " + conditionQuery + " group by cd.id order by cd.date DESC LIMIT  " + pageSize + " OFFSET " + offset, function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

/**
 * @method - filterWithoutReputation
 * @desc - get Game table data without reputaion 
 */
function filterWithoutReputation(conditionQuery, pageSize, offset) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * from challenge_details cd " + conditionQuery + " order by cd.date DESC LIMIT  " + pageSize + " OFFSET " + offset, function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

router.get('/leaderboard', function(req, res, next) {
    if (req.query.page && req.query.pageSize) {
        var orderBy = req.query.orderBy;
        var offset = req.query.page;
        var pageSize = req.query.pageSize;
        var offset = (offset - 1) * pageSize;

        db.all("SELECT * from leaderboard  ORDER BY " + orderBy + " DESC LIMIT  " + pageSize + " OFFSET " + offset, function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err);
            } else {
                responseHandler.send(req, res, 'success', 200, rows, null);
            }
        });
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.");
    }
});

/**
 * @api - getLogs
 * @params - req, res, next
 * @description - showing event logs on challenge status
 */

router.get('/getEventLogs', function(req, res, next) {
    if (req.query.address) {
        db.all("SELECT * from challenge_logs WHERE address = '" + req.query.address + "'  group by event ORDER BY id asc", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err);
            } else {

                if (rows.length >= 5) {

                    db.all("SELECT *,arguments as args from witness_jury where requestNum='" + JSON.parse(rows[4].args).witnessJuryRequestNum + "'", function(err, data) {
                        if (!err && data) {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i]['event'] == 'Report' || data[i]['event'] == 'JuryVote' || data[i]['event'] == 'JuryNeeded') {
                                    rows.push(data[i]);
                                }

                                if (data[i]['event'] == 'Resolve') {
                                    data[i]['event'] = 'WitnessJuryResolve';
                                    rows.push(data[i]);
                                }
                            }
                            responseHandler.send(req, res, 'success', 200, rows, null);
                        } else {
                            responseHandler.send(req, res, 'success', 200, rows, null);
                        }
                    });

                } else {
                    responseHandler.send(req, res, 'success', 200, rows, null)
                }
            }
        });
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.");
    }
});

router.get('/challengeStatusDetails', function(req, res, next) {
    if (req.query.address) {
        db.all("SELECT * from challenge_details WHERE address = '" + req.query.address + "'", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err);
            } else {
                _.each(rows, (value, key) => {
                    value['amount'] = web3.fromWei(value['amount'], 'ether');
                });
                responseHandler.send(req, res, 'success', 200, rows, null)
            }
        });
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.");
    }
});





/*router.get('/canPayout', function(req, res, next) {
if(req.query.address){

db.all("SELECT * from challenge_logs where address='" + req.query.address + "' and event='SetWitnessJuryKey'", function(err, rows) {
if (err) {
responseHandler.send(req, res, 'error', 500, null, err)
} else {
if(rows.length > 0 ){
var reqNo = JSON.parse(rows[0]['args']).witnessJuryRequestNum;
db.all("SELECT * from witness_jury where requestNum='" + reqNo + "' and event='JuryNeeded'", function(err1, result) {
if (err1) {
responseHandler.send(req, res, 'error', 500, null, err1)
}else if(result && result.length > 0){
db.all("SELECT * from witness_jury where requestNum='" + reqNo + "' and event='JuryVote' order by blockNumber desc", function(err, result1) {
if(err){
responseHandler.send(req, res, 'error', 500, null, err)
}

if(result1.length > 0){
var voteArray = _.pluck(result1, 'vote');
var trueCount = _.chain(voteArray).countBy().value()['true'];
var falseCount = _.chain(voteArray).countBy().value()[null];

if(trueCount >= 1 || falseCount >= 1){
responseHandler.send(req, res, 'success', 200, {canPayout:true, blockNumber:result1[0].blockNumber}, null);
}else{
responseHandler.send(req, res, 'success', 200, {canPayout:false, blockNumber:null}, null);
}

}else{
responseHandler.send(req, res, 'success', 200, {canPayout:false, blockNumber:null}, null); 
}
});

}else{
db.all("SELECT * from witness_jury where requestNum='" + reqNo + "' and event='Report' order by blockNumber DESC", function(err2, result2) {
if(err2){
responseHandler.send(req, res, 'error', 500, null, err2)
}

if(result2.length >=2){
responseHandler.send(req, res, 'success', 200, {canPayout:true, blockNumber:result2[0].blockNumber}, null);
}else{
responseHandler.send(req, res, 'success', 200, {canPayout:false, blockNumber:null}, null);
}
});
}
});
}else{
responseHandler.send(req, res, 'success', 200, {canPayout:false, blockNumber:null}, null);
}                
}
});
}else{
responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.") 
}
});*/

async function getBlockPeriod(address) {
    return new Promise((resolve, reject) => {
        const abi = JSON.parse(contracts['Challenge'].interface);
        const contract = web3.eth.contract(abi).at(address);

        contract.blockPeriod.call(function(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


router.get('/canPayout', function(req, res, next) {
    if (req.query.address) {
        getBlockPeriod(req.query.address).then(function(blockPeriod) {
            db.all("SELECT * from challenge_logs where address='" + req.query.address + "' and event='SetWitnessJuryKey'", function(err, rows) {
                if (err) {
                    responseHandler.send(req, res, 'error', 500, { blockPeriod: blockPeriod }, err)
                } else {
                    if (rows.length > 0) {
                        var reqNo = JSON.parse(rows[0]['args']).witnessJuryRequestNum;
                        db.all("SELECT * from witness_jury where requestNum='" + reqNo + "' and event='Report' order by blockNumber DESC", function(err2, result2) {
                            if (err2) {
                                responseHandler.send(req, res, 'error', 500, { blockPeriod: blockPeriod }, err2)
                            } else {
                                if (result2.length >= 2) {
                                    responseHandler.send(req, res, 'success', 200, { canPayout: true, blockNumber: result2[0].blockNumber, blockPeriod: blockPeriod }, null);
                                } else {
                                    responseHandler.send(req, res, 'success', 200, { canPayout: false, blockNumber: null, blockPeriod: blockPeriod }, null);
                                }
                            }
                        });
                    } else {
                        responseHandler.send(req, res, 'success', 200, { canPayout: false, blockNumber: null, blockPeriod: blockPeriod }, null);
                    }
                }
            });
        })
    } else {
        responseHandler.send(req, res, 'error', 400, { blockPeriod: 0 }, "Invalid required parameters.")
    }
});

router.get('/getNotificationsCount', function(req, res, next) {
    var playerName = (req.query.playerName) ? req.query.playerName : '';

    if (playerName) {
        db.all("SELECT * from notification where player= '" + playerName + "' and message !='' order by dateTime desc limit 10", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 200, null, err)
            } else {
                db.all("SELECT count(case when isRead = 'no' then isRead end) as unreadCount from notification", function(err, count) {
                    if (err) {
                        responseHandler.send(req, res, 'error', 200, null, err)
                    } else {
                        const data = {}
                        data.notification = rows;
                        data.unreadCount = count[0].unreadCount;
                        responseHandler.send(req, res, 'success', 200, data, null)
                    }
                });
            }
        });
    } else {
        responseHandler.send(req, res, 'success', 200, null, null)
    }
})


router.get('/getNotifications', function(req, res, next) {
    if (req.query.page && req.query.pageSize && req.query.playerName) {
        var offset = req.query.page;
        var pageSize = req.query.pageSize;
        var offset = (offset - 1) * pageSize;
        var playerName = req.query.playerName;

        db.all("SELECT * from notification where player='" + playerName + "' and message !='' order by dateTime desc LIMIT  " + pageSize + " OFFSET " + offset, function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 400, null, err)
            } else {
                responseHandler.send(req, res, 'success', 200, rows, null)
            }
        });
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.")
    }
});

router.put('/setReadNotifications', function(req, res, next) {
    var playerName = req.body.playerName;
    if (playerName) {
        db.all("UPDATE notification SET isRead='yes' where player='" + playerName + "'", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 500, null, err)
            } else {
                responseHandler.send(req, res, 'success', 200, null, err)
            }
        });
    } else {
        responseHandler.send(req, res, 'success', 200, null, null)
    }
});


router.get('/getProfile', function(req, res, next) {
    if (req.query.playerName) {

        var playerName = req.query.playerName;

        db.all("SELECT * from leaderboard where player='" + playerName + "'", function(err, rows) {
            if (err) {
                responseHandler.send(req, res, 'error', 400, null, err)
            } else {
                responseHandler.send(req, res, 'success', 200, rows, null)
            }
        });
    } else {
        responseHandler.send(req, res, 'error', 400, null, "Invalid required parameters.")
    }
});



module.exports = router;