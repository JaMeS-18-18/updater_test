import React from 'react'
import NumberOfSales from './NumberOfSales'
import ClientsAndAmount from './ClientsAndAmount'

function Statistics() {
	return (
		<div className="pt-40">
			<div className="h-table-statistics">
				<div className="card-background p-2 mb-3">
					<NumberOfSales />
				</div>

				<div className="card-background p-2">
					<ClientsAndAmount />
				</div>
			</div>
		</div>
	)
}

export default Statistics
