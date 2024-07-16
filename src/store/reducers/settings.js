const initialState = {
	'internetConnection': 1,
	'lockScreen': false,
	'settings': {
		'logoPath': "",
		'autoSync': false,
		'hidePriceInCheque': true,
		'chooseClient': false,
		'showCashPaymentF1': true,
		'showTerminalPaymentF2': true,
		'showConfirmModalDeleteItem': true,
		'showConfirmModalDeleteAllItems': true,
		'xReport': false,
		'decimalPoint': 0,
		'barcodeFormat': 5,
		'weightPrefix': 20,
		'piecePrefix': 21,
		'finalPrefix': 25,
		'printerBroken': false,
		'printTo': false,
		'receiptPrinter': false,
		'priceTagPrinter': false,
		'checkPrintWidth': "80",
		'showRecommendation': false,
		'additionalInformation': false,
		'additionalInformationText': "",
		'showNumberOfProducts': false,
		'productGrouping': false,
		'print2cheques': false,
		'darkTheme': false,
		'openExcelFile': false,
		'showLastScannedProduct': false,
		'showProductOutOfStock': false,
		'chequeLogoWidth': 128,
		'chequeLogoHeight': "",
		'selectClientOnSale': false,
		'advancedSearchMode': false,
		'amountExceedsLimit': false,
		'showQrCode': false,
		'showBarcode': true,
		'showFullProductName': false,
		'printReturnCheque': false,
	},
}

const settingReducer = function (state = initialState, action) {
	switch (action.type) {
		case "SET_INTERNET":
			return { ...state, 'internetConnection': action.payload };
		case "SET_LOCK_SCREEN":
			return { ...state, 'lockScreen': true };
		case "SET_UNLOCK_SCREEN":
			return { ...state, 'lockScreen': false };
		case "SET_SETTINGS":
			return { ...state, 'settings': action.payload };
		case "SET_PRINTER_BROKEN":
			var stateCopy = JSON.parse(JSON.stringify(state))
			stateCopy.settings.printerBroken = !stateCopy.settings.printerBroken
			return stateCopy;
		default:
			return state;
	}
};

export default settingReducer