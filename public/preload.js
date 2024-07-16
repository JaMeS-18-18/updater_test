const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	receive: (channel, func) => {
		let validChannels = ["fromMain"];
		if (validChannels.includes(channel)) {
			// Deliberately strip event as it includes `sender` 
			ipcRenderer.on(channel, (event, ...args) => func(...args));
		}
		// if (channel === 'listenUsb') {
		// 	// Deliberately strip event as it includes `sender` 
		// 	ipcRenderer.on(channel, (event, ...args) => func(...args));
		// }
	},
	appApi: {
		quitApp() {
			ipcRenderer.send('app-quit');
		},
		generateSha1(arg) {
			return ipcRenderer.sendSync('generate-sha1', arg)
		},
		cmdCommand(arg) {
			return new Promise((resolve) => {
				ipcRenderer.once('cmd-command-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('cmd-command', arg);
			});
		},
		cmdPrinter(arg) {
			return new Promise((resolve) => {
				ipcRenderer.once('cmd-printer-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('cmd-printer', arg);
			});
		},
		cmdDeletePrinterJob(arg) {
			ipcRenderer.send('cmd-delete-printer-job', arg);
		},
		openRemoteAccess(arg) {
			ipcRenderer.send('open-remote-access', arg)
		},
		getAppVersion() {
			return ipcRenderer.sendSync('app-version')
		},
		checkUpdate() {
			return ipcRenderer.send('check-update')
		},
		windowMinimize() {
			return ipcRenderer.send('window-minimize')
		},
		windowMaximize() {
			return ipcRenderer.send('window-maximize')
		},
		windowClose() {
			return ipcRenderer.send('window-close')
		},
		print(arg, receiptPrinter) {
			ipcRenderer.send('print', arg, receiptPrinter);
		},
		getPrintersList() {
			return ipcRenderer.send('getPrintersList');
		},
		uploadExcelToLocalDisk(args) {
			ipcRenderer.send('upload-excel', args);
		},
		uploadImageToLocalDisk(image, oldImagePath) {
			return new Promise((resolve) => {
				ipcRenderer.once('upload-image-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('upload-image', image, oldImagePath)
			});
		},
	},
	dbApi: {
		getUnsyncCheques() {
			return new Promise((resolve) => {
				ipcRenderer.once('unsync-cheques-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('unsync-cheques', localStorage.getItem('username'));
			});
		},
		getUnsyncDeletedProducts() {
			return new Promise((resolve) => {
				ipcRenderer.once('unsync-deleted-products-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('unsync-deleted-products');
			});
		},
		insertProducts(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-products-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-products', arg);
			});
		},
		insertCheques(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-cheques-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-cheques', arg);
			});
		},
		insertClients(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-clients-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-clients', arg);
			});
		},
		insertOrganizations(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-organizations-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-organizations', arg);
			});
		},
		insertAgents(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-agents-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-agents', arg);
			});
		},
		insertUoms(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-uoms-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-uoms', arg);
			});
		},
		insertDeletedProducts(arg) {
			return new Promise((resolve, reject) => {
				ipcRenderer.once('insert-deleted-products-result', (_, error) => {
					if (error) {
						reject(error)
					} else {
						resolve();
					}
				});
				ipcRenderer.send('insert-deleted-products', arg);
			});
		},
		getCheques() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-cheques-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-cheques');
			});
		},
		getOrganizations() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-organizations-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-organizations');
			});
		},
		getAgents() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-agents-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-agents');
			});
		},
		getProducts() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-products-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-products');
			});
		},
		getProductsAll() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-products-all-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-products-all');
			});
		},
		getClients() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-clients-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-clients');
			});
		},
		findProducts(barcode, barcodeScales, productGroupingBool, byName = false) {
			return new Promise((resolve) => {
				ipcRenderer.once('search-products-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('search-products', barcode, barcodeScales, productGroupingBool, byName);
			});
		},
		findProductsByName(arg) {
			return new Promise((resolve) => {
				ipcRenderer.once('search-products-by-name-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('search-products-by-name', arg);
			});
		},
		getProductsLimited() {
			return new Promise((resolve) => {
				ipcRenderer.once('get-products-limited-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('get-products-limited');
			});
		},
		deleteProducts() {
			ipcRenderer.send('delete-products');
		},
		deleteCheques() {
			ipcRenderer.send('delete-cheques');
		},
		deleteChequesAll() {
			ipcRenderer.send('delete-cheques-all');
		},
		deleteDeletedProducts() {
			ipcRenderer.send('delete-deleted-products');
		},
		deleteClients() {
			ipcRenderer.send('delete-clients');
		},
		deleteOrganizations() {
			ipcRenderer.send('delete-organizations');
		},
		deleteAgents() {
			ipcRenderer.send('delete-agents');
		},
		updateChequeStatus(chequeNumber, chequeId) {
			return new Promise((resolve) => {
				ipcRenderer.once('update-cheques-status-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('update-cheques-status', chequeNumber, chequeId);
			});
		},
		updateChequesListStatus(arr) {
			return new Promise((resolve) => {
				ipcRenderer.once('update-cheques-status-list-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('update-cheques-list-status', arr);
			});
		},
		updateDeletedProductsStatus(arr) {
			return new Promise((resolve) => {
				ipcRenderer.once('update-deleted-products-status-result', (_, arg) => {
					resolve(arg);
				});
				ipcRenderer.send('update-deleted-products-status', arr);
			});
		},
		updateChequesSystemId(chequeNumber, chequeId, systemId) {
			ipcRenderer.send('update-cheques-systemId', chequeNumber, systemId);
		},
	},
	ipcRenderer: ipcRenderer,
})