import React from 'react'
import Barcode from 'react-barcode'
import { useSelector } from 'react-redux'
import { todayDate, formatMoney } from 'helpers/helpers'

function PriceTag40x30({data, selectedPriceTag, selectPriceTag, printProducts, printRef}) {
	const reduxSettings = useSelector(state => state.settings.settings)
	const cashbox = useSelector(state => state.cashbox)

	function calculateFontSize(productName) {
		if(productName.length > 20) {
			return 'fz14'
		} else {
			return 'fz18'
		}
	}

	return (
		<>
			<div className="d-flex flex-wrap">
				<div className="price_tag_1 mb-3 me-3" onClick={() => selectPriceTag('priceTag40x30_1')} >
					<div className={"price_tag_body_40x30 " + (selectedPriceTag.priceTag40x30_1 ? 'border-primary' : '')}>
						<div className="fz6 text-center">{data.posName}</div>
						<div className={calculateFontSize(data.productName)}>
							<div className="text-center text-uppercase">
								{data.productName}
							</div>
						</div>
						<div className="d-flex justify-content-center price">
							<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz24"}>
								<div className="d-flex flex-column justify-content-center me-2">
									<span className="fw-700">{formatMoney(data.salePrice)}</span>
								</div>
							</div>
							<div className="d-flex flex-column justify-content-center fz14">
								<b>{cashbox.defaultCurrencyName}</b>
							</div>
						</div>
						<div className="d-flex justify-content-center barcode">
							<div>
								<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={16} background="transparent" textMargin={0}
									fontOptions="bold" fontSize={10} />
							</div>
						</div>
						<div className="fz8 date">{todayDate()}</div>
					</div>
				</div>

				<div className="price_tag_1 mb-3 me-3" onClick={() => selectPriceTag('priceTag40x30_2')} >
					<div className={"price_tag_body_40x30 " + (selectedPriceTag.priceTag40x30_2 ? 'border-primary' : '')}>
						<div className="fz6 text-center">{data.posName}</div>
						<div className={data.productName.length > 20 ? "fz12" : "fz18"}>
							<div className="text-center text-uppercase">
								{data.productName}
							</div>
						</div>
						<div className="d-flex justify-content-center price">
							<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz26"}>
								<div className="h55 d-flex flex-column justify-content-center me-2">
									<span className="fw-700">{formatMoney(data.salePrice)}</span>
								</div>
							</div>
							<div className="d-flex flex-column justify-content-center fz14">
								<b>{cashbox.defaultCurrencyName}</b>
							</div>
						</div>
						<div className="fz10 date">{todayDate()}</div>
					</div>
				</div>
			</div>

			<div className="d-none">
				{ selectedPriceTag.priceTag40x30_1 &&
					<div id="40x30" ref={printRef} >
						{ printProducts.map((product, index) => (
							<div className="price_tag_body_40x30 page-breaker" key={index} >
								<div className="fz6 text-center">{product.posName}</div>
								<div className={calculateFontSize(product.productName)}>
									<div className="text-center text-uppercase">
										{product.productName}
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz24"}>
										<div className="d-flex flex-column justify-content-center me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz14">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode">
									<div>
										<Barcode value={product.barcode} width={1} height={16} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz8 date">{todayDate()}</div>
							</div>
							))
						}
					</div>
				}

				{ selectedPriceTag.priceTag40x30_2 &&
					<div id="40x30" ref={printRef} >
						{ printProducts.map((product, index) => (
							<div className="price_tag_body_40x30 page-breaker" key={index} >
								<div className="fz6 text-center">{product.posName}</div>
								<div className={product.productName.length > 20 ? "fz12" : "fz18"}>
									<div className="text-center text-uppercase">
										{product.productName}
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz26"}>
										<div className="h55 d-flex flex-column justify-content-center me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz14">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="fz10 date">{todayDate()}</div>
							</div>
							))
						}
					</div>
				}
			</div>
		</>
	)
}

export default PriceTag40x30