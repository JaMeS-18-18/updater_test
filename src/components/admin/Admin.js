import React, { useState, useEffect } from 'react'

function Admin() {
	const [data, setData] = useState([])

	function getChequesFromDB() {
		window.electron.dbApi.getCheques().then(response => {
			setData(response)
		})
	}

	useEffect(() => {
		getChequesFromDB()
	}, [])
	
	return (
		<>
			<div className="pt-40">
				<div className="card-background h-table-admin p-2">
					<table className="table">
						<thead>
							<tr>
								<th>id</th>
								<th>login</th>
								<th>cashboxId</th>
								<th>posId</th>
								<th>shiftId</th>
								<th>systemId</th>
								<th>chequeId</th>
								<th>chequeDate</th>
								<th>chequeNumber</th>
								<th>transactionId</th>
								<th>status</th>
								<th>change</th>
								<th>clientId</th>
								<th>clientAmount</th>
								<th>clientComment</th>
								<th>saleCurrencyId</th>
								<th>currencyId</th>
								<th>currencyRate</th>
								<th>discount</th>
								<th>itemsList</th>
								<th>note</th>
								<th>ofdTransactions</th>
								<th>offline</th>
								<th>outType</th>
								<th>paid</th>
								<th>totalPrice</th>
								<th>transactionsList</th>
							</tr>
						</thead>
						<tbody>
							{	data.map((item, index) => (
									<tr key={index}>
										<td>{item.id}</td>
										<td>{item.login}</td>
										<td>{item.cashboxId}</td>
										<td>{item.posId}</td>
										<td>{item.shiftId}</td>
										<td>{item.systemId}</td>
										<td>{item.chequeId}</td>
										<td>{item.chequeDate}</td>
										<td>{item.chequeNumber}</td>
										<td>{item.transactionId}</td>
										<td>{item.status}</td>
										<td>{item.change}</td>
										<td>{item.clientId}</td>
										<td>{item.clientAmount}</td>
										<td>{item.clientComment}</td>
										<td>{item.saleCurrencyId}</td>
										<td>{item.currencyId}</td>
										<td>{item.currencyRate}</td>
										<td>{item.discount}</td>
										<td>
											{/* {item.itemsList} */}
										</td>
										<td>{item.note}</td>
										<td>{item.ofdTransactions}</td>
										<td>{item.offline}</td>
										<td>{item.outType}</td>
										<td>{item.paid}</td>
										<td>{item.totalPrice}</td>
										<td>
											{/* {item.transactionsList} */}
										</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</div>
			</div>
		</>
	)
}

export default Admin
