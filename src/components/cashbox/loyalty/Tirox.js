import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';

import { DebounceInput } from 'react-debounce-input';

import { AddOutlined, PersonOutline, RemoveOutlined } from '@material-ui/icons';
import money from '../../../assets/icons/money.svg';

import { GET } from 'api/apiTirox';
import { formatMoney } from 'helpers/helpers';

function Tirox({ data, createCheque }) {
	const { t } = useTranslation()

	const [loyaltyUserInfo, setLoyaltyUserInfo] = useState({
		balance: 0,
	})

	async function beforeCreateCheque(e) {
		createCheque(e, 'tirox')
	}

	async function toggleCreateloyaltyModal() {

	}

	async function searchUser(value) {
		const response = await GET('/cards', { customerPhone: value })
		if (response) {
			var loyaltyUserInfoCopy = { ...loyaltyUserInfo }
			loyaltyUserInfoCopy.cardId = response.data[0].id
			setLoyaltyUserInfo({ ...loyaltyUserInfoCopy, ...response.data[0].customer, ...response.data[0].balance })
		}
	}

	useEffect(() => {
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="payment-tab-body">
				<div className="w-75 m0-auto">
					<div className="mb-1">
						<h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
						<h5 className="color-62">
							<b>{formatMoney(data.totalPrice)}</b>
							<small>{t('sum')}</small>
						</h5>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('enter_qr_or_phone')}</label>
						<DebounceInput
							type="number"
							className="custom-input"
							placeholder={t('enter_qr_or_phone')}
							debounceTimeout={2000}
							onChange={() => { }}
							onKeyUp={(e) => {
								if (e.keyCode === 13) {
									searchUser(e.target.value)
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
						<label className="color-a2">{t('client')}</label>
						<input type="text" disabled className="custom-input"
							value={loyaltyUserInfo.firstName && loyaltyUserInfo.firstName + ' ' + loyaltyUserInfo.surname + ' [' + loyaltyUserInfo.discountPercentage + '%]'} />
						<span className="input-inner-icon">
							<PersonOutline style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
						</span>
					</div>
					<div className="form-group position-relative">
						<label className="color-a2">{t('accumulated_points')}</label>
						<input type="text" disabled className="custom-input" value={loyaltyUserInfo.balance} />
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
					<div className="form-group position-relative">
						<label className="color-a2">{t('points_to_be_credited')}</label>
						<input type="text" disabled className="custom-input"
							value={formatMoney((Number(data.totalPrice) - Number(loyaltyUserInfo.amount)) * (Number(loyaltyUserInfo.discountPercentage) / 100))} />
						<span className="input-inner-icon">
							<img src={money} width={25} alt="money" />
						</span>
					</div>
					<button className="btn btn-primary w-100 text-uppercase"
						onClick={(e) => beforeCreateCheque(e)}>
						{t('to_accept')}
					</button>
				</div>
			</div>
		</>
	)
}

export default Tirox