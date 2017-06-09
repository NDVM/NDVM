////////////////////////////////////////////////////////////////////////////////
// Main file called by electron framework
////////////////////////////////////////////////////////////////////////////////
const server = require('./server.js');
const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

let mainWindow;

function createWindow () {
  var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
  var screenWidth  = Math.round(screenSize.width  * 0.805); // 80.5%
  var screenHeight = Math.round(screenSize.height * 0.805); // 80.5%

  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    title: "NDVM"
  });

  mainWindow.loadURL('http://127.0.0.1:'+ server.port);

  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    app.quit();
})
