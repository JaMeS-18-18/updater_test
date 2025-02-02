const { app, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const path = require('path');
const isDev = !app.isPackaged
var migrationDB = null
var db = null
var dbFile = null
var migrationFilesPath = null

// if (isDev) {
// 	dbFile = path.resolve(__dirname, '../gitignore/db.sqlite3')
// 	db = new sqlite3.Database(dbFile, (err) => {
// 		if (err) console.error('Database opening error: ', err);
// 	});
// 	migrationFilesPath = path.resolve(__dirname, '../extraResources/migrations/')
// } else {
	dbFile = path.join(app.getPath('userData'), 'db.sqlite3').toString()
	db = new sqlite3.Database(dbFile, (err) => {
		if (err) console.error('Database opening error: ', err);
	});
	migrationFilesPath = path.join(path.dirname(__dirname), '../extraResources/', 'migrations');
// }

(async () => {
	// open the database
	migrationDB = await sqlite.open({
		filename: dbFile,
		driver: sqlite3.Database
	})
	await migrationDB.migrate({
		force: false,
		table: 'migrations',
		migrationsPath: migrationFilesPath
	})
})()

ipcMain.on('unsync-cheques', (event, login) => {
	db.all(`SELECT * FROM cheques WHERE status = 0 AND login = '${login}' ORDER BY id`, function (err, rows) {
		if (!err) {
			event.reply('unsync-cheques-result', (err && err.message) || rows);
		}
	});
});

ipcMain.on('unsync-deleted-products', (event) => {
	db.all(`SELECT * FROM deleted_products WHERE status = 0 ORDER BY id`, function (err, rows) {
		if (!err) {
			event.reply('unsync-deleted-products-result', (err && err.message) || rows);
		}
	});
});

ipcMain.on('get-cheques', (event) => {
	db.all("SELECT * FROM cheques", function (err, rows) {
		event.reply('get-cheques-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-organizations', (event) => {
	db.all("SELECT * FROM organizations", function (err, rows) {
		event.reply('get-organizations-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-agents', (event) => {
	db.all("SELECT * FROM agents", function (err, rows) {
		event.reply('get-agents-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-products', (event) => {
	db.all("SELECT * FROM products LIMIT 100", function (err, rows) {
		event.reply('get-products-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-products-all', (event) => {
	db.all("SELECT * FROM products", function (err, rows) {
		event.reply('get-products-all-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-clients', (event) => {
	db.all("SELECT * FROM clients", function (err, rows) {
		event.reply('get-clients-result', (err && err.message) || rows);
	});
});

ipcMain.on('get-products-limited', (event) => {
	db.all("SELECT * FROM products LIMIT 30", function (err, rows) {
		event.reply('get-products-limited-result', (err && err.message) || rows);
	});
});

ipcMain.on('search-products', (event, barcode, barcodeScales, productGroupingBool, byName) => {
	if (byName) {
		let sql = `SELECT 
				*,
				salePrice as originalSalePrice 
			FROM products 
			WHERE barcode = '${barcode.replace(/\'/g, "")}'
			OR productNameLower LIKE '%${barcode.toLowerCase().replace(/\'/g, "''").replace(/ /g, "%")}%'
			OR artikul LIKE '%${barcode.toLowerCase().replace(/\'/g, "''").replace(/ /g, "%")}%'
			OR barcode LIKE '%${barcode.toLowerCase().replace(/\'/g, "''").replace(/ /g, "%")}%' `;

		db.get(sql, function (err, row) {
			if (err) {
				event.reply('search-products-result', { 'sqlError': true, 'message': "", row: {} });
			} else {
				event.reply('search-products-result', { 'sqlError': false, 'message': "", row: row });
			}
		});
		return;
	}

	if (!barcodeScales) {
		let sql = `SELECT 
			*,
			salePrice as originalSalePrice 
		FROM products 
		WHERE barcode = ${JSON.stringify(barcode)}`;
		db.get(sql, function (err, row) {
			if (err) {
				event.reply('search-products-result', { 'sqlError': true, 'scaleProduct': false, row: row });
			} else {
				if (productGroupingBool && row && row.productGroupId != 0) { // if product have grouping
					let sql = 'SELECT * FROM products WHERE productId = ' + row.productGroupId;
					db.get(sql, function (err, row2) {
						if (err) {
							event.reply('search-products-result', { 'sqlError': true, 'scaleProduct': false, row: row2 });
						} else {
							event.reply('search-products-result', { 'sqlError': false, 'scaleProduct': false, 'group': true, row: row2 });
						}
					});
					return;
				}
				event.reply('search-products-result', { 'sqlError': false, 'scaleProduct': false, row: row });
			}
		});
	} else { // if scale product this search
		let sql = 'SELECT * FROM products WHERE barcodeScales = ' + barcodeScales;
		db.get(sql, function (err, row) {
			if (err) {
				event.reply('search-products-result', { 'sqlError': true, 'scaleProduct': true, row: row });
			} else {
				event.reply('search-products-result', { 'sqlError': false, 'scaleProduct': true, row: row });
			}
		});
	}
});

ipcMain.on('search-products-by-name', (event, arg) => {
	var search
	if (arg.searchExact) {
		search = arg.search.toLowerCase().replace(/\'/g, "''")
	} else {
		search = arg.search.toLowerCase().replace(/\'/g, "''").replace(/ /g, "%")
	}

	let sql = `SELECT * FROM products 
		WHERE barcode = '${arg.search.replace(/\'/g, "")}'
		OR productNameLower LIKE '%${search}%'
		OR artikul LIKE '%${search}%'
		OR barcode LIKE '%${search}%' `;

	db.all(sql, function (err, row) {
		if (err) {
			event.reply('search-products-by-name-result', { 'sqlError': true, 'message': "", row: [] });
		} else {
			event.reply('search-products-by-name-result', { 'sqlError': false, 'message': "", row: row });
		}
	});
});

ipcMain.on('insert-products', (event, arg) => {
	if (arg.length === 0) {
		event.reply('insert-products-result', 'Отсутствуют продукты');
	}

	let sql = `INSERT INTO products(
		balance, 
		balanceId,
		barcode, 
		barcodeScales,
		currencyId, 
		modificationList,
		price,
		productGroupId,
		productId,
		productImageUrl,
		productName,
		productNameLower,
		salePrice,
		unitList,
		uomId,
		uomName,
		vat,
		wholesalePrice,
		artikul,
		gtin,
		ofdUomId,
		originalPrice,
		bankPrice,
		marking,
		organizationTin,
		packageCode,
		packageName,
		promotionProduct,
		promotionProductName,
		promotionProductBarcode,
		promotionProductQuantity,
		promotionQuantity,
		productBox,
		productBoxItemList,
		secondQuantity,
		secondUomId,
		secondUomName
		) VALUES`
	for (let i = 0; i < arg.length; i++) {
		sql += `(
			'${arg[i]['balance'] ?? ''}',
			'${arg[i]['balanceId'] ?? ''}',
			'${arg[i]['barcode'] ?? ''}',
			'${arg[i]['barcodeScales'] ?? ''}',
			'${arg[i]['currencyId'] ?? ''}',
			'${JSON.stringify(arg[i]['modificationList'])}',
			'${arg[i]['price'] ?? 0}',
			'${arg[i]['productGroupId'] ?? ''}',
			'${arg[i]['productId'] ?? ''}',
			'${arg[i]['productImageUrl'] ?? ''}',
			'${arg[i]['productName']?.replace(/'/g, `''`)?.replace(/"/g, `''`)}',
			'${arg[i]['productName']?.replace(/'/g, `''`)?.replace(/"/g, `''`)?.toLowerCase()}',
			'${arg[i]['salePrice'] ?? 0}',
			'${JSON.stringify(arg[i]['unitList'])}',
			'${arg[i]['uomId'] ?? ''}',
			'${arg[i]['uomName'] ?? ''}',
			'${arg[i]['vat'] ?? 0}',
			'${arg[i]['wholesalePrice'] ?? 0}',
			'${arg[i]['artikul'] ?? ''}',
			'${arg[i]['gtin'] ?? ''}',
			'${arg[i]['ofdUomId'] ?? ''}',
			'${arg[i]['originalPrice'] ?? 0}',
			'${arg[i]['bankPrice'] ?? 0}',
			'${arg[i]['marking'] ? 1 : 0}',
			'${arg[i]['organizationTin'] ?? ''}',
			'${arg[i]['packageCode'] ?? ''}',
			'${arg[i]['packageName']?.replace(/'/g, `''`)?.replace(/"/g, `''`)}',
			'${arg[i]['promotionProduct'] ? 1 : 0}',
			'${arg[i]['promotionProductName'] ?? ''}',
			'${arg[i]['promotionProductBarcode'] ?? ''}',
			'${arg[i]['promotionProductQuantity'] ?? ''}',
			'${arg[i]['promotionQuantity'] ?? ''}',
			'${arg[i]['productBox'] ? 1 : 0}',
			'${arg[i]['productBoxItemList'] ? JSON.stringify(arg[i]['productBoxItemList']) : ''}',
			'${arg[i]['secondQuantity']}',
			'${arg[i]['secondUomId']}',
			'${arg[i]['secondUomName']}'
		)`
		if (i !== arg.length - 1) {
			sql += ","
		}
	}

	db.run(sql, function (err) {
		if (!err) {
			event.reply('insert-products-result', null);
		} else {
			event.reply('insert-products-result', err.message);
		}
	});
});

ipcMain.on('insert-cheques', (event, arg) => {
	if (arg.itemsList.length === 0) {
		event.reply('insert-cheques-result', 'Отсутствуют товары');
		return
	}
	if (!arg?.login) {
		event.reply('insert-cheques-result', 'Ошибка в формировании чека');
		return
	}
	if (!arg['fiscalSign']) {
		arg['appletVersion'] = ''
		arg['dateTime'] = ''
		arg['fiscalSign'] = ''
		arg['receiptSeq'] = ''
		arg['qRCodeURL'] = ''
		arg['terminalID'] = ''
	}

	if (arg['fiscalSign']) {
		db.all(`
			SELECT 
				chequeTimeEnd
			FROM cheques 
			WHERE status = 0 
			AND fiscalSign is not null
			ORDER BY id DESC LIMIT 1`, function (err, rows) {
			if (rows.length) {
				var now = rows[0]['chequeTimeEnd'];
				var difference = Math.floor(((Date.now() - now) / 1000) / 60 / 60);
				if (difference >= 24) {
					event.reply('insert-cheques-result', 'Офлайн больше 24 часа включите интернет.');
					return
				}
			}
		});
	}

	for (let i = 0; i < arg['itemsList'].length; i++) {
		arg['itemsList'][i]['productName'] = arg['itemsList'][i]['productName'].replace(/\'/g, "''")
		arg['itemsList'][i].productNameLower = arg['itemsList'][i].productNameLower?.replace(/\'/g, "''")
		if (arg['itemsList'][i]['packageName']) {
			arg['itemsList'][i]['packageName'] = arg['itemsList'][i]['packageName']?.replace(/'/g, `''`)?.replace(/"/g, `''`)
		}
	}

	let sql = `INSERT INTO cheques
	(
		login, 
		status, 
		cashboxId,
		change,
		chequeDate, 
		chequeNumber, 
		clientId,
		clientAmount,
		clientComment, 
		saleCurrencyId,
		currencyId,
		discountAmount,
		itemsList, 
		note, 
		ofdTransactions,
		offline,
		outType, 
		paid, 
		posId,
		shiftId,
		totalPrice, 
		transactionId, 
		transactionsList,
		cashboxVersion,
		chequeTimeStart,
		chequeTimeEnd,
		appletVersion, 
		dateTime, 
		fiscalSign,
		receiptSeq,
		qRCodeURL,
		terminalID,
		cashierName,
		organizationId,
		organizationAmount,
		organizationComment,
		loyaltyClientId,
		loyaltyClientLogin,
		loyaltyClientName,
		loyaltyClientAmount,
		loyaltyBonus,
		loyaltyBonusPercentage,
		agentLogin,
		chequeOnlineId,
		payedWith,
		payedWithDiscount,
		clientCurrencyId,
		clientReturnDate,
		organizationReturnDate,
		organizationCurrencyId
	) VALUES 
	(
		'${arg['login']}',
		${0},
		${arg['cashboxId']},
		${arg['change']},
		${arg['chequeDate']},
		${arg['chequeNumber']},
		${arg['clientId']},
		${arg['clientAmount']},
		'${arg['clientComment']}',
		'${arg['saleCurrencyId']}',
		'${arg['currencyId']}',
		'${arg['discountAmount'] ?? 0}',
		'${JSON.stringify(arg['itemsList'])}',
		'${arg['note']}',
		${null},
		${true},
		${arg['outType']},
		${arg['paid']},
		${arg['posId']},
		${arg['shiftId']},
		${arg['totalPrice']},
		'${arg['transactionId']}',
		'${JSON.stringify(arg['transactionsList'])}',
		'${arg['cashboxVersion']}',
		'${arg['chequeTimeStart']}',
		'${arg['chequeTimeEnd']}',
		'${arg['appletVersion']}',
		'${arg['dateTime']}',
		'${arg['fiscalSign']}',
		'${arg['receiptSeq']}',
		'${arg['qRCodeURL']}',
		'${arg['terminalID']}',
		'${arg['cashierName']?.replace(/'/g, `''`).replace(/"/g, `''`)}',
		'${arg['organizationId'] ?? ''}',
		'${arg['organizationAmount'] ?? ''}',
		'${arg['organizationComment']?.replace(/'/g, `''`).replace(/"/g, `''`) ?? ''}',
		'${arg['loyaltyClientId'] ?? ''}',
		'${arg['loyaltyClientLogin'] ?? ''}',
		'${arg['loyaltyClientName']?.replace(/'/g, `''`).replace(/"/g, `''`) ?? ''}',
		'${arg['loyaltyClientAmount'] ?? ''}',
		'${arg['loyaltyBonus'] ?? ''}',
		'${arg['loyaltyBonusPercentage'] ?? ''}',
		'${arg['agentLogin'] ?? ''}',
		'${arg['chequeOnlineId'] ?? ''}',
		'${arg['payedWith'] ?? ''}',
		'${arg['payedWithDiscount'] ?? ''}',
		'${arg['clientCurrencyId'] ?? ''}',
		'${arg['clientReturnDate'] ?? ''}',
		'${arg['organizationReturnDate'] ?? ''}',
		'${arg['organizationCurrencyId'] ?? ''}'
	)`;

	db.run(sql, function (err) {
		if (!err) {
			minusProductBalance(arg)
			event.reply('insert-cheques-result', null);
		} else {
			if (err.code === "SQLITE_CONSTRAINT") {
				event.reply('insert-cheques-result', 'Предотвращение дубликата.');
				return
			}
			event.reply('insert-cheques-result', err.message);
		}
	});
});

ipcMain.on('insert-uoms', (event, arg) => {
	db.run("DELETE FROM uoms", function (err) { });

	if (arg.length > 0) {
		let sql = "INSERT INTO uoms(id, ofdUomId, name) VALUES"
		for (let i = 0; i < arg.length; i++) {
			sql += "("
				+ arg[i]['id'] + ","
				+ arg[i]['ofdId'] + ","
				+ JSON.stringify(arg[i]['name']) + ")"
			if (i !== arg.length - 1) {
				sql += ","
			}
		}

		db.run(sql, function (err) {
			if (!err) {
				event.reply('insert-uoms-result', null);
			} else {
				event.reply('insert-uoms-result', err.message);
			}
		});
	}
});

ipcMain.on('insert-clients', (event, arg) => {
	if (arg.length > 0) {
		let sql = "INSERT INTO clients(clientId, name, phone1, phone2, comment) VALUES"
		for (let i = 0; i < arg.length; i++) {
			sql += "("
				+ JSON.stringify(arg[i]['clientId']) + ","
				+ JSON.stringify(arg[i]['name']) + ","
				+ JSON.stringify(arg[i]['phone1']) + ","
				+ JSON.stringify(arg[i]['phone2']) + ","
				+ JSON.stringify(arg[i]['comment']) + ")"
			if (i !== arg.length - 1) {
				sql += ","
			}
		}

		db.run(sql, function (err) {
			if (!err) {
				event.reply('insert-clients-result', null);
			} else {
				event.reply('insert-clients-result', err.message);
			}
		});
	}
});

ipcMain.on('insert-organizations', (event, arg) => {
	if (arg.length > 0) {
		let sql = "INSERT INTO organizations(organizationId, name, phone) VALUES"
		for (let i = 0; i < arg.length; i++) {
			sql += "("
				+ JSON.stringify(arg[i]['id']) + ","
				+ JSON.stringify(arg[i]['name']?.replace(/'/g, `''`)?.replace(/"/g, `''`)) + ","
				+ JSON.stringify(arg[i]['phone']) + ")"
			if (i !== arg.length - 1) {
				sql += ","
			}
		}

		db.run(sql, function (err) {
			if (!err) {
				event.reply('insert-organizations-result', null);
			} else {
				event.reply('insert-organizations-result', err.message);
			}
		});
	}
});

ipcMain.on('insert-agents', (event, arg) => {
	if (arg.length > 0) {
		let sql = "INSERT INTO agents(agentId, agentLogin, name) VALUES"
		for (let i = 0; i < arg.length; i++) {
			sql += `(
				${JSON.stringify(arg[i]['agentId'] ?? '')}, 
				${JSON.stringify(arg[i]['agentLogin'] ?? '')},
				${JSON.stringify(arg[i]['name'] ?? '')})`

			if (i !== arg.length - 1) sql += ","
		}

		db.run(sql, function (err) {
			if (!err) {
				event.reply('insert-agents-result', null);
			} else {
				event.reply('insert-agents-result', err.message);
			}
		});
	}
});

ipcMain.on('insert-deleted-products', (event, arg) => {
	if (arg.length === 0) {
		event.reply('insert-deleted-products', 'Отсутствуют продукты');
	}

	let sql = `INSERT INTO deleted_products(
		login, 
		posId, 
		cashboxId, 
		shiftId, 
		balanceId, 
		productId, 
		quantity, 
		totalPrice, 
		chequeDate, 
		saleCurrencyId, 
		status
		) VALUES`
	for (let i = 0; i < arg.length; i++) {
		var balanceId = ""
		if (arg[i]['balanceId']) {
			balanceId = arg[i]['balanceId']
		} else {
			balanceId = ""
		}

		sql += `(
			'${JSON.stringify(arg[i]['login'])}',
			'${arg[i]['posId']}',
			'${arg[i]['cashboxId']}',
			'${arg[i]['shiftId']}',
			'${arg[i]['balanceId'] ?? ''}',
			'${arg[i]['productId']}',
			'${arg[i]['quantity']}',
			'${arg[i]['totalPrice']}',
			'${arg[i]['chequeDate']}',
			'${arg[i]['saleCurrencyId']}',
			'${arg[i]['status']}'
		)`
		if (i !== arg.length - 1) {
			sql += ","
		}
	}

	db.run(sql, function (err) {
		if (!err) {
			event.reply('insert-deleted-products-result', null);
		} else {
			event.reply('insert-deleted-products-result', err.message);
		}
	});
});

ipcMain.on('delete-products', () => {
	db.run("DELETE FROM products", function (err) {
		//
	});
});

ipcMain.on('delete-clients', () => {
	db.run("DELETE FROM clients", function (err) {
		//
	});
});

ipcMain.on('delete-organizations', () => {
	db.run("DELETE FROM organizations", function (err) {
		//
	});
});

ipcMain.on('delete-organizations', () => {
	db.run("DELETE FROM agents", function (err) {
		//
	});
});

ipcMain.on('delete-cheques', () => {
	db.run("DELETE FROM cheques WHERE status = 1", function (err) {
		//
	});
});

ipcMain.on('delete-cheques-all', () => {
	db.run("DELETE FROM cheques WHERE status = 0", function (err) {
		//
	});
});

ipcMain.on('delete-deleted-products', () => {
	db.run("DELETE FROM deleted_products WHERE status = 1", function (err) {
		//
	});
});

ipcMain.on('update-cheques-status', (event, chequeNumber, chequeId) => {
	sql = "UPDATE cheques SET "
	sql += "status = " + 1 + ", "
	sql += "chequeId = " + chequeId + " "
	sql += "WHERE chequeNumber = " + chequeNumber
	db.run(sql, function (err) {
		if (!err) {
			event.reply('update-cheques-status-result');
		} else {
			event.reply('update-cheques-status-result', null);
		}
	});
});

ipcMain.on('update-deleted-products-status', (event, arr) => {
	for (let i = 0; i < arr.length; i++) {
		sql = "UPDATE deleted_products SET "
		sql += "status = " + 1 + " "
		sql += "WHERE id = " + arr[i]['id']
		db.run(sql, function (err) {
			if (!err) {
				event.reply('update-deleted-products-status-result', null);
			}
		});
	}
});

ipcMain.on('update-cheques-list-status', (event, arr) => {
	for (let i = 0; i < arr.length; i++) {
		sql = "UPDATE cheques SET "
		sql += "status = " + 1 + ", "
		sql += "chequeId = " + arr[i]['chequeId'] + " WHERE transactionId = " + JSON.stringify(arr[i]['transactionId'])

		db.run(sql, function (err) {
			if (!err) {
				event.reply('update-cheques-status-list-result', null);
			}
		});
	}
});

ipcMain.on('update-cheques-systemId', (event, chequeNumber, systemId) => {
	sql = "UPDATE cheques SET "
	sql += "systemId = " + systemId + ", "
	sql += "WHERE chequeNumber = " + chequeNumber

	db.run(sql, function (err) {
		if (!err) {
			event.reply('update-cheques-status-result');
		}
	});
});

function minusProductBalance(arg) {
	let sql = ""
	for (let i = 0; i < arg.itemsList.length; i++) {
		var productBoxItemList = arg?.itemsList[i]['productBoxItemList'] ? JSON.parse(arg?.itemsList[i]['productBoxItemList']) : []
		if (arg.itemsList[i].serial) { // если продана серийка
			var modificationList = arg.itemsList[i]['modificationList'].filter(e => e.serial !== arg.itemsList[i].serial)
			sql = `UPDATE products SET 
				balance = balance - ${arg.itemsList[i]['quantity']}, 
				modificationList = '${JSON.stringify(modificationList)}' 
				WHERE productId = ${arg.itemsList[i]['productId']}`;
			db.run(sql, function (err) {
				//console.log(err)
			});
		} else if (productBoxItemList?.length) {
			for (let j = 0; j < productBoxItemList.length; j++) {
				sqlUpdateBoxItemList = `UPDATE products SET 
					balance = balance - ${arg.itemsList[i]['quantity'] * productBoxItemList[j]['quantity']} 
					WHERE productId = ${productBoxItemList[j]['productId']}`
				db.run(sqlUpdateBoxItemList, function (err) {
					//console.log(err)
				});
			}

			sql = `UPDATE products SET 
				balance = balance - ${arg.itemsList[i]['quantity']} 
				WHERE productId = ${arg.itemsList[i]['productId']}`
			db.run(sql, function (err) {
				//console.log(err)
			});
		} else { // все другие случаи
			sql = `UPDATE products SET 
				balance = balance - ${arg.itemsList[i]['quantity']} 
				WHERE productId = ${arg.itemsList[i]['productId']}`
			db.run(sql, function (err) {
				//console.log(err)
			});
		}
	}
}