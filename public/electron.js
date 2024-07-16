const { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
const XLSX = require('xlsx');
const exec = require('child_process').exec;
const execFile = require("child_process").execFile
//const usb = require('usb');
require('./sql');
var crypto = require('crypto')
const { getTime } = require('date-fns')
const isDev = !app.isPackaged

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

let mainWindow;
let printerWindow;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
if (isDev) {
	log.transports.file.resolvePath = () => path.join(__dirname, '../logs/main.log');
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance, we should focus our window.
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore()
			mainWindow.focus()
		}
	})
}

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		show: false,
		frame: false,
		autoHideMenuBar: true, // this hide menu but save functionality
		width: 1200,
		height: 700,
		minWidth: 1200,
		minHeight: 700,
		webPreferences: {
			//webSecurity: isDev ? true : false,
			webSecurity: false,
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.join(__dirname, "/preload.js")
		},
	});
	mainWindow.maximize();
	mainWindow.show();

	printerWindow = new BrowserWindow({
		show: isDev ? true : false,
		webPreferences: {
			webSecurity: false,
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	});
	printerWindow.loadURL(`file:///${__dirname}/print/cheque.html`)

	// and load the index.html of the app.
	if (isDev) {
		//mainWindow.webContents.openDevTools();
		mainWindow.loadURL('http://localhost:3000');
	} else {
		mainWindow.loadURL(`file:///${__dirname}/index.html`);
	}

	globalShortcut.register('Alt+F4', () => {
		console.log('Electron loves global shortcuts!')
	})

	mainWindow.once('ready-to-show', () => {
		// webusb.addEventListener('connect', showDevices);
		// webusb.addEventListener('disconnect', showDevices);

		if (isDev) {
			installExtension(REACT_DEVELOPER_TOOLS)
				.then((name) => console.log(`Added Extension:  ${name}`))
				.catch((err) => console.log('An error occurred: ', err));

			installExtension(REDUX_DEVTOOLS)
				.then((name) => console.log(`Added Extension:  ${name}`))
				.catch((err) => console.log('An error occurred: ', err));
		}

		mainWindow.show();
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		app.quit()
	})
}

app.on('ready', createWindow);
// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// webusb.removeEventListener('connect', showDevices);
	// webusb.removeEventListener('disconnect', showDevices);

	if (process.platform !== 'darwin') {
		app.quit()
	}
});
app.on('activate', function () {
	if (mainWindow === null) {
		createWindow()
	}
});

// *********************** USB ***********************
// const webusb = new usb.WebUSB({
// 	allowAllDevices: true
// });

// const showDevices = async () => {
// 	const devices = await webusb.getDevices();
// 	mainWindow.webContents.send("listenUsb", devices);
// };
// *********************** USB ***********************

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('open-remote-access', (event, args) => {
	if (args === 'ammyadmin') {
		execFile(`${path.resolve()}\\resources\\extraResources\\AmmyAdmin.exe`, function (err, data) { });
	} else {
		execFile(`${path.resolve()}\\resources\\extraResources\\AnyDesk.exe`, function (err, data) { });
	}
});

ipcMain.on('generate-sha1', (event, args) => {
	var timestamp = getTime(new Date())
	const code = `${timestamp}${args.merchant_secret_key}`

	const Hash = crypto.createHash('sha1').update(code).digest('hex')

	//console.log(`3952:${Hash}:${timestamp}`)
	if (args.type === "uzum") {
		event.returnValue = `${args.merchant_id}:${Hash}:${timestamp}`;
	}
	if (args.type === "click") {
		event.returnValue = `${args.merchant_service_user_id}:${Hash}:${timestamp}`;
	}
});

ipcMain.on('cmd-command', (event, args) => {
	exec(`C:/Arcus2/CommandLineTool/bin/CommandLineTool.exe /o1 /a${args * 100} /c860`, function (err, data) {
		var filePath = path.join('C:/Arcus2', 'chek.out')
		fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
			if (!err) {
				event.reply('cmd-command-result', data);
			} else {
				console.log(err);
			}
		});
	});
});

ipcMain.on("check-update", () => {
	if (isDev) {
		Object.defineProperty(app, 'isPackaged', {
			get() {
				return true;
			}
		});
		autoUpdater.updateConfigPath = path.join(__dirname, '../dev-app-update.yml');
		autoUpdater.checkForUpdatesAndNotify();
	} else {
		autoUpdater.setFeedURL({
			"provider": "generic",
			"url": "https://my.idokon.uz/download/"
		})
		autoUpdater.checkForUpdatesAndNotify();
	}
});

ipcMain.on("window-close", () => {
	app.quit()
});

ipcMain.on('window-maximize', () => {
	if (mainWindow.isMaximized()) {
		mainWindow.unmaximize();
	} else {
		mainWindow.maximize();
	}
});

ipcMain.on('window-minimize', () => {
	mainWindow.minimize();
});

