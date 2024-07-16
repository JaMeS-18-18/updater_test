import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';

import { SET_CASHBOX } from 'store/actions/cashbox'

import { SET_SHIFT } from 'store/actions/shift'
import { SET_SELECTED_PRODUCTS } from 'store/actions/backendHelpers'

import { clearTemporaryStorage, getUnixTime } from 'helpers/helpers'
import { POST, GET } from 'api/api'
import { O_POST } from 'api/apiOfd'

export default function Cashboxes() {
	const { t } = useTranslation();
	const dispatch = useDispatch()
	const history = useHistory();

	const poses = useSelector(state => state.posList)
	const reduxSettings = useSelector(state => state.settings.settings)

	async function selectCashbox(pos, cashbox) {
		var prepareToDispatch = {}
		prepareToDispatch.defaultCurrency = cashbox.defaultCurrency
		prepareToDispatch.defaultCurrencyName = pos.cashboxCurrencyName
		prepareToDispatch.currencyRate = pos.currencyRate
		prepareToDispatch.hidePriceIn = pos.hidePriceIn
		prepareToDispatch.wholesalePriceIn = pos.wholesalePriceIn
		prepareToDispatch.loyaltyApi = pos.loyaltyApi
		prepareToDispatch.saleMethod = pos.saleMethod
		prepareToDispatch.saleMinus = pos.saleMinus
		prepareToDispatch.cashboxId = cashbox.id
		prepareToDispatch.posId = pos.posId
		prepareToDispatch.posName = pos.posName
		prepareToDispatch.posAddress = pos.posAddress
		prepareToDispatch.posPhone = pos.posPhone
		prepareToDispatch.ofd = pos.ofd
		prepareToDispatch.uzumPay = pos.uzumPay
		prepareToDispatch.clickPay = pos.clickPay
		prepareToDispatch.paymePay = pos.paymePay
		prepareToDispatch.tin = pos.tin
		dispatch(SET_CASHBOX(prepareToDispatch))

		try {
			const uoms = await GET("/services/desktop/api/product-uom-helper")
			window.electron.dbApi.insertUoms(uoms)
		} catch (error) { }

		var responseDate
		try {
			responseDate = await GET("/services/desktop/api/date-helper")
		} catch (error) {
			return
		}

		var sendData = {}
		sendData.actionDate = getUnixTime()
		sendData.cashboxId = cashbox.id
		sendData.offline = false
		sendData.posId = pos.posId
		var responseOpenShift = await POST("/services/desktop/api/open-shift", sendData)
		// OFD
		if (prepareToDispatch.ofd) {
			var ofdData = {
				"method": "Api.OpenZReport",
				"id": responseOpenShift.id,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Time": responseDate.ofdDate
				},
				"jsonrpc": "2.0"
			}
			O_POST(ofdData)
		}
		// OFD
		dispatch(SET_SHIFT(responseOpenShift))
		var responseBalance = await GET("/services/desktop/api/get-balance-product-list/" + pos.posId + "/" + cashbox.defaultCurrency)
		window.electron.dbApi.deleteProducts()
		window.electron.dbApi.insertProducts(responseBalance).catch(e => { toast.error(e) })
		var selectedProducts = await GET("/services/desktop/api/selected-products-list/" + pos.posId + "/" + cashbox.id)
		dispatch(SET_SELECTED_PRODUCTS(selectedProducts))

		var clients = await GET("/services/desktop/api/clients-helper")
		window.electron.dbApi.deleteClients()
		window.electron.dbApi.insertClients(clients).catch(e => { toast.error(e) })

		var organizations = await GET("/services/desktop/api/organization-helper")
		window.electron.dbApi.deleteOrganizations()
		window.electron.dbApi.insertOrganizations(organizations).catch(e => { toast.error(e) })

		var agents = await GET("/services/desktop/api/agent-helper")
		window.electron.dbApi.deleteAgents()
		window.electron.dbApi.insertAgents(agents).catch(e => { toast.error(e) })

		history.push("/")
	}

	function logout() {
		dispatch({ type: 'USER_LOGGED_OUT', payload: null })
		clearTemporaryStorage()
		history.push("/auth/login");
	}

	return (
		<div className="authentication-bg">
			<div className="account-pages h-100 vertical-center">
				<div className="container auth-card">
					<div className="row align-items-center justify-content-center">
						<div className="col-md-8 col-lg-6 col-xl-4">
							<div className="p-4 login-tabs-container">
								<div className="text-center">
									<h4 className="m-0 color-ff">
										{t('free_cashboxes')}
										<div className="d-flex justify-content-center">
											<hr className="w-50 m-1 bg-white" />
										</div>
									</h4>
									<h5 className="mb-3 color-ff">{t('select_cashbox_to_enter')}</h5>
									{poses.map((pos, index) => (
										<div className="mb-3" key={index}>
											<h4 className="mb-2 color-ff">{pos.posName}</h4>
											{pos.cashboxList.map((cashbox, index2) => (
												<div className="mb-3 d-flex justify-content-center" key={index2}
													onClick={() => selectCashbox(pos, cashbox)}>
													<h4 className="m-0 login-input cursor">
														{cashbox.name}
													</h4>
												</div>
											))
											}
										</div>
									))}

									{poses.length === 0 &&
										<h4 className="mb-3 color-ff">{t('no_free_cashboxes')}</h4>
									}
									<button className="login-button" onClick={() => logout()}>{t('logout')}</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<ul className="circles">
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
				</ul>
			</div>
		</div>
	);
}