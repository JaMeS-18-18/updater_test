import axios from 'axios';
import { showLoader, hideLoader } from '../store/actions/loader';
import { store } from '../store';
import { toast } from 'react-toastify';

const mainUrl = 'https://api.digitalwallet.cards/api/v2'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
		"Authorization": localStorage.getItem("access_token") ? "Bearer " + localStorage.getItem("access_token") : "",
		"Accept-Language": localStorage.getItem("lang"),
		"Language": localStorage.getItem("lang")
	}
});
//axiosInstance.defaults.timeout = 20000;

export async function GET(url, payload = {}, notification = false, loader = true) {
	/* Params ?page=2&smth=10 */
	var params = "";
	if (Object.entries(payload).length > 0) {
		params = getPath(payload);
	}

	return new Promise((resolve, reject) => {
		if (loader)
			store.dispatch(showLoader());
		axiosInstance.get(
			url + params,
			{
				headers: {
					"Authorization": "7d1a770af862fc27262df79c631606f3",
					"X-API-Key": "7d1a770af862fc27262df79c631606f3",
					"Accept-Language": localStorage.getItem("lang"),
					"Language": localStorage.getItem("lang")
				}
			})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
				httpStatusChecker(error)
			}).finally(() => {
				if (loader)
					store.dispatch(hideLoader());
			});
	});
}

export async function POST(url, data, notification = false, loader = true) {
	return new Promise((resolve, reject) => {
		if (loader)
			store.dispatch(showLoader());
		axiosInstance.post(
			url, data,
			{
				headers: {
					"Authorization": localStorage.getItem('access_token') === null ? '' : 'Bearer ' + localStorage.getItem('access_token'),
					"Accept-Language": localStorage.getItem("lang"),
					"Language": localStorage.getItem("lang")
				}
			})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
				if (notification)
					httpStatusChecker(error)
			}).finally(() => {
				if (loader)
					store.dispatch(hideLoader());
			});
	});
}

export async function PUT(url, data, notification = false, loader = true) {

	return new Promise((resolve, reject) => {
		if (loader)
			store.dispatch(showLoader());
		axiosInstance.put(
			url, data,
			{
				headers: {
					"Authorization": localStorage.getItem('access_token') === null ? '' : 'Bearer ' + localStorage.getItem('access_token'),
					"Accept-Language": localStorage.getItem("lang"),
					"Language": localStorage.getItem("lang")
				}
			})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
				if (notification)
					httpStatusChecker(error)
			}).finally(() => {
				if (loader)
					store.dispatch(hideLoader());
			});
	});
}

export async function DELETE(url) {

	return new Promise((resolve, reject) => {
		store.dispatch(showLoader());
		axiosInstance.delete(
			url,
			{
				headers: {
					"Authorization": localStorage.getItem('access_token') === null ? '' : 'Bearer ' + localStorage.getItem('access_token'),
					"Accept-Language": localStorage.getItem("lang"),
					"Language": localStorage.getItem("lang")
				}
			})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
				httpStatusChecker(error)
			}).finally(() => {
				store.dispatch(hideLoader());
			});
	});
}

function getPath(payload, url) {
	let iterations = Object.entries(payload).length;
	var pathArr = "?";
	if (url)
		url.includes("?") ? pathArr = '&' : pathArr = '?'

	for (let key in payload) {
		if (payload[key]) {
			if (!--iterations) {
				pathArr += key + "=" + payload[key];
			} else {
				pathArr += key + "=" + payload[key] + "&";
			}
		}
	}
	return pathArr;
}

function httpStatusChecker(error) {
	if (!error.response) {
		toast.error("Ошибка: Нет подключение к интернету")
		return;
	}
	if (error.response.status === 400) {
		toast.error(error.response.data.message)
		return;
	}
	if (error.response.status === 401) {
		toast.error("Ошибка: Неверный логин или пароль")
		return;
	}
	if (error.response.status === 404) {
		toast.error("Ошибка: Не найдено")
		return;
	}
	if (error.response.status === 415) {
		toast.error("Ошибка: Не поддерживаемый тип")
		return;
	}
	if (error.response.status === 500) {
		toast.error("Системная ошибка:" + error.response.data.message)
		return;
	}
}