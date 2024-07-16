import React, { useState, useEffect } from 'react'
//import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux';

import { O_POST } from 'api/apiOfd';

function SelectedProducts() {
	//const { t } = useTranslation();
	const reduxSettings = useSelector(state => state.settings.settings)

	const [data, setData] = useState([]);

	async function request(type) {
		var sendData = ''

		if (type === 'SendReceipt') {
			sendData = {
				"method": "Api.SendReceipt",
				"id": Math.floor(Math.random() * 999999),
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetZReportCount') {
			sendData = {
				"method": "Api.GetZReportCount",
				"id": 68934,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetZReportInfo') {
			sendData = {
				"method": "Api.GetZReportInfo",
				"id": 70076,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Number": 0
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetZReportInfoByNumber') {
			sendData = {
				"method": "Api.GetZReportInfoByNumber",
				"id": 70076,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Number": 6
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetZReportStats') {
			sendData = {
				"method": "Api.GetZReportsStats",
				"id": 61290,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetReceiptCount') {
			sendData = {
				"method": "Api.GetReceiptCount",
				"id": 62959,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetReceiptInfo') {
			sendData = {
				"method": "Api.GetReceiptInfo",
				"id": 35857,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Number": 1
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetInfo') {
			sendData = {
				"method": "Api.GetInfo",
				"id": 58999,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
				},
				"jsonrpc": "2.0"
			}

		}
		if (type === 'GetFiscalMemoryInfo') {
			sendData = {
				"method": "Api.GetFiscalMemoryInfo",
				"id": 83236,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'Status') {
			sendData = {
				"method": "Api.Status",
				"id": 58999,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
				},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'GetUnsentCount') {
			sendData = {
				"method": "Api.GetUnsentCount",
				"id": 70059,
				"params": {},
				"jsonrpc": "2.0"
			}
		}
		if (type === 'ResendUnsent') {
			sendData = {
				"method": "Api.ResendUnsent",
				"id": 70059,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
				},
				"jsonrpc": "2.0"
			}
		}

		const response = await O_POST(sendData)
		setData(response)
	}

	function renderJson() {
		return <div><pre>{JSON.stringify(data, null, 2)}</pre></div>;
	}

	useEffect(() => {
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="pt-40">
				<div className="card-background">
					<div className="d-flex justify-content-between p-2">
						<div className="w-50 me-3 return-block-border">
							<div className="p-2 return-header-height">
								<h5>Действия</h5>
							</div>
							<div className="d-flex flex-column h-table-selected-products p-2"
								style={{ 'overflow': 'auto' }}>
								<button className="btn btn-secondary mb-2" onClick={() => request("SendReceipt")}>SendReceipt</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetZReportCount")}>GetZReportCount</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetZReportInfo")}>GetZReportInfo</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetZReportInfoByNumber")}>GetZReportInfoByNumber</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetZReportStats")}>GetZReportStats</button>
								<hr />
								<button className="btn btn-secondary mb-2" onClick={() => request("GetReceiptCount")}>GetReceiptCount</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetReceiptInfo")}>GetReceiptInfo</button>
								<hr />
								<button className="btn btn-secondary mb-2" onClick={() => request("GetInfo")}>GetInfo</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetFiscalMemoryInfo")}>GetFiscalMemoryInfo</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("Status")}>Status</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("GetUnsentCount")}>GetUnsentCount</button>
								<button className="btn btn-secondary mb-2" onClick={() => request("ResendUnsent")}>ResendUnsent</button>
							</div>
						</div>
						<div className="w-50 return-block-border">
							<div className="p-2 return-header-height">
								<h5>Результат</h5>
							</div>
							<div className="d-flex flex-column h-table-selected-products p-2">
								{renderJson()}
							</div>
						</div>
					</div>

				</div>
			</div>
		</>
	)
}

export default SelectedProducts
