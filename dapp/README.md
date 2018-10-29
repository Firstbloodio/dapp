# FirstBlood Dapp Installation Guide

This project was generated with Node JS, Electron Framework & Angular JS. This guide explains how to build the project from source.

## Constants

* Frontend File path for change contract address, etherscanHost, contract abi's, web3Provider
`app/frontend/modules/common/constants/common.constant.js`, and also `app/resources/routes/cron.js`

* Frontend File path for change SERVER_URL
`app/frontend/app.js`

* Backend File path for change contract address, default port
`app/resources/routes/constant.js`

## Setup

* Run `npm install` in root directory
* Run `npm install` in `app/resources` directory
* Run `bower install` in `app/frontend` directory
* To launch application in local system without build, Run `npm start`

## Version number

Update the version number in `app/frontend/modules/common/views/left_side_menu.html` and `package.json`

## Create build for Windows

After setup, run `npm run build.win`

## Create build for Mac

After setup, run `npm run build.mac`

## Database location

 * On Windows, `C:\Users\[USERNAME]\AppData\Local\Programs\FirstBlood\resources\app\firstblood.db`

## Log file location

 * On Windows, `C:\Users\[USERNAME]\.pm2\logs`
 * On Linux, `/Users/[USERNAME]/.pm2/logs`

## Server Info

* Server running on port 3000 - `http://localhost:3000`
* Change default port (3000) from `app/resources/routes/constant.js`

## Contract Info

Contracts json file path - `app/resources/assets/files/compiled.json`

## Application Support

Currently build supported from Node version 5.x.x to 10.x.x & x64 architecture.

* Node JS version support

When any new node version (like 11.x.x or 12.x.x) will release then you have to append command `npm rebuild sqlite3 --target=11.0.0` or `npm rebuild sqlite3 --target=12.0.0` in app/resources/package.json postinstall script, and run npm install on this directory. After that on root directory run `npm run build.mac` or `npm run build.win` command to create a build to add support a new versions.

* Architecture support

Current application does not support x32/x86 architecture. You have to create different build for different architecture. Setup application on x32/x64/x86 system and then run  `npm run build.mac` or `npm run build.win` command to create a build to add support for different architecture.
