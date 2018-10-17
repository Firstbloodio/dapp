const { app, BrowserWindow, session, Menu, ipcMain,shell } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const extensions = require('./extensions');
const exec = require('child_process').exec;
const LogHandler = require('./app/resources/library/log');

// enable/disable logs
const logger = LogHandler.getLogger(false, 'server');

function log(level, message){
  LogHandler.setLogs(logger, level, message);
}


var isWin = process.platform === "win32";

var AppPath = "", child = "";

if(isWin){
  AppPath = "resources/app/";
  child = exec('node ./node_modules/pm2/bin/pm2 start app/resources/app.js', {async:true, cwd: AppPath});
}else{
  AppPath = "/Applications/FirstBlood.app/Contents/Resources/app/";
  child = exec('node_mac_bin/bin/node ./node_modules/pm2/bin/pm2 start app/resources/app.js -i 1', {async:true, cwd: AppPath});
}

log("info","Node server child process start");

child.stdout.on('data', function(data) {
  log("info","Node server success response - " + data);
});

child.stderr.on('data', function(data) {
  log("info","Node server err response - " + data);
});

let mainWindow;
let isDev = true;

function createWindow() {
  // Load metamask
  extensions.loadMetamask(session, mainWindow, isDev);
  log("info","Electron app window created...");
  mainWindow = new BrowserWindow({
    'web-preferences': {'web-security': false},
    width: 1920,
    height: 1080,
    icon: __dirname + '/app/assets/images/firstblood.icns',
    title: 'FirstBlood'
  });  

  mainWindow.maximize();

  //mainWindow.webContents.openDevTools();

  mainWindow.on('close', () => {
    mainWindow.webContents.send('stop-server');
    log("info","Electron app window closed & stopped server...");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  var template = [{
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  
  setTimeout(function(){
    indexPath = path.join(`brave/${__dirname}`, '/app/frontend/index.html');
  
    mainWindow.loadURL(url.format({
      pathname: indexPath,
      protocol: 'chrome',
      slashes: true
    }));
  }, 1500);    
}

ipcMain.on('new-window', function(event,data){
    shell.openExternal(data);
})


app.on("ready", createWindow);
app.on("browser-window-created", function (e, window) {
  //window.setMenu(null);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    stopServer();
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

function stopServer(){
  var stopChild = "";

  if(isWin){
    stopChild = exec('node ./node_modules/pm2/bin/pm2 kill', {async:true, cwd: AppPath});
  }else{
    stopChild = exec('node_mac_bin ./node_modules/pm2/bin/pm2 kill', {async:true, cwd: AppPath});
  }

  log("info","Node server child process end");

  stopChild.stdout.on('data', function(data) {
    log("info","Node server kill success response - " + data);
  });

  stopChild.stderr.on('data', function(data) {
    log("info","Node server kill err response - " + data);
  });
}