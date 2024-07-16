import axios from 'axios';
import { showLoader, hideLoader } from '../store/actions/loader';
import { store } from '../store';
import { toast } from 'react-toastify';
const mainUrl = 'https://cabinet.cashbek.uz'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
		"Accept-Language": localStorage.getItem("lang"),
		"Language": localStorage.getItem("lang")
	}
});

export async function L_POST(url, data, notification = false, loader = true) {
	return new Promise((resolve, reject) => {
		if (loader)
			store.dispatch(showLoader());
		axiosInstance.post(
			url, data,
			{
				headers: {
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