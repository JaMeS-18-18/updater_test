import axios from 'axios';
//const mainUrl = 'https://checkout.test.paycom.uz/api'
const mainUrl = 'https://checkout.paycom.uz/api'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}
});

export async function PAYME_POST(url, data, authorization) {
	return new Promise((resolve, reject) => {
		axiosInstance.post(mainUrl + url, data, {
			headers: {
				"Authorization": authorization,
				"X-AUTH": authorization
			}
		})
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
			})
	});
}
