const express = require('express');
const router = express.Router();
const _ = require('underscore');
const responseHandler = require('../library/responseHandler');
const sqlite3 = require('sqlite3').verbose();
var db = "";
var isWin = process.platform === "win32";

if(isWin){
    db = new sqlite3.Database('firstblood.db');    
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}


router.get('/findMatch', (req, res, next) => {

    getUserMMR(req.query.playerName).then((data, err1) => {

        if (!err1 && data.length > 0) {

            let mmr = data[0].mmr
            getNearestMMR(req.query.playerName, mmr).then(async (rows, err) => {

                if (!err && rows.length > 0) {
                    for (var i = 0; i < rows.length; i++) {

                        let openChallenge = await getOpenChallenge(rows[i].player);

                        if (openChallenge.length > 0) {
                            responseHandler.send(req, res, 'success', 200, openChallenge, null);
                            break;
                        } else {
                            if (rows.length - 1 == i)
                                responseHandler.send(req, res, 'error', 200, null, 'No user Found');
                        }
                    }
                } else {
                    sendResponse(req, res, err);
                }
            })
        } else {
            sendResponse(req, res, err1);
        }
    });
});



/**
 * @method - getNearestMMR
 * @desc - get nearest MMR value 
 */
const getNearestMMR = (playerName, mmr) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT mmr,player, ABS( mmr - " + mmr + " ) AS nearest FROM leaderboard where player!='" + playerName + "' ORDER BY nearest", function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

/**
 * @method - getUserMMR
 * @desc - get MMR of specifice user
 */
const getUserMMR = (playerName) => {
    return new Promise((resolve, reject) => {
        db.all("select mmr from leaderboard where player='" + playerName + "'", function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

/**
 * @method - sendResponse
 * @desc - send Response 
 */
const sendResponse = (req, res, err) => {
    if (err) {
        responseHandler.send(req, res, 'error', 500, null, err)

    } else {
        responseHandler.send(req, res, 'error', 200, null, 'No user Found')

    }
}

/**
 * @method - getOpenChallenge
 * @desc - return data of a user has open challenges 
 */
const getOpenChallenge = (playerName) => {
    return new Promise((resolve, reject) => {
        db.all("select * from challenge_details where event='Fund' AND key1='" + playerName + "'", function(err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

module.exports = router;