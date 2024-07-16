import axios from 'axios';
const mainUrl = 'https://api.click.uz/v2/merchant/click_pass/payment'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}
});

export async function CLICK_POST(url, data, authorization) {
	return new Promise((resolve, reject) => {
		axiosInstance.post(mainUrl + url, data, {
			headers: {
				"Authorization": authorization,
				"auth": authorization,
			}
		})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
			})
	});
}
