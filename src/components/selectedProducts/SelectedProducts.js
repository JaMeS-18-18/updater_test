import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { CancelOutlined } from '@material-ui/icons';
import { toast } from 'react-toastify'
import { GET, POST, DELETE } from 'api/api'
import { SET_SELECTED_PRODUCTS } from 'store/actions/backendHelpers'

function SelectedProducts() {
	const { t } = useTranslation();
	const dispatch = useDispatch()
	
	const cashbox = useSelector(state => state.cashbox)
	const reduxSettings = useSelector(state => state.settings.settings)

	const [data, setData] = useState([]);
	const [sendData, setSendData] = useState([]);

	function addToList(index) {
		var dataCopy = [...data]
		var sendDataCopy = [...sendData]

		var createItem = {
			cashboxId: cashbox.cashboxId,
			order: 0,
			posId: cashbox.posId,
			productBarcode: dataCopy[index]['barcode'],
			productId: dataCopy[index]['productId'],
			productName: dataCopy[index]['productName']
		}

		var exist = false
		for (let i = 0; i < sendDataCopy.length; i++) {
			if (sendDataCopy[i]['productBarcode'] === dataCopy[index]['barcode']) {
				exist = true
			}
		}

		if (!exist) {
			sendDataCopy.push(createItem)
		}

		setSendData(sendDataCopy)
	}

	function searchProduct(search) {
		if (search.length > 0) {
			window.electron.dbApi.findProductsByName({
				'search': search,
				'searchExact': reduxSettings.searchExact,
			}).then(response => {
				setData(response.row)
			})
		} else {
			getProductsFromDB()
		}
	}

	function create() {
		var arr = []
		for (let i = 0; i < sendData.length; i++) {
			if (!sendData[i]['id']) {
				arr.push(sendData[i])
			}
		}
		POST("/services/desktop/api/selected-products", arr).then(response => {
			getSelectedProducts()
			toast.success(t('saved_successfully'))
		})
	}

	function deleteItem(index) {
		if (sendData[index]['id']) {
			DELETE("/services/desktop/api/selected-products/" + sendData[index]['id']).then(response => {
				getSelectedProducts()
			})
		} else {
			var sendDataCopy = [...sendData]
			sendDataCopy.splice(index, 1)
			setSendData(sendDataCopy)
		}
	}

	function getProductsFromDB() {
		window.electron.dbApi.getProducts().then(response => {
			setData(response)
		})
	}

	function getSelectedProducts() {
		GET("/services/desktop/api/selected-products-list/" + cashbox.posId + "/" + cashbox.cashboxId).then(response => {
			setSendData(response)
			dispatch(SET_SELECTED_PRODUCTS(response))
		})
	}

	useEffect(() => {
		getProductsFromDB()
		getSelectedProducts()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="pt-40">
				<div className="card-background">

					<div className="d-flex justify-content-between p-2">
						<div className="w-50 me-3 return-block-border">
							<div className="p-2 return-header-height">
								<h5>{t('list_of_goods')}</h5>
							</div>
							<div className="d-flex flex-column justify-content-between h-table-selected-products">
								{/* TABLE */}
								<div className="table-responsive selected-products-table">
									<table className="table fz14">
										<thead>
											<tr>
												<th>
													<input type="text" placeholder={t('search')} className="product-search-table-input left-product-search"
														autoFocus
														onKeyPress={e => {
															if (e.key === 'Enter') {
																searchProduct(e.target.value)
															}
														}}
													//onChange={(e) => searchProduct(e.target.value)}
													/>
												</th>
												<th className="text-end">{t('barcode')}</th>
											</tr>
										</thead>
										<tbody>
											{data.length > 0 &&
												data.map((item, index) => (
													<tr className="cashbox-table-bg-on-hover cursor" key={index}
														onDoubleClick={() => addToList(index)}>
														<td>{item.productName}</td>
														<td className="text-end">{item.barcode}</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</div>
								{/* TABLE */}
							</div>
						</div>
						<div className="w-50 return-block-border">
							<div className="p-2 return-header-height">
								<h5>{t('quick_selection')}</h5>
							</div>
							<div className="d-flex flex-column justify-content-between h-table-selected-products">
								{/* TABLE */}
								<div className="table-responsive">
									<table className="table fz14">
										<thead>
											<tr>
												<th>{t('name')}</th>
												<th className="text-center">{t('barcode')}</th>
												{/* <th className="text-center">{t('position')}</th> */}
												<th className="text-center">{t('action')}</th>
											</tr>
										</thead>
										<tbody>
											{sendData.length > 0 &&
												sendData.map((item, index) => (
													<tr className="cashbox-table-bg-on-hover cursor" key={index + 1000}>
														<td>{item.productName}</td>
														<td className="text-center">{item.productBarcode}</td>
														{/* <td className="text-center">{item.order}</td> */}
														<td className="text-center">
															<CancelOutlined className="cashbox-table-danger-icon" onClick={() => deleteItem(index)} />
														</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</div>
								{/* TABLE */}
								<div className="pt-2 px-2">
									<div className="d-flex">
										<button className="btn btn-primary btn-lg text-uppercase w-100" onClick={create}><b>{t('save')}</b></button>
									</div>
								</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</>
	)
}

export default SelectedProducts
