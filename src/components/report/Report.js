import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GET } from 'api/api'
import { formatMoney, returnSign } from 'helpers/helpers'

function Report() {
	const { t } = useTranslation();

	const [data, setData] = useState([])
	const [poses, setPoses] = useState([])
	const [filter, setFilter] = useState({
		'search': '',
		'posId': 0
	})

	function getData(e) {
		if (e)
			e.preventDefault();

		var urlParams = ""
		if (filter.search.length)
			urlParams += returnSign(urlParams) + 'search=' + filter.search
		if (Number(filter.posId) !== 0)
			urlParams += returnSign(urlParams) + 'posId=' + filter.posId
		GET("/services/desktop/api/get-all-balance-product-list" + urlParams).then(response => {
			setData(response)
		})
	}

	function getPoses() {
		GET("/services/desktop/api/pos-helper").then(response => {
			setPoses(response)
		})
	}

	useEffect(() => {
		getPoses()
		getData()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="pt-40">
			<div className="card-background p-2">
				<form onSubmit={(e) => getData(e)} className="d-flex mb-2">
					<div className="me-2 w-25">
						<input className="form-control me-2" placeholder={t('search')} autoFocus
							value={filter.search} onChange={(e) => setFilter({ ...filter, 'search': e.target.value })} />
					</div>
					<div className="me-2 w-25">
						<select className="form-select" value={filter.posId} onChange={(e) => setFilter({ ...filter, 'posId': e.target.value })}>
							<option value="0">Все</option>
							{poses.length > 0 &&
								poses.map((item, index) => (
									<option value={item.id} key={index}>{item.name}</option>
								))
							}
						</select>
					</div>
					<button type="submit" className="btn btn-primary">{t('search')}</button>
				</form>

				<div className="h-table-cheques">
					<table className="table">
						<thead>
							<tr>
								<th>№ {t('pos')}</th>
								<th>{t('product_name')}</th>
								<th className="text-center">{t('barcode')}</th>
								<th className="text-center">{t('balance')}</th>
								<th className="text-center">{t('wholesale_price')}</th>
								<th className="text-center">{t('sale_price')}</th>
							</tr>
						</thead>
						<tbody>
							{data.length > 0 &&
								data.map((item, index) => (
									<tr className="cashbox-table-bg-on-hover cursor" key={index}>
										<td>{index + 1}. {item.posName}</td>
										<td>{item.productName}</td>
										<td className="text-center">{item.barcode}</td>
										<td className="text-center">{item.balance}</td>
										<td className="text-center">{formatMoney(item.wholesalePrice)}</td>
										<td className="text-center">{formatMoney(item.salePrice)}</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default Report
