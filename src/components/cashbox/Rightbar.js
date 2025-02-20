import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux'
import {
	MenuOutlined, AppsOutlined, PrintOutlined, KeyboardOutlined, BackspaceOutlined,
	CheckCircleOutlineOutlined,
	LocalOfferOutlined, CloseOutlined, TuneOutlined, FileCopyOutlined,
	CreateNewFolderOutlined, FolderOpenOutlined, CloudCircleOutlined,
	FileCopy
} from '@material-ui/icons';
import { DebounceInput } from 'react-debounce-input';
import { Modal } from 'react-bootstrap';
import { SET_CASHBOX } from 'store/actions/cashbox'
import { toast } from 'react-toastify';

import { SET_PRINTER_BROKEN } from 'store/actions/settings'
import { formatMoney } from 'helpers/helpers'
import { GET, globalValue } from 'api/api';

import logo_icon from '../../assets/images/logo_icon.svg'
import useDidMountEffect from './useDidMountEffect';

function Rightbar({
	rightBar,
	showRightBar,
	searchProduct,
	cancelDiscount,
	printChequeCopy,
	addChequeToSaved,
	getChequeFromSaved,
	getChequeFromCloud,
	chequeCopyExcel,
	tabSearchInput,
	tabSetSearchInput,
	handleShortcut,
	searchByNameValue,
	onKeyDown,
}) {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	const cashbox = useSelector(state => state.cashbox)
	const reduxSettings = useSelector(state => state.settings.settings)
	const selectedProducts = useSelector(state => state.backendHelpers.selectedProducts)

	const [showCancelDiscountModal, setShowCancelDiscountModal] = useState(false)
	const [products, setProducts] = useState([])
	const [selectedProductsList, setSelectedProductsList] = useState([])
	const [listView, setListView] = useState(0)
	const [searchInput, setSearchInput] = useState("");

	function getProductsLimited() {
		window.electron.dbApi.getProductsLimited().then(response => {
			setProducts(response)
		})
	}

	function searchByName(search) {
		if (search.length > 0) {
			window.electron.dbApi.findProductsByName({
				'search': search,
				'searchExact': reduxSettings.searchExact,
			}).then(response => {
				setProducts(response.row)
			})
		} else {
			getProductsLimited()
		}
	}

	function handleSearchInput(value) {
		tabSetSearchInput((tabSearchInput ?? '') + value)
	}

	function searchInSelectedProducts(search) {
		search = search.toLowerCase()
		if (search.length > 0) {
			var selectedProductsListCopy = [...selectedProductsList]
			var arr = []
			for (let i = 0; i < selectedProductsListCopy.length; i++) {
				if (selectedProductsListCopy[i]['productName'].toLowerCase().includes(search) || selectedProductsListCopy[i]['productBarcode'].toLowerCase().includes(search)) {
					arr.push(selectedProductsListCopy[i])
				}
			}
			setSelectedProductsList(arr)
		} else {
			setSelectedProductsList(selectedProducts)
		}
	}

	function toggleRigthBar(tab) {
		setListView(tab)
		showRightBar(true)
	}

	function setPrinterBroken() {
		dispatch(SET_PRINTER_BROKEN())
	}

	async function getAccessPos() {
		var response = await GET("/services/desktop/api/get-access-pos")
		if (response.openShift) {
			dispatch(SET_CASHBOX(response.shift))
			getBalanceProductList(response.shift.posId, response.shift.cashboxId, response.shift.defaultCurrency)
		}

		var organizations = await GET("/services/desktop/api/organization-helper")
		window.electron.dbApi.deleteOrganizations()
		window.electron.dbApi.insertOrganizations(organizations).catch(e => { toast.error(e) })
	}

	function getBalanceProductList(posId, cashboxId, defaultCurrency) {
		GET("/services/desktop/api/get-balance-product-list/" + posId + "/" + defaultCurrency).then(response => {
			window.electron.dbApi.deleteProducts()
			window.electron.dbApi.insertProducts(response).catch(e => { toast.error(e) })

			setTimeout(() => {
				window.location.reload();
			}, 1000);
		})
	}

	useEffect(() => {
		getProductsLimited()
		setSelectedProductsList(selectedProducts)
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	useDidMountEffect(() => {
		setSearchInput(searchByNameValue)
		searchByName(searchByNameValue)
		searchInSelectedProducts(searchByNameValue)
	}, [searchByNameValue]) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={"tab-rightbar " + (!rightBar ? 'w-3 transition07' : 'w-33 rightbar-wrapper')}>
			{!rightBar ?
				<div className="vertical-column">
					<div className="righbar-closed-icon mb-3 py-1" onClick={() => getAccessPos()} title={t('update_pos_details')}>
						<TuneOutlined />
					</div>
					<div className="righbar-closed-icon mb-3 py-1"
						title={t('cancel_discount_title')}
						onClick={() => setShowCancelDiscountModal(true)}>
						<LocalOfferOutlined />
					</div>
					<div className="righbar-closed-icon mb-3 py-1" onClick={() => setPrinterBroken()} title={t('printer_problems')}>
						<PrintOutlined style={{ color: reduxSettings?.printerBroken ? "dc3545" : "626262" }} />
					</div>
					<div className="righbar-closed-icon mb-3 py-1">
						<MenuOutlined className={(listView === 1 ? 'rightbar-icon-active' : '')}
							onClick={() => toggleRigthBar(1)} />
					</div>
					<div className="righbar-closed-icon mb-3 py-1">
						<AppsOutlined className={(listView === 2 ? 'rightbar-icon-active' : '')}
							onClick={() => toggleRigthBar(2)} />
					</div>
					<div className="righbar-closed-icon mb-3 py-1">
						<KeyboardOutlined className={(listView === 3 ? 'rightbar-icon-active' : '')}
							onClick={() => toggleRigthBar(3)} />
					</div>
					{reduxSettings?.chequeCopy &&
						<div className="righbar-closed-icon mb-3 py-1"
							onClick={() => printChequeCopy()}
							title={t('cheque_copy')}>
							<FileCopyOutlined />
						</div>
					}
					{reduxSettings?.chequeCopyExcel &&
						<div className="righbar-closed-icon mb-3 py-1"
							onClick={() => chequeCopyExcel()}
							title={t('cheque_excel')}>
							<FileCopy />
						</div>
					}
					{reduxSettings?.postponeOnline &&
						<>
							<div className="righbar-closed-icon py-1" onClick={() => addChequeToSaved('online')}>
								<CreateNewFolderOutlined />
							</div>
							<div className="righbar-closed-icon mb-3 py-1" onClick={() => getChequeFromSaved('online')}>
								<FolderOpenOutlined />
							</div>
						</>
					}
					{reduxSettings?.postponeOffline &&
						<>
							<div className="righbar-closed-icon py-1" onClick={() => addChequeToSaved('offline')}>
								<CreateNewFolderOutlined />
							</div>
							<div className="righbar-closed-icon mb-3 py-1" onClick={() => getChequeFromSaved('offline')}>
								<FolderOpenOutlined />
							</div>
						</>
					}
					<div className="righbar-closed-icon mb-3 py-1" onClick={() => getChequeFromCloud()}>
						<CloudCircleOutlined />
					</div>
				</div>
				:
				<div className="vertical-column p-2">
					{(listView === 1 || listView === 2) &&
						<div className="d-flex justify-content-between mb-2">
							{listView === 1 &&
								<h6 className="py-1"><strong>{t('quick_selection')}</strong></h6>
							}
							{listView === 2 &&
								<h6 className="py-1"><strong>{t('all_products')}</strong></h6>
							}
							<div className="d-flex justify-content-end search-icon">
								<div className="text-center">
									<MenuOutlined className={"rightbar-icon me-2 " + (listView === 1 ? 'rightbar-icon-active' : '')} onClick={() => setListView(1)} />
								</div>
								<div className="text-center">
									<AppsOutlined className={"rightbar-icon me-2 " + (listView === 2 ? 'rightbar-icon-active' : '')} onClick={() => setListView(2)} />
								</div>
							</div>
						</div>
					}

					{listView === 1 &&
						<div>
							<DebounceInput
								type="text"
								className="custom-input fz14 mb-2"
								placeholder={t('product_name')}
								debounceTimeout={300}
								onChange={(e) => { searchInSelectedProducts(e.target.value); }}
								value={searchInput}
							/>
							<div className="table-responsive rightbar-table no-scroll">
								<table className="table fz14 m-0">
									<thead>
										<tr>
											<th>{t('name')}</th>
											<th className="text-end">{t('barcode')}</th>
										</tr>
									</thead>
									<tbody>
										{selectedProductsList.length > 0 ?
											selectedProductsList.map((item, index) => (
												<tr className="cashbox-table-bg-on-hover cursor" key={index}
													onDoubleClick={() => searchProduct({ 'barcode': item.productBarcode })}>
													<td>{item.productName}</td>
													<td className="text-end">{item.productBarcode}</td>
												</tr>
											))
											:
											<tr>
												<td colSpan="2" className="text-center">{t('nothing_found')}</td>
											</tr>
										}
									</tbody>
								</table>
							</div>
						</div>
					}
					{listView === 2 &&
						<div>
							<DebounceInput
								type="text"
								className="custom-input fz14 mb-2"
								placeholder={t('product_name')}
								debounceTimeout={300}
								value={searchInput}
								onChange={(e) => { searchByName(e.target.value); setSearchInput(e.target.value) }}
							/>
							<div className="rightbar-table no-scroll d-block mt-2 row mx-md-n2">
								{products.map((item, index) => (
									<div className="col-md-6 px-md-2 mb-2 rightbar-table-item" key={index}>
										<div className="d-flex justify-content-center bg-f6 cashbox-product-image-wrapper cursor">
											<div className="w-100" onDoubleClick={() => searchProduct({ 'barcode': item.barcode })}>
												{(item.productImageUrl === null || item.productImageUrl === '') ?
													<img src={logo_icon} alt="logo" />
													:
													<img src={`${globalValue('url')}${item.productImageUrl}`} alt="" />
												}
											</div>
										</div>
										<div className="card-background text-dots p-1" title={item.productName}>{item.productName}</div>
										<span className="rightbar-table-price">{formatMoney(item.salePrice)} {cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span>
									</div>
								))}
							</div>
						</div>
					}
					{listView === 3 &&
						<div className="keyboard">

							<div className="d-flex gap-1">
								<div className="keyboard-button" onClick={() => handleSearchInput('7')}>
									7
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('8')}>
									8
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('9')}>
									9
								</div>
							</div>
							<div className="d-flex gap-1">
								<div className="keyboard-button" onClick={() => handleSearchInput('4')}>
									4
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('5')}>
									5
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('6')}>
									6
								</div>
							</div>
							<div className="d-flex gap-1">
								<div className="keyboard-button" onClick={() => handleSearchInput('1')}>
									1
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('2')}>
									2
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('3')}>
									3
								</div>
							</div>
							<div className="d-flex gap-1">
								<div className="keyboard-button" onClick={() => tabSetSearchInput(tabSearchInput?.slice(0, -1))}>
									<BackspaceOutlined className="text-danger" />
								</div>
								<div className="keyboard-button" onClick={() => handleSearchInput('0')}>
									0
								</div>
								<div className="keyboard-button" onClick={() => searchProduct({ barcode: tabSearchInput })}>
									<CheckCircleOutlineOutlined className="text-success" />
								</div>
							</div>
							<div className="d-flex gap-1">
								<div className="keyboard-button" onClick={() => handleShortcut({ key: '+' })}>
									+
								</div>
								<div className="keyboard-button" onClick={() => handleShortcut({ key: '*' })}>
									*
								</div>
							</div>
							<div className="d-flex gap-1 color-00">
								<div className="keyboard-button" onClick={() => handleShortcut({ key: 'F5' })}>
									F5
								</div>
								<div className="keyboard-button" onClick={() => handleShortcut({ key: 'F6' })}>
									F6
								</div>
								<div className="keyboard-button" onClick={() => onKeyDown({ keyCode: 119 }, true)}>
									F8
								</div>
							</div>
						</div>
					}
				</div>
			}

			{/* CONFIRM CANCEL DISCOUNT MODAL MODAL */}
			<Modal show={showCancelDiscountModal} animation={false} centered
				dialogClassName="payment-terminal-modal-width"
				onHide={() => setShowCancelDiscountModal(false)}>
				<Modal.Body>
					<div className="modal-custom-close-button"
						onClick={() => setShowCancelDiscountModal(false)}>
						<CloseOutlined />
					</div>
					<div className="payment-tab-body">
						<div className="w-75 m0-auto">
							<form onSubmit={() => {
								cancelDiscount();
								setShowCancelDiscountModal(false)
							}}>
								<h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
								<h5 className="color-62 my-3"><b>{t('cancel_discount_text')}</b></h5>
								<div className="d-flex gap-3">
									<button type="button" className="btn btn-danger w-100"
										onClick={() => setShowCancelDiscountModal(false)}>{t('cancel')}</button>
									<button type="submit" id="confirmButton" className="btn btn-primary w-100">{t('ok')}</button>
								</div>
							</form>
						</div>
					</div>
				</Modal.Body>
			</Modal>
			{/* CONFIRM CANCEL DISCOUNT MODAL MODAL */}
		</div>
	)
}

export default Rightbar
