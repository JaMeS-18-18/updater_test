import React from 'react'
import Barcode from 'react-barcode'
import { useSelector } from 'react-redux'
import { todayDate, formatMoney } from 'helpers/helpers'

function PriceTag30x20({data, selectedPriceTag, selectPriceTag, printProducts, printRef}) {
	const reduxSettings = useSelector(state => state.settings.settings)
	const cashbox = useSelector(state => state.cashbox)

	function calculateFontSize(productName) {
		if(productName.length > 20) {
			return 'fz10'
		} else {
			return 'fz12 lh14'
		}
	}

	return (
		<>
			<div className="d-flex flex-wrap">
				<div className={"price_tag_body_30x20 mb-3 me-3 " + (selectedPriceTag.priceTag30x20_1 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag30x20_1')}>
					<div className={calculateFontSize(data.productName)}>
						<div className="d-flex flex-column product_name_20x30">
							<div className="text-center text-uppercase">
								{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
							</div>
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz22"}>
							<div className="d-flex flex-column justify-content-center me-1">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz14">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-center barcode mms-3">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} height={20} background="transparent" textMargin={0}
								fontOptions="bold" fontSize={10} width={1.04} />
						</div>
					</div>
					<div className="fz6 date">{todayDate()}</div>
				</div>

				<div className={"price_tag_body_30x20 mb-3 me-3 " + (selectedPriceTag.priceTag30x20_2 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag30x20_2')}>
					<div className={data.productName.length > 20 ? "fz14" : "fz18"}>
						<div className="d-flex flex-column product_name_20x30">
							<div className="text-center text-uppercase">
								{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
							</div>
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={"h55 d-flex flex-column justify-content-center me-1 " + (formatMoney(data.salePrice).length > 9 ? "fz14" : "fz26")}>
							<span className="fw-700">{formatMoney(data.salePrice)}</span>
						</div>
						<div className="d-flex flex-column justify-content-center fz14">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="fz6 date">{todayDate()}</div>
				</div>

				<div className={"price_tag_body_30x20 mb-3 me-3 " + (selectedPriceTag.priceTag30x20_3 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag30x20_3')}>
					<div className={data.productName.length > 20 ? "fz12" : "fz16"}>
						<div className="d-flex flex-column product_name_20x30">
							<div className="text-center text-uppercase">
								{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
							</div>
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz24"}>
							<div className="d-flex flex-column justify-content-center me-1">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz16">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-center barcode">
						<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1.07} height={20} background="transparent" displayValue={false}/>
					</div>
				</div>

				<div className={"price_tag_body_30x20 mb-3 me-3 " + (selectedPriceTag.priceTag30x20_4 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag30x20_4')}>
					<div className={data.productName.length > 20 ? "fz10" : "fz18"}>
						<div className="d-flex flex-column product_name_20x30">
							<div className="text-center text-uppercase">
								{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
							</div>
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz22"}>
							<div className="d-flex flex-column justify-content-center me-1">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz14">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-center barcode">
						<div>
							{ data.barcode.length >= 12 ? 
									<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} height={20} background="transparent" textMargin={0}
										fontOptions="bold" fontSize={10} width={1.1} format="EAN13" />
								:
								<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} height={20} background="transparent" textMargin={0}
									fontOptions="bold" fontSize={10} width={1.07} />
							}
						</div>
					</div>
					<div className="fz6 date">{todayDate()}</div>
				</div>
			</div>

			<div className="d-none">
				{ selectedPriceTag.priceTag30x20_1 &&
					<div ref={printRef}>
						{ printProducts.map(product => (
							<div className="price_tag_body_30x20 page-breaker" key={product.id}>
								<div className={calculateFontSize(product.productName)}>
									<div className="d-flex flex-column product_name_20x30">
										<div className="text-center text-uppercase">
											{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
										</div>
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz22"}>
										<div className="d-flex flex-column justify-content-center me-1">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz14">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode mms-3">
									<div>
										<Barcode value={product.barcode} width={1.04} height={20} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
							))
						}
					</div>
				}

				{ selectedPriceTag.priceTag30x20_2 &&
					<div ref={printRef}>
						{ printProducts.map(product => (
							<div className="price_tag_body_30x20 page-breaker" key={product.id}>
								<div className={product.productName.length > 20 ? "fz14" : "fz18"}>
									<div className="d-flex flex-column product_name_20x30">
										<div className="text-center text-uppercase">
											{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
										</div>
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={"h55 d-flex flex-column justify-content-center " + (formatMoney(product.salePrice).length > 9 ? "fz14" : "fz26")}>
										<span className="fw-700">{formatMoney(product.salePrice)}</span>
									</div>
									<div className="d-flex flex-column justify-content-center fz14">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
							))
						}
					</div>
				}
				
				{ selectedPriceTag.priceTag30x20_3 &&
					<div ref={printRef}>
						{ printProducts.map(product => (
							<div className="price_tag_body_30x20 page-breaker" key={product.id}>
								<div className={product.productName.length > 20 ? "fz12" : "fz16"}>
									<div className="d-flex flex-column product_name_20x30">
										<div className="text-center text-uppercase">
											{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
										</div>
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz24"}>
										<div className="d-flex flex-column justify-content-center me-1">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz16">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode">
									<Barcode value={product.barcode} width={1.07} height={20} background="transparent" displayValue={false} />
								</div>
							</div>
							))
						}
					</div>
				}

				{ selectedPriceTag.priceTag30x20_4 &&
					<div ref={printRef}>
						{ printProducts.map(product => (
							<div className="price_tag_body_30x20 page-breaker" key={product.id}>
								<div className={calculateFontSize(product.productName)}>
									<div className="d-flex flex-column product_name_20x30">
										<div className="text-center text-uppercase">
											{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
										</div>
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz22"}>
										<div className="d-flex flex-column justify-content-center me-1">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz14">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode">
									<div>
										<Barcode value={product.barcode} width={1.1} height={20} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} format="EAN13" />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
							))
						}
					</div>
				}
			</div>
		</>
	)
}

export default PriceTag30x20