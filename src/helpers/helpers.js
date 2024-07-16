import { getTime, format } from 'date-fns'

export function deleteSymbols(str) {
	return str.replace(/[^A-Z0-9]/gi, '');
}

export function returnSign(str) {
	return str.includes("?") ? '&' : '?'
}

export function clearTemporaryStorage() {
	localStorage.removeItem('access_token')
	localStorage.removeItem('username')
	localStorage.removeItem('password')
	localStorage.removeItem('tokenTime')
	localStorage.removeItem('user_roles')
	sessionStorage.clear();
}

export function formatMoney(amount, decimalCount = 0, decimal = ".", thousands = " ") {
	if (Number.isInteger(Number(amount))) {
		decimalCount = 0
	} else {
		if (!decimalCount) {
			const state = JSON.parse(localStorage.getItem('state'))
			if (state) {
				decimalCount = Number(state.settings.settings.decimalPoint)
			}
		} else {
			decimalCount = 0
		}
	}

	try {
		decimalCount = Math.abs(decimalCount);
		decimalCount = isNaN(decimalCount) ? 0 : decimalCount; // 0 was 2

		const negativeSign = amount < 0 ? "-" : "";

		let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
		let j = (i.length > 3) ? i.length % 3 : 0;

		return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
	} catch (e) {
		console.log(e)
	}
}

export function formatMoneyInput(amount) {
	return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatMoneyCheque(amount, decimalCount = 0, decimal = ".", thousands = " ") {
	if (Number.isInteger(Number(amount))) {
		decimalCount = 0
	} else {
		const state = JSON.parse(localStorage.getItem('state'))
		if (state) {
			decimalCount = state.settings.settings.decimalPoint
		}
	}

	try {
		decimalCount = Math.abs(decimalCount);
		decimalCount = isNaN(decimalCount) ? 0 : decimalCount; // 0 was 2

		const negativeSign = amount < 0 ? "-" : "";

		let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
		let j = (i.length > 3) ? i.length % 3 : 0;

		return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
	} catch (e) {
		console.log(e)
	}
}

export function formatDateWithTime(date, formatDate = 'dd.MM.yyyy HH:mm:ss') {
	if (date) {
		var formattedDate = format(new Date(date), formatDate);
		return formattedDate
	}
}

export function formatBackendDate(date) {
	if (date) {
		var formattedDate = format(new Date(date), 'yyyy-MM-dd');
		return formattedDate
	}
}

export function dateFormat(date, formatDate = 'dd/MM HH:mm') {
	if (date) {
		var formattedDate = format(new Date(date), formatDate);
		return formattedDate
	} else {
		return ""
	}
}

export function getUnixTime() {
	return getTime(new Date())
}

export function todayDate() {
	return format(new Date(), 'dd-MM-yyyy HH:mm:ss')
}

export function todayDDMMYYYY() {
	return format(new Date(), 'dd-MM-yyyy')
}

export function getHHmm() {
	return format(new Date(), 'HH:mm')
}

export function getUnixTimeByDate(date) {
	return getTime(date)
}

export function formatUnixTime(unixTime, formatDate = 'dd.MM.yyyy HH:mm:ss') {
	if (unixTime)
		return format(new Date(unixTime), formatDate)
}

export function formatDateBackend(date) {
	if (date) {
		var formattedDate = format(new Date(date), 'yyyy-MM-dd');
		return formattedDate
	}
}

export function todayYYYYMMDD() {
	return format(new Date(), 'yyyy-MM-dd HH:mm:ss')
}

export function generateChequeNumber(posId, cashboxId, shiftId) {
	return getUnixTime().toString() + cashboxId.toString() //+ shiftId.toString()
}

export function generateTransactionId(posId, cashboxId, shiftId) {
	if (posId && cashboxId && shiftId)
		return posId.toString() + cashboxId.toString() + shiftId.toString() + getUnixTime().toString() + Math.floor(Math.random() * 999999)
}

export function quantityOfUnitlist(item) {
	if (item?.unitList && item?.unitList?.length > 0) {
		var unitList = JSON.parse(item?.unitList)
		if (unitList?.length > 0) {
			return `${item?.balance} ${item?.uomName} = ${formatMoney(unitList[0]['quantity'])}`
		} else {
			return item?.uomName
		}
	} else {
		return ''
	}
}