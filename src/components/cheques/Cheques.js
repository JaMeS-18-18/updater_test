import React, { useState, useRef, Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from "react-router-dom";

import DatePicker from "react-datepicker";
import Barcode from 'react-barcode';
import QRCode from "react-qr-code";
// import XLSX from 'xlsx';
import XLSX from 'xlsx-js-style';
import { Dropdown } from 'react-bootstrap';

import { PrintOutlined, DescriptionOutlined } from '@material-ui/icons';
import { formatDateWithTime, formatMoney, formatUnixTime, getUnixTimeByDate } from 'helpers/helpers';
import { GET, globalValue } from 'api/api';
import { SET_CHEQUES_FILTER, SET_CHEQUES_SELECTED } from 'store/actions/backendHelpers';

import "assets/css/react-datepicker.css";

function Cheques() {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const history = useHistory();
	const printChequeRef = useRef(null);

	const cashbox = useSelector(state => state.cashbox)
	const reduxSettings = useSelector(state => state.settings.settings)
	const reduxBackendHelpers = useSelector(state => state.backendHelpers)

	var date = new Date();
	const [filterData, setFilterData] = useState({
		'startDate': new Date(date.setDate(date.getDate() - 10)),
		'endDate': new Date(),
		'search': "",
		'fromPaid': "",
		'toPaid': ""
	});

	const [data, setData] = useState([]);
	const [selectedItem, setSelectedItem] = useState({});

	function getCashierCheques(e, reduxFilter = true) {
		if (e)
			e.preventDefault();

		var sendData = {
			'startDate': getUnixTimeByDate(new Date(filterData.startDate)),
			'endDate': getUnixTimeByDate(new Date(filterData.endDate)),
			'posId': cashbox.posId,
			'outType': false,
			'search': filterData.search,
			'fromPaid': filterData.fromPaid,
			'toPaid': filterData.toPaid,
			'size': 2000,
		}

		if (reduxFilter && reduxBackendHelpers?.chequesFilter?.posId) {
			sendData = reduxBackendHelpers?.chequesFilter

			setFilterData({
				...filterData,
				'startDate': new Date(reduxBackendHelpers?.chequesFilter?.startDate),
				'endDate': new Date(reduxBackendHelpers?.chequesFilter?.endDate),
				'search': reduxBackendHelpers?.chequesFilter?.search ?? '',
				'fromPaid': reduxBackendHelpers?.chequesFilter?.fromPaid ?? '',
				'toPaid': reduxBackendHelpers?.chequesFilter?.toPaid ?? '',
			})

			if (reduxBackendHelpers?.chequesSelected?.id) {
				chequeById(reduxBackendHelpers?.chequesSelected?.id)
			}
		}

		GET("/services/desktop/api/cashier-cheque-pageList", sendData).then(response => {
			for (let i = 0; i < response.length; i++) {
				response[i]['selected'] = false
			}


			if (reduxBackendHelpers?.chequesSelected?.id) {
				for (let i = 0; i < response.length; i++) {
					if (reduxBackendHelpers?.chequesSelected?.id === response[i]['id']) {
						response[i]['selected'] = true
					} else {
						response[i]['selected'] = false
					}
				}
			}

			setData(response)
		})

		dispatch(SET_CHEQUES_FILTER(sendData))
	}

	function chequeById(chequeId) {
		for (let i = 0; i < data.length; i++) {
			if (chequeId === data[i]['id']) {
				data[i]['selected'] = true
			} else {
				data[i]['selected'] = false
			}
		}

		GET("/services/desktop/api/cheque-byId/" + chequeId).then(response => {
			setSelectedItem(response)
			dispatch(SET_CHEQUES_SELECTED(response))
		})
	}

	function getStatus(status) {
		if (status === 0) {
			return t('success')
		} else if (status === 1) {
			return t('item_partially_returned')
		} else if (status === 2) {
			return t('item_returned')
		}
	}

	function getColor(status) {
		if (status === 0) {
			return ''
		} else if (status === 1) {
			return 'cheques-status-warning'
		} else if (status === 2) {
			return 'cheques-status-danger'
		}
	}

	function calculateVat(i) {
		var vat = 0;
		if (selectedItem.itemsList[i]['discountAmount']) {
			vat = Number(selectedItem.itemsList[i]['totalPrice'] - selectedItem.itemsList[i]['discountAmount']) /
				(100 + Number(selectedItem.itemsList[i]['vat'])) *
				Number(selectedItem.itemsList[i]['vat'])
		} else {
			vat = Number(selectedItem.itemsList[i]['totalPrice']) /
				(100 + Number(selectedItem.itemsList[i]['vat'])) *
				Number(selectedItem.itemsList[i]['vat'])
		}
		return formatMoney(vat)
	}

	function calculateTotalVat() {
		var vat = 0;
		if (selectedItem.discountAmount) {
			for (let i = 0; i < selectedItem?.itemsList?.length; i++) {
				vat +=
					(Number(selectedItem.itemsList[i]['totalPrice'] - selectedItem.discountAmount)) *
					Number(selectedItem.itemsList[i]['vat']) /
					(100 + Number(selectedItem.itemsList[i]['vat']))
			}
		} else {
			for (let i = 0; i < selectedItem?.itemsList?.length; i++) {
				vat +=
					Number(selectedItem.itemsList[i]['totalPrice']) /
					(100 + Number(selectedItem.itemsList[i]['vat'])) *
					Number(selectedItem.itemsList[i]['vat'])
			}
		}

		return vat
	}

	async function printCheque(type = 1) {
		if (type === 1) {
			var domInString = printChequeRef.current.outerHTML
			window.electron.appApi.print(domInString, reduxSettings.receiptPrinter)
		}

		if (type === 2) { // print to excel

			var dataCopy = { ...selectedItem }
			var temporaryData = [];
			temporaryData.push({ "A": t('pos'), "B": cashbox.posName })
			temporaryData.push({ "A": t('cashier'), "B": dataCopy.cashierName })
			if ((Number(dataCopy.clientAmount) === 0 && dataCopy.clientName)) {
				temporaryData.push({ "A": t('client'), "B": dataCopy.clientName })
			}
			temporaryData.push({ "A": '№ ' + t('check_number'), "B": dataCopy.chequeNumber })
			temporaryData.push({ "A": t('date'), "B": formatUnixTime(dataCopy.chequeDate) })

			temporaryData.push({ "A": '№', "B": t('product'), "C": t('quantity'), "D": t('price'), "E": t('total') })
			for (let i = 0; i < dataCopy.itemsList.length; i++) {
				temporaryData.push({
					"A": `${i + 1}`,
					"B": `${dataCopy.itemsList[i]['productName']}`,
					"C": dataCopy.itemsList[i]['quantity'],
					"D": dataCopy.itemsList[i]['salePrice'],
					"E": dataCopy.itemsList[i]['totalPrice']
				})
			}

			temporaryData.push({ "D": t('sale_amount'), "E": (dataCopy.totalPrice) })
			temporaryData.push({ "D": t('discount'), "E": (dataCopy.discountAmount) })
			temporaryData.push({ "D": t('to_pay'), "E": (dataCopy.totalPrice - dataCopy.discountAmount) })

			temporaryData.push({ "D": t('paid'), "E": (dataCopy.paid) })
			temporaryData.push({ "D": t('vat'), "E": dataCopy.totalVatAmount ? Number(dataCopy.totalVatAmount).toFixed(2) : 0 })
			if (dataCopy.loyaltyClientName)
				temporaryData.push({ "D": t('client'), "E": dataCopy.loyaltyClientName })
			if (dataCopy.loyaltyBonus)
				temporaryData.push({ "D": 'Loyalty', "E": (dataCopy.loyaltyBonus) })

			for (let i = 0; i < dataCopy.transactionsList.length; i++) {
				if (dataCopy.transactionsList[i]['paymentTypeId'] === 2) {
					temporaryData.push({ "D": t('cash'), "E": dataCopy.transactionsList[i]['amountIn'] })
				}
				if (dataCopy.transactionsList[i]['paymentTypeId'] === 3) {
					temporaryData.push({ "D": t('bank_card'), "E": dataCopy.transactionsList[i]['amountIn'] })
				}
				if (dataCopy.transactionsList[i]['paymentTypeId'] === 4) {
					temporaryData.push({ "D": 'uGet', "E": dataCopy.transactionsList[i]['amountIn'] })
				}
			}

			temporaryData.push({ "D": t('change'), "E": (dataCopy.change) })
			temporaryData.push({ "D": t('debt_amount'), "E": (dataCopy.clientAmount) })
			if (dataCopy.clientAmount > 0) {
				temporaryData.push({ "D": t('debtor'), "E": dataCopy.clientName })
			}
			if ((Number(dataCopy.clientAmount) === 0 && dataCopy.clientName)) {
				temporaryData.push({ "D": t('client'), "E": dataCopy.clientName })
			}

			const ws = XLSX.utils.json_to_sheet(temporaryData, { skipHeader: true });

			const headerStyle = {
				font: { bold: true },
				border: {
					top: { style: 'thin', color: { rgb: "000000" } },
					bottom: { style: 'thin', color: { rgb: "000000" } },
					left: { style: 'thin', color: { rgb: "000000" } },
					right: { style: 'thin', color: { rgb: "000000" } }
				}
			};

			// Apply header styles
			ws['A5'].s = headerStyle;
			ws['B5'].s = headerStyle;
			ws['C5'].s = headerStyle;
			ws['D5'].s = headerStyle;
			ws['E5'].s = headerStyle;

			for (let i = 0; i < dataCopy.itemsList.length; i++) {
				ws[`A${5 + i + 1}`].s = headerStyle;
				ws[`B${5 + i + 1}`].s = headerStyle;
				ws[`C${5 + i + 1}`].s = headerStyle;
				ws[`D${5 + i + 1}`].s = headerStyle;
				ws[`E${5 + i + 1}`].s = headerStyle;
			}

			// Set default column widths
			const defaultColumnWidth = 20; // Define default width in characters
			ws['!cols'] = [
				{ wch: defaultColumnWidth }, // Column A
				{ wch: defaultColumnWidth }, // Column B
				{ wch: defaultColumnWidth }, // Column C
				{ wch: defaultColumnWidth },  // Column D
				{ wch: defaultColumnWidth },  // Column E
			];

			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
			XLSX.writeFile(wb, dataCopy.chequeNumber + ".xlsx");
		}
	}

	function redirectToReturn(chequeNumber) {
		history.push("/return/" + chequeNumber)
	}

	function returnPrinterWidth() {
		var name = ""
		switch (reduxSettings.checkPrintWidth) {
			case "58":
				name = "w58mm"
				break;
			case "65":
				name = "w65mm"
				break;
			case "70":
				name = "w70mm"
				break;
			case "75":
				name = "w75mm"
				break;
			default:
				name = "w80mm"
				break;
		}
		return name
	}

	const printToggle = React.forwardRef(({ children, onClick }, ref) => (
		<span ref={ref} onClick={(e) => { e.preventDefault(); onClick(e); }}>
			{children}
		</span>
	));

	useEffect(() => {
		getCashierCheques()
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="pt-40">
				<div className="d-flex">
					<div className="w-100 card-background me-2 p-2">
						<form onSubmit={(e) => getCashierCheques(e, false)} className="d-flex mb-2">
							<div className="me-2">
								<DatePicker className="form-control"
									selected={filterData.startDate}
									dateFormat="dd.MM.yyyy"
									onChange={(date) => {
										console.log(date)
										setFilterData({ ...filterData, 'startDate': date })
									}} />
							</div>
							<div className="me-2">
								<DatePicker className="form-control"
									selected={filterData.endDate}
									dateFormat="dd.MM.yyyy"
									onChange={(date) => setFilterData({ ...filterData, 'endDate': date })} />
							</div>
							<div className="me-2">
								<input type="number" className="form-control"
									placeholder={t('amount_from')}
									value={filterData.fromPaid}
									onChange={(e) => setFilterData({ ...filterData, 'fromPaid': e.target.value })}
								/>
							</div>
							<div className="me-2">
								<input type="number" className="form-control"
									placeholder={t('amount_to')}
									value={filterData.toPaid}
									onChange={(e) => setFilterData({ ...filterData, 'toPaid': e.target.value })}
								/>
							</div>
							<div className="me-2">
								<input type="text" className="form-control"
									placeholder={t('search')}
									value={filterData.search}
									onChange={(e) => setFilterData({ ...filterData, 'search': e.target.value })}
								/>
							</div>
							<div>
								<button type="submit" className="btn btn-primary">
									{t('filter')}
								</button>
							</div>
						</form>

						<div className="h-table-cheques">
							<table className="table">
								<thead>
									<tr>
										<th style={{ 'width': '30%' }}>{t('status')}</th>
										<th style={{ 'width': '10%' }}>{t('client')}</th>
										<th style={{ 'width': '10%' }}>{t('organization')}</th>
										<th style={{ 'width': '10%' }}>{t('agent')}</th>
										<th style={{ 'width': '20%' }} className="text-end">{t('total')}</th>
										<th style={{ 'width': '30%' }} className="text-end">{t('date')}</th>
									</tr>
								</thead>
								<tbody>
									{data.map((item, index) => (
										<tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
											key={index} onClick={() => chequeById(item.id)}>
											<td>
												<span className={"me-2 " + getColor(item.returned)}>{index + 1}.</span>
												<span className={getColor(item.returned)}>{getStatus(item.returned)}</span>
											</td>
											<td>{item.clientName}</td>
											<td>{item.organizationName}</td>
											<td>{item.agentName}</td>
											<td className={'text-end ' + (item.clientAmount > 0 ? 'text-danger' : '')}
												title={item.clientAmount > 0 ? t('on_credit') : ''}>{formatMoney(item.totalPrice)}</td>
											<td className="text-end">{formatUnixTime(item.chequeDate)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
					<div className="card-background p-2 position-relative" style={{ 'width': '375px' }}>
						<div className="h-table-cheques-right">
							<div className="d-flex justify-content-center mb-2">
								<div className="d-flex flex-column">
									<div className="d-flex justify-content-center mb-2">
										<div className="d-flex">
											{reduxSettings.logoPath ?
												<img src={reduxSettings.logoPath}
													width={reduxSettings.chequeLogoWidth ? reduxSettings.chequeLogoWidth : 128}
													height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
													alt="logo"
												/>
												:
												<>
													<img src={`${globalValue('url')}/logo.svg`}
														width={reduxSettings.chequeLogoWidth ? reduxSettings.chequeLogoWidth : 128}
														height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
														alt="logo"
													/>
												</>
											}
										</div>
									</div>
									<h6 className="text-center text-uppercase fw-700 mb-2">{t('duplicate')}</h6>
									<h6 className="text-center fw-700 mb-2">
										{selectedItem &&
											cashbox.posName
										}
									</h6>
									<h6 className="text-center fw-600 mb-2">
										<span className="me-1">{t('phone')}:</span>
										{selectedItem &&
											cashbox.posPhone
										}
									</h6>
									<h6 className="text-center fw-500 mb-2">
										<span className="me-1">{t('address')}:</span>
										{selectedItem &&
											cashbox.posAddress
										}
									</h6>
								</div>
							</div>

							<div className="cheque-block-1 fz14">
								{cashbox.tin &&
									<div className="d-flex justify-content-between">
										<p>{t('inn')}</p>
										<p>{cashbox.tin}</p>
									</div>
								}
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('cashier')}</p>
									<p>{selectedItem.cashierName}</p>
								</div>
								{/* {!!selectedItem.uzumPaymentId &&
									<div className="d-flex justify-content-between">
										<p>Uzum ID</p>
										<p>{selectedItem.uzumPaymentId}</p>
									</div>
								}
								{!!selectedItem.uzumClientPhone &&
									<div className="d-flex justify-content-between">
										<p>Uzum {t('phone')}</p>
										<p>{selectedItem.uzumClientPhone}</p>
									</div>
								} */}
								{!!selectedItem?.fiscalResult?.ReceiptSeq &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">№ {t('check_number')}</p>
										<p>{data?.fiscalResult?.ReceiptSeq}</p>
									</div>
								}
								<div className="d-flex justify-content-between">
									<p>ID {t('check_number')}</p>
									<p>{selectedItem.chequeNumber}</p>
								</div>
								{!!selectedItem.chequeOfdType &&
									<div className="d-flex justify-content-between">
										<p>Chek turi</p>
										<p>
											{selectedItem.chequeOfdType === 1 &&
												<span>Sotuv</span>
											}
											{selectedItem.chequeOfdType === 2 &&
												<span>Kredit</span>
											}
											{selectedItem.chequeOfdType === 3 &&
												<span>Avans</span>
											}
										</p>
									</div>
								}
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('date')}</p>
									<p>{formatUnixTime(selectedItem.chequeDate)}</p>
								</div>
							</div>
							<div className="overflow-hidden">
								*****************************************************************************************
							</div>
							<div className="cheque-block-2">
								<table className="custom-cheque-table w-100 fz14">
									<thead>
										<tr>
											<th className="text-start w-50">{t('product')}</th>
											<th className="text-end">{t('price')}</th>
										</tr>
									</thead>
									<tbody>
										{Object.keys(selectedItem).length !== 0 &&
											selectedItem.itemsList.map((item, index) => (
												<Fragment key={index}>
													<tr key={index}>
														{/* column 1 */}
														<td className="d-flex text-break-spaces">
															{(item.returned === 0 || item.returned === 1) ?
																<b>{index + 1}. {item.productName}</b>
																:
																<b><del>{index + 1}. {item.productName}</del></b>
															}
														</td>
														{/* column 1 */}
													</tr>
													<tr>
														<td colSpan={3}>
															<div className="ms-2">
																<div className="text-end align-top">
																	{item.returned === 0 &&
																		<span className="text-nowrap">
																			{formatMoney(item.quantity)}
																			{'*' + formatMoney(item.salePrice)}=
																			{formatMoney(item.totalPrice)}
																		</span>
																	}
																	{item.returned === 1 &&
																		<>
																			<div className="text-nowrap">
																				{formatMoney(item.quantity)}
																				{'*' + formatMoney(item.salePrice)}=
																				{formatMoney(item.totalPrice)}
																				<div>
																					<del>
																						{formatMoney(item.returnedQuantity === 0 ? item.quantity : item.returnedQuantity)}
																						{'*' + formatMoney(item.salePrice)}=
																						{formatMoney(item.returnedPrice)}
																					</del>
																				</div>
																			</div>
																		</>
																	}
																	{item.returned === 2 &&
																		<div className="text-nowrap">
																			<del>
																				{formatMoney(item.quantity)}
																				{'*' + formatMoney(item.salePrice)}=
																				{formatMoney(item.totalPrice)}
																			</del>
																		</div>
																	}
																</div>
																<div className="d-flex justify-content-between">
																	<div>O'lchov birligi</div>
																	<div className="text-end">
																		{item.packageCode ?
																			<span>{item.packageName}</span>
																			:
																			<span>{item.uomName}</span>
																		}
																	</div>
																</div>
																{!!item.discountAmount &&
																	<div className="d-flex justify-content-between">
																		<div>Chegirma</div>
																		<div>
																			<span>{formatMoney(item.discountAmount)}</span>
																		</div>
																	</div>
																}
																<div className="d-flex justify-content-between">
																	<div>QQS ({formatMoney(item.vat)}%)</div>
																	<div>
																		{item.vat === 0 ?
																			<span>0</span>
																			:
																			<span>{calculateVat(index)}</span>
																		}
																	</div>
																</div>
																{item.gtin &&
																	<>
																		<div className="d-flex justify-content-between">
																			<div>Sh.k</div>
																			<div>{item.barcode}</div>
																		</div>
																		<div className="d-flex justify-content-between">
																			<div>MXIK</div>
																			<div>{item.gtin}</div>
																		</div>
																	</>
																}
																{item.markingNumber &&
																	<div className="d-flex justify-content-between">
																		<div>MK</div>
																		<div>{item.markingNumber}</div>
																	</div>
																}
															</div>
														</td>
													</tr>
												</Fragment>
											))}
									</tbody>
								</table>
							</div>
							<div className="overflow-hidden">
								*****************************************************************************************
							</div>
							<div className="cheque-block-3 mb-2 fz14">
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('sale_amount')}</p>
									{selectedItem.totalPrice &&
										<p>{formatMoney(selectedItem.totalPrice)}</p>
									}
								</div>
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('vat_amount')}</p>
									{calculateTotalVat() > 0 ?
										<p className="fw-600">{formatMoney(calculateTotalVat())}</p>
										:
										<p>{formatMoney(0)}</p>
									}
								</div>
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('discount')}</p>
									{selectedItem.discountAmount ?
										<p>{formatMoney(selectedItem.discountAmount)}</p>
										:
										<p>{formatMoney(0)}</p>
									}
								</div>
								<div className="d-flex justify-content-between">
									<p className="fw-600 fz20">{t('to_pay')}</p>
									{selectedItem.totalPrice &&
										<p className="fw-600 fz20">{formatMoney(selectedItem.totalPrice - selectedItem.discountAmount)}</p>
									}
								</div>
								{selectedItem.returned > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('final_price')}</p>
										{selectedItem.finalAmount &&
											<p className="fw-600">{formatMoney(selectedItem.finalAmount)}</p>
										}
									</div>
								}
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('paid')}</p>
									{selectedItem.paid &&
										<p className="fw-600">{formatMoney(selectedItem.paid)}</p>
									}
								</div>
								{selectedItem.saleCurrencyId > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('currency')}</p>
										{selectedItem.saleCurrencyId === 1 &&
											<p className="text-capitalize">{t('sum')}</p>
										}
										{selectedItem.saleCurrencyId === 2 &&
											<p>USD</p>
										}
									</div>
								}
								{(Object.keys(selectedItem).length > 0 && selectedItem?.transactionsList?.length > 0) &&
									selectedItem?.transactionsList?.map((item, index) => (
										<div className="d-flex justify-content-between" key={index}>
											{item.paymentPurposeId !== 3 &&
												<>
													<p className="fw-600">{item.paymentTypeName}</p>
													<p>{formatMoney(item.amountIn)}</p>
												</>
											}
											{item.paymentPurposeId === 3 &&
												<>
													<p className="fw-600">{item.paymentPurposeName}</p>
													<p>{formatMoney(item.amountOut)}</p>
												</>
											}
										</div>
									))
								}
								{selectedItem.loyaltyClientName &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('client')}</p>
										<p>{selectedItem.loyaltyClientName}</p>
									</div>
								}
								{selectedItem.loyaltyBonus > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">Loyalty {t('bonus')}</p>
										<p>{selectedItem.loyaltyBonus}</p>
									</div>
								}
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('change')}</p>
									{selectedItem.change ?
										<p>{formatMoney(selectedItem.change)}</p>
										:
										<p>{formatMoney(0)}</p>
									}
								</div>
								{Number(selectedItem.clientAmount) > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('debt_amount')}</p>
										{selectedItem.clientAmount &&
											<p>{formatMoney(selectedItem.clientAmount)}</p>
										}
									</div>
								}
								{Number(selectedItem.clientAmount) > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('debtor')}</p>
										{selectedItem.clientName &&
											<p>{selectedItem.clientName}</p>
										}
									</div>
								}
								{Number(selectedItem.organizationAmount) > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('debt_amount')}</p>
										{selectedItem.organizationAmount &&
											<p>{formatMoney(selectedItem.organizationAmount)}</p>
										}
									</div>
								}
								{Number(selectedItem.organizationAmount) > 0 &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('debtor')}</p>
										{selectedItem.organizationName &&
											<p>{selectedItem.organizationName}</p>
										}
									</div>
								}
								{(Number(selectedItem.organizationAmount) === 0 && selectedItem.organizationName) &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('organization')}</p>
										{selectedItem.organizationName &&
											<p>{selectedItem.organizationName}</p>
										}
									</div>
								}
								{(Number(selectedItem.clientAmount) === 0 && selectedItem.clientName) &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('client')}</p>
										{selectedItem.clientName &&
											<p>{selectedItem.clientName}</p>
										}
									</div>
								}
								{selectedItem.agentName &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('agent')}</p>
										{selectedItem.agentName &&
											<p>{selectedItem.agentName}</p>
										}
									</div>
								}
								{!!selectedItem.clientReturnDate &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('return_date')}</p>
										<p>{formatDateWithTime(selectedItem.clientReturnDate, 'dd.MM.yyyy')}</p>
									</div>
								}
								{!!selectedItem.organizationReturnDate &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('return_date')}</p>
										<p>{formatDateWithTime(selectedItem.organizationReturnDate, 'dd.MM.yyyy')}</p>
									</div>
								}
								{/* FISCAL INFO */}
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('serial_number')}</p>
									<p>20220778</p>
								</div>
								{selectedItem?.appletVersion &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('virtual_cashbox')}</p>
										<p>{globalValue('projectName')}</p>
									</div>
								}
								{selectedItem?.terminalID &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">{t('fm_number')}</p>
										<p>{selectedItem?.terminalID}</p>
									</div>
								}
								{selectedItem?.fiscalSign &&
									<div className="d-flex justify-content-between">
										<p className="fw-600">№ {t('fiscal_symbol')}</p>
										<p>{selectedItem?.fiscalSign}</p>
									</div>
								}
								{/* FISCAL INFO */}
							</div>
							{(selectedItem?.qRCodeURL && reduxSettings.showQrCode) &&
								<div className="d-flex justify-content-center">
									<QRCode value={selectedItem?.qRCodeURL} size={125} />
								</div>
							}
							{(selectedItem.chequeNumber && reduxSettings.showBarcode) &&
								<div className="d-flex justify-content-center">
									<Barcode value={selectedItem.chequeNumber.toString()}
										lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'}
										width={2} height={30} displayValue={false} background="transparent" />
								</div>
							}
							<div className="overflow-hidden">
								*****************************************************************************************
							</div>
							{!reduxSettings.additionalInformation &&
								<div className="d-flex justify-content-center mb-2">
									<p>{t('thank_you_for_your_purchase')}!</p>
								</div>
							}
							{reduxSettings.additionalInformation &&
								<div className="d-flex justify-content-center">
									<p>{reduxSettings.additionalInformationText}!</p>
								</div>
							}
						</div>
						<div className="d-flex cheques-right-buttons-wrapper">
							<Dropdown className="d-flex cursor w-100 me-4">
								<Dropdown.Toggle as={printToggle}>
									<button className="btn btn-primary text-uppercase w-100" disabled={!Object.keys(selectedItem).length}>{t('printing')}</button>
								</Dropdown.Toggle>

								<Dropdown.Menu>
									<Dropdown.Item>
										<div className="d-flex justify-content-center" onClick={() => printCheque(1)}>
											<PrintOutlined className="color-62 me-2" />
											{t('print')}
										</div>
									</Dropdown.Item>
									<Dropdown.Item>
										<div className="d-flex justify-content-center" onClick={() => printCheque(2)}>
											<DescriptionOutlined className="color-62 me-2" />
											EXCEL
										</div>
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
							<button className="btn btn-danger text-uppercase w-100"
								disabled={!Object.keys(selectedItem).length}
								onClick={() => redirectToReturn(selectedItem.chequeNumber)}>
								{t('return')}
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className={`main d-none ${returnPrinterWidth()}`} ref={printChequeRef}>
				<div className="d-flex justify-content-center w-100 mt-3 mb-2">
					<div className="d-flex flex-column w-100">
						<div className="d-flex justify-content-center mb-2">
							<div className="d-flex">
								{reduxSettings.logoPath ?
									<img src={reduxSettings.logoPath}
										width={reduxSettings.chequeLogoWidth ? reduxSettings.chequeLogoWidth : 128}
										height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
										alt="logo"
									/>
									:
									<>
										<img src={`${globalValue('url')}/logo.svg`}
											width={reduxSettings.chequeLogoWidth ? reduxSettings.chequeLogoWidth : 128}
											height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
											alt="logo"
										/>
									</>
								}
							</div>
						</div>
						<h5 className="text-center fw-700">Dublikat</h5>
						<h3 className="text-center fw-700 mb-2">
							{selectedItem &&
								cashbox.posName
							}
						</h3>
						<h5 className="text-center fw-600 mb-2">
							<span className="me-1">Telefon:</span>
							{selectedItem &&
								cashbox.posPhone
							}
						</h5>
						<h5 className="text-center fw-500 mb-2">
							<span className="me-1">Manzil:</span>
							{selectedItem &&
								cashbox.posAddress
							}
						</h5>
					</div>
				</div>

				<div className="cheque-block-1 fz12">
					<div className="d-flex justify-content-between">
						<p className="fw-600">Kassir</p>
						<p>{selectedItem.cashierName}</p>
					</div>
					{/* {selectedItem.uzumPaymentId &&
						<div className="d-flex justify-content-between">
							<p>Uzum ID</p>
							<p>{selectedItem.uzumPaymentId}</p>
						</div>
					}
					{selectedItem.uzumClientPhone &&
						<div className="d-flex justify-content-between">
							<p>Uzum telefon</p>
							<p>{selectedItem.uzumClientPhone}</p>
						</div>
					} */}
					<div className="d-flex justify-content-between">
						<p className="fw-600">ID chek</p>
						<p>{selectedItem.chequeNumber}</p>
					</div>
					{selectedItem?.receiptSeq &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">№ chek</p>
							<p>{selectedItem?.receiptSeq}</p>
						</div>
					}
					{selectedItem.chequeOfdType &&
						<div className="d-flex justify-content-between">
							<p>Chek turi</p>
							<p>
								{selectedItem.chequeOfdType === 1 &&
									<span>Sotuv</span>
								}
								{selectedItem.chequeOfdType === 2 &&
									<span>Kredit</span>
								}
								{selectedItem.chequeOfdType === 3 &&
									<span>Avans</span>
								}
							</p>
						</div>
					}
					<div className="d-flex justify-content-between">
						<p className="fw-600">Sana</p>
						<p>{formatUnixTime(selectedItem.chequeDate)}</p>
					</div>
				</div>
				<div className="overflow-hidden">
					*****************************************************************************************
				</div>
				<div className="cheque-block-2">
					<table className="custom-cheque-table w-100 fz12">
						<thead>
							<tr>
								<th className="text-start w-50">№ Mahsulot</th>
								<th className="text-end"></th>
							</tr>
						</thead>
						<tbody>
							{Object.keys(selectedItem).length !== 0 &&
								selectedItem.itemsList.map((item, index) => (
									<Fragment key={index}>
										<tr key={index}>
											{/* column 1 */}
											<td className="d-flex text-break-spaces">
												{(item.returned === 0 || item.returned === 1) ?
													<span>{index + 1}. {item.productName}</span>
													:
													<span><del>{index + 1}. {item.productName}</del></span>
												}
											</td>
											{/* column 1 */}

											{/* column 2 */}

											<td className="text-end align-top">
												{item.returned === 0 &&
													<span className="text-nowrap">
														{formatMoney(item.quantity)}
														{item.packageCode ?
															<span>{item.packageName}</span>
															:
															<span>{item.uomName}</span>
														}
														{'*' + formatMoney(item.salePrice)}=
														{formatMoney(item.totalPrice)}
													</span>
												}
												{item.returned === 1 &&
													<>
														<div className="text-nowrap">
															{formatMoney(item.quantity)}
															{item.packageCode ?
																<span>{item.packageName}</span>
																:
																<span>{item.uomName}</span>
															}
															{'*' + formatMoney(item.salePrice)}=
															{formatMoney(item.totalPrice)}
															<div>
																<del>
																	{formatMoney(item.returnedQuantity === 0 ? item.quantity : item.returnedQuantity)}
																	{item.packageCode ?
																		<span>{item.packageName}</span>
																		:
																		<span>{item.uomName}</span>
																	}
																	{'*' + formatMoney(item.salePrice)}=
																	{formatMoney(item.returnedPrice)}
																</del>
															</div>
														</div>
													</>
												}
												{item.returned === 2 &&
													<div className="text-nowrap">
														<del>
															{formatMoney(item.quantity)}
															{item.packageCode ?
																<span>{item.packageName}</span>
																:
																<span>{item.uomName}</span>
															}
															{'*' + formatMoney(item.salePrice)}=
															{formatMoney(item.totalPrice)}
														</del>
													</div>
												}
											</td>
											{/* column 2 */}
										</tr>
										<tr>
											<td colSpan={3}>
												{!!item.discountAmount &&
													<div className="d-flex justify-content-between">
														<div>Chegirma</div>
														<div>
															<span>{formatMoney(item.discountAmount)}</span>
														</div>
													</div>
												}
												<div className="ms-2">
													<div className="d-flex justify-content-between">
														<div>QQS ({formatMoney(item.vat)}%)</div>
														<div>
															{item.vat === 0 ?
																<span>0</span>
																:
																<span>{calculateVat(index)}</span>
															}
														</div>
													</div>
													{item.gtin &&
														<>
															<div className="d-flex justify-content-between">
																<div>Sh.k</div>
																<div>{item.barcode}</div>
															</div>
															<div className="d-flex justify-content-between">
																<div>MXIK</div>
																<div>{item.gtin}</div>
															</div>
														</>
													}
													{item.markingNumber &&
														<div className="d-flex justify-content-between">
															<div>MK</div>
															<div>{item.markingNumber}</div>
														</div>
													}
													{item.organizationTin &&
														<div className="d-flex justify-content-between">
															<div>Komintant STIR</div>
															<div>{item.organizationTin}</div>
														</div>
													}
												</div>
											</td>
										</tr>
									</Fragment>
								))}
						</tbody>
					</table>
				</div>
				<div className="overflow-hidden">
					*****************************************************************************************
				</div>
				<div className="cheque-block-3 mb-2 fz12">
					<div className="d-flex justify-content-between">
						<p className="fw-600">Sotish miqdori</p>
						{selectedItem.totalPrice &&
							<p>{formatMoney(selectedItem.totalPrice)}</p>
						}
					</div>
					<div className="d-flex justify-content-between">
						<p className="fw-600">QQS Jami</p>
						{calculateTotalVat() > 0 ?
							<p className="fw-600">{formatMoney(calculateTotalVat())}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>
					<div className="d-flex justify-content-between">
						<p className="fw-600">Chegirma Jami</p>
						{selectedItem.discountAmount ?
							<p>{formatMoney(selectedItem.discountAmount)}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>
					<div className="d-flex justify-content-between">
						<p className={'fw-700 ' + (reduxSettings.checkPrintWidth === "80" ? 'fz20' : 'fz16')}>{t('to_pay')}</p>
						{selectedItem.totalPrice &&
							<p className={'fw-700 ' + (reduxSettings.checkPrintWidth === "80" ? 'fz20' : 'fz16')}>
								{formatMoney(selectedItem.totalPrice - selectedItem.discountAmount)}
							</p>
						}
					</div>
					{selectedItem.returned > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Jami</p>
							{selectedItem.finalAmount &&
								<p className="fw-600">{formatMoney(selectedItem.finalAmount)}</p>
							}
						</div>
					}
					<div className="d-flex justify-content-between">
						<p className="fw-600">To'landi</p>
						{selectedItem.paid ?
							<p className="fw-600">{formatMoney(selectedItem.paid)}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>
					{selectedItem.saleCurrencyId > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Valyuta</p>
							{selectedItem.saleCurrencyId === 1 &&
								<p className="text-capitalize">So'm</p>
							}
							{selectedItem.saleCurrencyId === 2 &&
								<p>USD</p>
							}
						</div>
					}
					{(Object.keys(selectedItem).length > 0 && selectedItem.transactionsList.length > 0) &&
						selectedItem.transactionsList.map((item, index) => (
							<div className="d-flex justify-content-between" key={index}>
								{item.paymentPurposeId !== 3 &&
									<>
										<p className="fw-600">{item.paymentTypeName}</p>
										<p>{formatMoney(item.amountIn)}</p>
									</>
								}
								{item.paymentPurposeId === 3 &&
									<>
										<p className="fw-600">{item.paymentPurposeName}</p>
										<p>{formatMoney(item.amountOut)}</p>
									</>
								}
							</div>
						))
					}
					{selectedItem.loyaltyClientName != null &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Mijoz</p>
							<p>{selectedItem.loyaltyClientName}</p>
						</div>
					}
					{selectedItem.agentName &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Agent</p>
							{selectedItem.agentName &&
								<p>{selectedItem.agentName}</p>
							}
						</div>
					}
					{selectedItem.loyaltyBonus > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Loyalty Bonus</p>
							<p>{selectedItem.loyaltyBonus}</p>
						</div>
					}
					<div className="d-flex justify-content-between">
						<p className="fw-600">Qaytim</p>
						{selectedItem.change &&
							<p>{formatMoney(selectedItem.change)}</p>
						}
					</div>
					{Number(selectedItem.clientAmount) > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qarz miqdori</p>
							{selectedItem.clientAmount &&
								<p>{formatMoney(selectedItem.clientAmount)}</p>
							}
						</div>
					}
					{Number(selectedItem.clientAmount) > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qarzdor</p>
							{selectedItem.clientName &&
								<p>{selectedItem.clientName}</p>
							}
						</div>
					}
					{Number(selectedItem.organizationAmount) > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qarz miqdori</p>
							{selectedItem.organizationAmount &&
								<p>{formatMoney(selectedItem.organizationAmount)}</p>
							}
						</div>
					}
					{Number(selectedItem.organizationAmount) > 0 &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qarzdor</p>
							{selectedItem.organizationName &&
								<p>{selectedItem.organizationName}</p>
							}
						</div>
					}
					{(Number(selectedItem.clientAmount) === 0 && selectedItem.clientName) &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Mijoz</p>
							{selectedItem.clientName &&
								<p>{selectedItem.clientName}</p>
							}
						</div>
					}
					{(Number(selectedItem.organizationAmount) === 0 && selectedItem.organizationName) &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Taminotchi</p>
							{selectedItem.organizationName &&
								<p>{selectedItem.organizationName}</p>
							}
						</div>
					}

					{!!selectedItem.clientReturnDate &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qaytarish kuni</p>
							<p>{formatDateWithTime(selectedItem.clientReturnDate, 'dd.MM.yyyy')}</p>
						</div>
					}
					{!!selectedItem.organizationReturnDate &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Qaytarish kuni</p>
							<p>{formatDateWithTime(selectedItem.organizationReturnDate, 'dd.MM.yyyy')}</p>
						</div>
					}

				</div>
				{/* FISCAL INFO */}
				<div className="d-flex justify-content-between">
					<p className="fw-600">Serial raqam</p>
					<p>20220778</p>
				</div>
				{selectedItem?.appletVersion &&
					<div className="d-flex justify-content-between">
						<p className="fw-600">Virtual kassa</p>
						<p>{globalValue('projectName')}</p>
					</div>
				}
				{selectedItem?.terminalID &&
					<div className="d-flex justify-content-between">
						<p className="fw-600">Fiskal raqam</p>
						<p>{selectedItem?.terminalID}</p>
					</div>
				}
				{selectedItem?.fiscalSign &&
					<div className="d-flex justify-content-between">
						<p className="fw-600">№ Fiskal belgi</p>
						<p>{selectedItem?.fiscalSign}</p>
					</div>
				}
				{/* FISCAL INFO */}
				{(selectedItem?.qRCodeURL && reduxSettings.showQrCode) &&
					<div className="d-flex justify-content-center">
						<QRCode value={selectedItem?.qRCodeURL} size={160} />
					</div>
				}
				{(selectedItem.chequeNumber && reduxSettings.showBarcode) &&
					<div className="d-flex justify-content-center">
						<Barcode value={selectedItem.chequeNumber.toString()} width={2} height={30} displayValue={false} background="transparent" />
					</div>
				}
				<div className="overflow-hidden">
					*****************************************************************************************
				</div>
				<div className="d-flex justify-content-center mb-2">
					<p>{t('thank_you_for_your_purchase')}!</p>
				</div>
				{reduxSettings.additionalInformation &&
					<div className="d-flex justify-content-center">
						<p>{reduxSettings.additionalInformationText}!</p>
					</div>
				}
			</div>
		</>
	)
}

export default Cheques
