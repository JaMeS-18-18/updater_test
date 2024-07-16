
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { Modal } from 'react-bootstrap'
import { DebounceInput } from 'react-debounce-input'

import { PersonOutline, AddOutlined, RemoveOutlined, CloseOutlined } from '@material-ui/icons';
import money from '../../../assets/icons/money.svg';
import creditCard from '../../../assets/icons/credit-card.svg';

import { POST } from 'api/api'
import { formatMoney } from 'helpers/helpers'
import { toast } from 'react-toastify';

function Uget({
	data,
	setData,
	createCheque,
	addLoyaltyCardNumber,
	loyaltyUserInfo,
	setLoyaltyUserInfo,
	loyaltyTransactionsListCash,
	loyaltyTransactionsListTerminal,
	setLoyaltyTransactionsListCash,
	setLoyaltyTransactionsListTerminal,
}) {
	const { t } = useTranslation()

	const loyaltyInputRef = useRef(null);
	const amountInRef = useRef(null);

	const cashbox = useSelector(state => state.cashbox)

	const [showLoyaltyCreateUserModal, setShowLoyaltyCreateUserModal] = useState(false);
	const [loyaltyValidated, setLoyaltyValidated] = useState(false);

	const [loyaltySearchUserInput, setLoyaltySearchUserInput] = useState("");
	const [loyaltyNewUserInfo, setLoyaltyNewUserInfo] = useState({
		"phone": "998", "firstName": '', "gender": 0, "birthDate": '',
	}); // 0 мужчина
	// const [loyaltyTransactionsListCash, setLoyaltyTransactionsListCash] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 1 });
	// const [loyaltyTransactionsListTerminal, setLoyaltyTransactionsListTerminal] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 });

	function searchUserBalance(search) {
		setLoyaltySearchUserInput(search)
		var sendData = {
			'clientCode': search,
			'posId': cashbox.posId,
			'totalPrice': data.totalPrice,
		}
		POST("/services/desktop/api/uget-user-balance", sendData, true).then(response => {
			response.amount = ""
			response.cardNumber = response.cardNumber ? response.cardNumber : ""
			response.addCardNumber = ""
			setLoyaltyUserInfo(response)
		}).catch(e => {
			setLoyaltyUserInfo({
				"award": 0, "balance": 0, "code": 0, "firstName": "",
				"lastName": "", "reason": "", "status": "", "amount": "",
				"addCardNumber": "", "cardNumber": "",
			})
		})
	}

	function addLoyaltyClient(e) {
		e.preventDefault()

		var sendData = {
			'userLogin': loyaltyNewUserInfo.phone,
			'firstName': loyaltyNewUserInfo.firstName,
			'lastName': '',
			'gender': loyaltyNewUserInfo.gender,
			'birthDate': '',
			'posId': cashbox.posId,
		}
		POST("/services/desktop/api/uget-register-client", sendData).then(response => {
			setLoyaltySearchUserInput(loyaltyNewUserInfo.phone)
			toggleCreateloyaltyModal(false)
			setLoyaltyNewUserInfo({ "phone": "998", "firstName": '', "gender": 0 })
		}).catch(e => {
			toast.error(e.response.data.message)
		})
	}

	function toggleCreateloyaltyModal(bool) {
		if (bool) {
			setShowLoyaltyCreateUserModal(bool)
		} else {
			setShowLoyaltyCreateUserModal(bool)
		}
	}

	useEffect(() => {
		setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, "amountIn": data.totalPrice })
		setLoyaltyTransactionsListTerminal({ ...loyaltyTransactionsListTerminal, "amountIn": "" })
		setTimeout(() => {
			loyaltyInputRef?.current?.select()
		}, 100);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (
			loyaltyUserInfo.award >= 0 &&
			loyaltyUserInfo.userId >= 0 &&
			(
				(
					Number(loyaltyTransactionsListCash.amountIn) +
					Number(loyaltyTransactionsListTerminal.amountIn) +
					Number(loyaltyUserInfo.amount)
				).toFixed(0) === data.totalPrice.toFixed(0)
			)
		) {
			setLoyaltyValidated(true)
		} else {
			setLoyaltyValidated(false)
		}
	}, [loyaltyUserInfo.userId, loyaltyUserInfo.award, loyaltyUserInfo.amount, loyaltyTransactionsListCash.amountIn, loyaltyTransactionsListTerminal.amountIn]) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="payment-tab-body">
				<div className="w-75 m0-auto">
					<div className="d-flex justify-content-between">
						<div>
							<h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
							<h5 className="color-62">
								<b>{formatMoney(data.totalPrice)}</b>
								<span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span>
							</h5>
						</div>
						<div className="d-flex">
							<div className="vertical-center me-2">
								{t('discount')}
							</div>
							<div className="vertical-center">
								<input className="ios-switch light" type="checkbox" tabIndex="-1"
									checked={data.loyaltyDiscount}
									onChange={(e) => setData({ ...data, 'loyaltyDiscount': e.target.checked })} />
							</div>
						</div>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('enter_qr_or_phone')}</label>
						<DebounceInput
							type="number"
							className="custom-input"
							placeholder={t('enter_qr_or_phone')}
							debounceTimeout={2000}
							value={loyaltySearchUserInput}
							inputRef={loyaltyInputRef}
							onChange={() => { }}
							onKeyUp={(e) => {
								if (e.keyCode === 13) {
									searchUserBalance(e.target.value)
								}
							}}
						/>
						<span className="input-inner-icon" onClick={() => toggleCreateloyaltyModal(true)}>
							<div className="table-action-button table-action-primary-button">
								<AddOutlined />
							</div>
						</span>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('card_number')}</label>
						{!loyaltyUserInfo.cardNumber ?
							<>
								<input type="number" className="custom-input"
									onChange={(e) => setLoyaltyUserInfo({ ...loyaltyUserInfo, 'addCardNumber': e.target.value })}
									disabled={!loyaltyUserInfo.userLogin}
									value={loyaltyUserInfo.addCardNumber} />
								<span className="input-inner-icon" onClick={addLoyaltyCardNumber}>
									<div className="table-action-button table-action-primary-button">
										<AddOutlined />
									</div>
								</span>
							</>
							:
							<>
								<input type="number" className="custom-input"
									onChange={() => { }}
									disabled
									value={loyaltyUserInfo.cardNumber} />
							</>
						}
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('client')}</label>
						<input type="text" disabled className="custom-input" onChange={function () { }}
							value={loyaltyUserInfo.firstName && loyaltyUserInfo.firstName + ' ' + loyaltyUserInfo.lastName + ' [' + loyaltyUserInfo.status + ' ' + loyaltyUserInfo.award + '%]'} />
						<span className="input-inner-icon">
							<PersonOutline style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
						</span>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('accumulated_points')}</label>
						<input type="text" disabled className="custom-input"
							onChange={function () { }} value={loyaltyUserInfo.balance} />
						<span className="input-inner-icon">
							<AddOutlined style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
						</span>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('points_to_be_deducted')}</label>
						<input type="number" className="custom-input"
							value={loyaltyUserInfo.amount}
							onChange={(e) => {
								if (loyaltyUserInfo.balance >= e.target.value && data.totalPrice >= e.target.value) {
									setLoyaltyUserInfo({ ...loyaltyUserInfo, 'amount': e.target.value })
								}
							}} />
						<span className="input-inner-icon">
							<RemoveOutlined style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
						</span>
					</div>
					<div className="d-flex">
						<div className="form-group position-relative w-100 me-3">
							<label className="color-a2">{t('cash_amount')}</label>
							<input type="text" placeholder="0" className="custom-input" ref={amountInRef}
								value={loyaltyTransactionsListCash.amountIn ? formatMoney(loyaltyTransactionsListCash.amountIn) : ''}
								onChange={e => setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
							<span className="input-inner-icon">
								<img src={money} width={25} alt="money" />
							</span>
						</div>
						<div className="form-group position-relative w-100">
							<label className="color-a2">{t('terminal_amount')}</label>
							<input type="text" placeholder="0" className="custom-input"
								value={loyaltyTransactionsListTerminal.amountIn ? formatMoney(loyaltyTransactionsListTerminal.amountIn) : ''}
								onChange={e => setLoyaltyTransactionsListTerminal({ ...loyaltyTransactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
							<span className="input-inner-icon">
								<img src={creditCard} width={25} alt="credit-card" />
							</span>
						</div>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('points_to_be_credited')}</label>
						<input type="number" disabled className="custom-input"
							value={formatMoney((data.totalPrice - loyaltyUserInfo.amount) * (loyaltyUserInfo.award / 100))} />
						<span className="input-inner-icon">
							<img src={money} width={25} alt="money" />
						</span>
					</div>
					{!!data.loyaltyDiscount &&
						<div className="d-flex justify-content-between py-2">
							<b>{t('discounted_amount')}</b>
							<b>{formatMoney(data.totalPrice - (data.totalPrice * loyaltyUserInfo.award / 100))}</b>
						</div>
					}
					<button className="btn btn-primary w-100 text-uppercase"
						disabled={!loyaltyValidated}
						onClick={(e) => createCheque(e, 'loyalty')}>
						{t('to_accept')}
					</button>
				</div>
			</div>

			{/* LOYALTY CREATE USER MODAL */}
			<Modal show={showLoyaltyCreateUserModal} animation={false} centered
				dialogClassName="x-report-modal-width" onHide={() => toggleCreateloyaltyModal()}>
				<Modal.Body style={{ 'border': '1px solid #000' }}>
					<div className="modal-custom-close-button" onClick={() => toggleCreateloyaltyModal()}><CloseOutlined /></div>
					<div className="payment-tab-body">
						<div className="form-group position-relative">
							<label className="color-a2">{t('phone')} <span className="required-mark">*</span></label>
							<input type="text" className="custom-input" onChange={(e) => setLoyaltyNewUserInfo({ ...loyaltyNewUserInfo, 'phone': e.target.value })}
								value={loyaltyNewUserInfo.phone} />
						</div>
						<div className="form-group position-relative">
							<label className="color-a2">{t('name2')}<span className="required-mark">*</span></label>
							<input type="text" className="custom-input" onChange={(e) => setLoyaltyNewUserInfo({ ...loyaltyNewUserInfo, 'firstName': e.target.value })}
								value={loyaltyNewUserInfo.firstName} />
						</div>
						<div className="form-group position-relative">
							<label className="color-a2">{t('gender')}</label>
							<select className="custom-input" value={loyaltyNewUserInfo.gender}
								onChange={(e) => setLoyaltyNewUserInfo({ ...loyaltyNewUserInfo, 'gender': e.target.value })}>
								<option value="0">{t('man')}</option>
								<option value="1">{t('women')}</option>
							</select>
						</div>
						<div className="w-75 m0-auto">
							<button className="btn btn-primary w-100 text-uppercase mt-5"
								disabled={!(loyaltyNewUserInfo.phone.length === 12 && loyaltyNewUserInfo.firstName)}
								onClick={(e) => addLoyaltyClient(e)}>
								{t('to_accept')}
							</button>
						</div>
					</div>
				</Modal.Body>
			</Modal>
			{/* LOYALTY CREATE USER MODAL */}
		</>
	)
}

export default Uget