ipcMain.on('app-version', (event) => {
	event.returnValue = app.getVersion()
});

ipcMain.on('restart-app', () => {
	autoUpdater.quitAndInstall();
});

ipcMain.on('open-file', (event, args) => {
	dialog.showOpenDialog({ properties: ['openFile'] }).then(response => {
		const fileContent = fs.readFileSync(response.filePaths[0]).toString()
		console.log(fileContent);
	});
});

ipcMain.on('upload-excel', (event, args) => {
	const pathDesktop = app.getPath('desktop') + '/' + args.chequeNumber + '.xlsx'
	XLSX.writeFile(args.data, pathDesktop);

	if (args.openExcelFile) {
		shell.openPath(pathDesktop)
	}
});

ipcMain.on('upload-image', (event, image, oldImagePath) => {
	var data = image.replace(/^data:image\/\w+;base64,/, "");
	var buf = Buffer.from(data, 'base64');
	const random = Math.floor(Math.random() * 999999)
	const path = app.getPath('userData') + '/image' + random + '.png'
	fs.writeFile(path, buf, function (err) {
		if (!err)
			event.reply('upload-image-result', path.replace(/\\/g, "/"));
	});
});

ipcMain.on('getPrintersList', (event) => {
	mainWindow.webContents.getPrintersAsync().then(response => {
		event.returnValue = response
	})
});

ipcMain.on('print', (event, arg, receiptPrinter) => {
	printerWindow.webContents.send('on-print', arg, receiptPrinter);
	// ipcMain.once('on-print-result', (event, sum) => {
	// 	doJobWithResult(sum)
	// })

	//eventParent.reply('print-result', data);
});

ipcMain.on('open-print', (event, receiptPrinter) => {
	mainWindow.webContents.getPrintersAsync().then(response => {
		let printersInfo = response
		let printer = ""

		printer = printersInfo.filter(printer => printer.name === receiptPrinter)[0];
		if (!printer) {
			printer = printersInfo[0]
		}
		const options = {
			silent: true,
			deviceName: printer.name
		}
		//console.log(printer)
		printerWindow.webContents.print(options, (success, error) => {
			//console.log(success)
			//console.log(error)
		})
	})
});

ipcMain.on('cmd-printer', (event, args) => {
	console.log(args)
	//wmic printer list brief	
	exec(`Get-PrintJob -PrinterName "${args}" | Format-Table`, { 'shell': 'powershell.exe' }, function (err, data) {
		event.reply('cmd-printer-result', data);
	});
});

ipcMain.on('cmd-delete-printer-job', (event, args) => {
	for (let i = 0; i < args.length; i++) {
		exec(`Remove-PrintJob -PrinterName "${args[i].printerName}" -ID ${args[i].id}`, { 'shell': 'powershell.exe' }, function (err, data) {
			//
		});
	}
});

/* ELECTRON UPDATE */
function sendStatusToWindow(downloadDetail) {
	mainWindow.webContents.send("fromMain", downloadDetail);
}

autoUpdater.on('checking-for-update', () => {
	var downloadDetail = {
		message: "checking_update_and_connection",
		updateExist: null,
		speed: 0,
		percentage: 0,
		downloaded: 0,
		needDownload: 0,
	}
	sendStatusToWindow(downloadDetail);
})
autoUpdater.on('update-available', (info) => {
	var downloadDetail = {
		message: "found_update",
		updateExist: true,
		speed: 0,
		percentage: 0,
		downloaded: 0,
		needDownload: 0,
		version: info.version,
	}
	sendStatusToWindow(downloadDetail);
})
autoUpdater.on('update-not-available', (info) => {
	var downloadDetail = {
		message: "you_have_latest_version",
		updateExist: false,
		speed: 0,
		percentage: 0,
		downloaded: 0,
		needDownload: 0,
	}
	sendStatusToWindow(downloadDetail);
})

autoUpdater.on('error', (err) => {
	sendStatusToWindow('Error in auto-updater. ' + err);
})

autoUpdater.on('download-progress', (progressObj) => {
	var downloadDetail = {
		message: "downloading_binaries",
		updateExist: null,
		speed: Number(progressObj.bytesPerSecond / 125000).toFixed(2),
		percentage: progressObj.percent.toFixed(2),
		needDownload: Number(progressObj.total / 1000000).toFixed(2),
		downloaded: Number(progressObj.transferred / 1000000).toFixed(2),
	}
	sendStatusToWindow(downloadDetail);
})

autoUpdater.on('update-downloaded', (event) => {
	var downloadDetail = {
		message: "loading_complete",
		updateExist: 5,
		speed: 0,
		percentage: 0,
		downloaded: 0,
		needDownload: 0,
	}
	sendStatusToWindow(downloadDetail);
	autoUpdater.quitAndInstall(isSilent = true, isForceRunAfter = true)
});