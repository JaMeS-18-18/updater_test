import axios from 'axios';
const mainUrl = 'http://127.0.0.1:3448/rpc/api'

const axiosInstance = axios.create({
	baseURL: mainUrl,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}
});

export async function O_POST(data) {
	return new Promise((resolve, reject) => {
		axiosInstance.post(mainUrl, data)
			.then(response => {
				resolve(response.data);
			}).catch(error => {
				reject(error);
			})
	});
}