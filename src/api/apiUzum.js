import axios from 'axios';
const mainUrl = 'https://mobile.apelsin.uz/api/apelsin-pay'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}
});

export async function UZUM_POST(url, data, authorization) {
	return new Promise((resolve, reject) => {
		axiosInstance.post(mainUrl + url, data, {
			headers: {
				"Authorization": authorization
			}
		})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
			})
	});
}
