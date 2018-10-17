var sqlite3 = require('sqlite3').verbose();
var db = "";
var isWin = process.platform === "win32";

if(isWin){
    db = new sqlite3.Database('firstblood.db');
}else{
    db = new sqlite3.Database(process.env.HOME+'/firstblood.db');
}

db.serialize(function() {
	  // db.run("DROP TABLE IF EXISTS challenge_logs;");
    // db.run("DROP TABLE IF EXISTS challenge_details;");
    // db.run("DROP TABLE IF EXISTS leaderboard;");
    // db.run("DROP TABLE IF EXISTS witness_jury;");
    // db.run("DROP TABLE IF EXISTS configuration;");
    // db.run("DROP TABLE IF EXISTS cron_logs;");
    // db.run("DROP TABLE IF EXISTS my_jobs;");


    // Challenge Facory logs table
    db.run("CREATE TABLE if not exists challenge_factory_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, blockNumber INTEGER, transactionHash TEXT, fromAddress Text, toAddress Text, transactionIndex INTEGER, logIndex INTEGER, event TEXT, address TEXT, arguments TEXT, challengeCurrentBlockNumber INTEGER, resolved INTEGER);");

    db.run("CREATE TABLE if not exists cron_blocks (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, lastBlockNumber INTEGER)");


	// Configuration table
	db.run("CREATE TABLE if not exists configuration (playerName TEXT, disclaimerAgreed INTEGER, referrerEthereumAddress TEXT, ethereumPrivateKey TEXT, steamId TEXT, witnessName TEXT, steamPassword TEXT)");

	// Challenge Logs table
    db.run("CREATE TABLE if not exists challenge_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT, blockHash TEXT, blockNumber INTEGER, logIndex INTEGER, transactionHash TEXT, transactionIndex INTEGER, transactionLogIndex TEXT, date TEXT, event TEXT, args TEXT);");

    // Challenge details table
    db.run("CREATE TABLE if not exists challenge_details (id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT, event TEXT, user1 TEXT, key1 TEXT, user2 TEXT, key2 TEXT, date TEXT, host TEXT, hostKey TEXT, witnessJuryRequestNum TEXT, witnessJuryKey TEXT, isFunded TEXT, amount INTEGER, lastBlockNumber INTEGER, profileImageKey1 TEXT, profileImageKey2 TEXT, winner TEXT);");// Challenge details table

    // Leadeboard table
    db.run("CREATE TABLE if not exists leaderboard (id INTEGER PRIMARY KEY AUTOINCREMENT, player TEXT, wins INTEGER, losses INTEGER, mmr INTEGER, winStreak INTEGER, winRate INTEGER, totalChallenges INTEGER, reputation INTEGER);");

    // Notification table
    db.run("CREATE TABLE if not exists notification (id INTEGER PRIMARY KEY AUTOINCREMENT, player TEXT, address TEXT, type TEXT, message TEXT, username TEXT, transactionHash TEXT, isRead TEXT, dateTime TEXT);");

    //WitnessJury table
    db.run("CREATE TABLE if not exists witness_jury (id INTEGER PRIMARY KEY AUTOINCREMENT, requestNum INTEGER, fromAddress TEXT, toAdress TEXT, blockNumber INTEGER, transactionHash TEXT, date TEXT, event TEXT, transactionIndex TEXT, logIndex TEXT, amount INTEGER, answer TEXT, winner TEXT, juror TEXT, vote TEXT, arguments TEXT);");
    //cronLog table
    db.run("CREATE TABLE if not exists cron_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, dateTime TEXT, status TEXT);");

    //myJob table
    db.run("CREATE TABLE if not exists my_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, job TEXT, transactionHash TEXT, requestNum INTEGER, steamId TEXT, amount TEXT, ethereumPrivateKey TEXT);");
});
