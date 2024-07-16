import React, { useState } from 'react'
import Barcode from 'react-barcode'
import { useSelector } from 'react-redux'
import { todayDate, todayDDMMYYYY, formatMoney } from 'helpers/helpers'
import { globalValue } from 'api/api';

function PriceTag60x30({ data, selectedPriceTag, selectPriceTag, printProducts, printRef }) {
	const reduxSettings = useSelector(state => state.settings.settings)
	const cashbox = useSelector(state => state.cashbox)

	const [image, setImage] = useState(`${globalValue('url')}/logo.svg`)
	const fileUpload = (e) => {
		const file = e.target.files[0]
		setImage(URL.createObjectURL(file))
	}

	return (
		<>
			<div className="d-flex flex-wrap">
				{/* PriceTag_1 ( 60x30 ) */}
				<div className={"price_tag_body_60x30 mb-3 me-3 relative " + (selectedPriceTag.priceTag60x30_1 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag60x30_1')}>
					<div className="fz6 text-center posName">{data.posName}</div>
					<div className={data.productName.length > 20 ? "fz10" : "fz12"}>
						<div className="text-center text-uppercase">
							{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz30"}>
							<div className="d-flex flex-column justify-content-center me-2">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz22">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-center barcode">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={18} background="transparent" textMargin={0}
								fontOptions="bold" fontSize={10} />
						</div>
					</div>
					<div className="fz10 date">{todayDate()}</div>
				</div>
				{/* PriceTag_1 ( 60x30 ) */}

				{/* PriceTag_2 ( 60x30 ) */}
				<div className={"price_tag_body_60x30 mb-3 me-3 relative " + (selectedPriceTag.priceTag60x30_2 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag60x30_2')}>
					<div className="fz10 text-center vertical-rl absolute h-100 posName">{data.posName}</div>
					<div className={data.productName.length > 20 ? "fz10" : "fz20"}>
						<div className="text-center text-uppercase">
							{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
						</div>
					</div>
					<div className="d-flex justify-content-center price">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz30"}>
							<div className="d-flex flex-column justify-content-center me-2">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz22">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-center barcode">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={18} background="transparent" textMargin={0}
								fontOptions="bold" fontSize={10} />
						</div>
					</div>
					<div className="fz10 date">{todayDate()}</div>
				</div>
				{/* PriceTag_2 ( 60x30 ) */}

				{/* PriceTag_3 ( 60x30 ) */}
				<div className={"price_tag_body_60x30 mb-3 me-3 relative " + (selectedPriceTag.priceTag60x30_3 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag60x30_3')}>
					<div className="fz6 text-center posName">{data.posName}</div>
					<div className={data.productName.length > 20 ? "fz10" : "fz12"}>
						<div className="text-center text-uppercase">
							{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
						</div>
					</div>
					<div className="price_tag_img">
						<img src={image} width="50" height="50" alt="" />
						<input type="file" width="50" height="50"
							onChange={(e) => fileUpload(e)} />
					</div>
					<div className="d-flex justify-content-end price me-1">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz30"}>
							<div className="d-flex flex-column justify-content-center h-100 me-2">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz22">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-end">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={18} background="transparent" textMargin={0}
								fontOptions="bold" fontSize={10} />
						</div>
					</div>
					<div className="fz10 date">{todayDate()}</div>
				</div>
				{/* PriceTag_3 ( 60x30 ) */}

				{/* PriceTag_4 ( 60x30 ) */}
				<div className={"price_tag_body_60x30 mb-3 me-3 relative " + (selectedPriceTag.priceTag60x30_4 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag60x30_4')}>
					<div className="fz6 text-center posName">{data.posName}</div>
					<div className={data.productName.length > 20 ? "fz10" : "fz20"}>
						<div className="text-center text-uppercase">
							{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
						</div>
					</div>
					<div className="price_tag_discount">
						<span className="fw-700 fz30">20000</span>
					</div>
					<div className="d-flex justify-content-end price me-1">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz30"}>
							<div className="d-flex flex-column justify-content-center h-100 me-2">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz22">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-end">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={18} background="transparent" textMargin={0}
								fontOptions="bold" fontSize={10} />
						</div>
					</div>
					<div className="fz10 date">{todayDate()}</div>
				</div>
				{/* PriceTag_4 ( 60x30 ) */}

				{/* PriceTag_5 ( 60x30 ) */}
				<div className={"price_tag_body_60x30 mb-3 me-3 relative " + (selectedPriceTag.priceTag60x30_5 ? 'border-primary' : '')} onClick={() => selectPriceTag('priceTag60x30_5')}>
					<div className="fz10 date-top-right">{todayDDMMYYYY()}</div>
					<div className="mt-3 ms-1 fz12 overflow-hidden">
						<div className="text-start text-uppercase text-nowrap">
							{data.productName.length > 34 ? data.productName.slice(0, 34) + "..." : data.productName}
						</div>
					</div>
					<div className="d-flex justify-content-end price me-1">
						<div className={formatMoney(data.salePrice).length > 9 ? "fz12" : "fz30"}>
							<div className="d-flex flex-column justify-content-center h-100 me-2">
								<span className="fw-700">{formatMoney(data.salePrice)}</span>
							</div>
						</div>
						<div className="d-flex flex-column justify-content-center fz22">
							<b>{cashbox.defaultCurrencyName}</b>
						</div>
					</div>
					<div className="d-flex justify-content-between barcode mt-2">
						<div>
							<Barcode value={data.barcode} lineColor={reduxSettings.darkTheme === true ? '#ffffff' : '#000000'} width={1} height={18} background="transparent" textMargin={0} fontOptions="bold" fontSize={10} />
						</div>
						<div className="vertical-center">
							<b className="fz12 text-end text-nowrap me-2">Цена за: 1 шт.</b>
							<div className="fz12 text-end me-2">{data.posName}</div>
						</div>
					</div>
				</div>
				{/* PriceTag_5 ( 60x30 ) */}
			</div>

			<div className="d-none">
				{selectedPriceTag.priceTag60x30_1 &&
					<div ref={printRef}>
						{printProducts.map((product, index) => (
							<div className="price_tag_body_60x30 page-breaker" key={index}>
								<div className="fz6 text-center posName">{product.posName}</div>
								<div className={product.productName.length > 20 ? "fz10" : "fz12 d-flex flex-column"}>
									<div className="text-center text-uppercase">
										{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz30"}>
										<div className="d-flex flex-column justify-content-center me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz22">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode">
									<div>
										<Barcode value={product.barcode} width={1} height={16} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
						))
						}
					</div>
				}

				{selectedPriceTag.priceTag60x30_2 &&
					<div ref={printRef}>
						{printProducts.map((product, index) => (
							<div className="price_tag_body_60x30 page-breaker" key={index}>
								<div className="fz6 text-center vertical-rl absolute h-100 posName">{product.posName}</div>
								<div className={product.productName.length > 20 ? "fz10" : "fz12 d-flex flex-column"}>
									<div className="text-center text-uppercase">
										{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
									</div>
								</div>
								<div className="d-flex justify-content-center price">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz30"}>
										<div className="d-flex flex-column justify-content-center me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz22">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-center barcode">
									<div>
										<Barcode value={product.barcode} width={1} height={16} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
						))
						}
					</div>
				}

				{selectedPriceTag.priceTag60x30_3 &&
					<div ref={printRef}>
						{printProducts.map((product, index) => (
							<div className="price_tag_body_60x30 page-breaker" key={index}>
								<div className="fz6 text-center posName">{product.posName}</div>
								<div className={product.productName.length > 20 ? "fz10" : "fz12 d-flex flex-column"}>
									<div className="text-center text-uppercase">
										{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
									</div>
								</div>
								<div className="price_tag_img">
									<img src={image} width="50" height="50" alt="" />
									<input type="file" width="50" height="50" />
								</div>
								<div className="d-flex justify-content-end price me-1">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz30"}>
										<div className="d-flex flex-column justify-content-center h-100 me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz22">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-end">
									<div>
										<Barcode value={product.barcode} width={1} height={16} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
						))
						}
					</div>
				}

				{selectedPriceTag.priceTag60x30_4 &&
					<div ref={printRef}>
						{printProducts.map((product, index) => (
							<div className="price_tag_body_60x30 page-breaker" key={index}>
								<div className="fz6 text-center posName">{product.posName}</div>
								<div className={product.productName.length > 20 ? "fz10" : "fz12 d-flex flex-column"}>
									<div className="text-center text-uppercase">
										{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
									</div>
								</div>
								<div className="price_tag_discount">
									<span className="fw-700 fz30">20000</span>
								</div>
								<div className="d-flex justify-content-end price me-1">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz30"}>
										<div className="d-flex flex-column justify-content-center h-100 me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz22">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-end">
									<div>
										<Barcode value={product.barcode} width={1} height={16} background="transparent" textMargin={0}
											fontOptions="bold" fontSize={10} />
									</div>
								</div>
								<div className="fz6 date">{todayDate()}</div>
							</div>
						))
						}
					</div>
				}

				{selectedPriceTag.priceTag60x30_5 &&
					<div ref={printRef}>
						{printProducts.map((product, index) => (
							<div className="price_tag_body_60x30 page-breaker" key={index}>
								<div className="fz10 date-top-right">{todayDDMMYYYY()}</div>
								<div className="mt-3 ms-1 fz12 overflow-hidden">
									<div className="text-start text-uppercase text-nowrap">
										{product.productName.length > 34 ? product.productName.slice(0, 34) + "..." : product.productName}
									</div>
								</div>
								<div className="d-flex justify-content-end price me-1">
									<div className={formatMoney(product.salePrice).length > 9 ? "fz12" : "fz30"}>
										<div className="d-flex flex-column justify-content-center h-100 me-2">
											<span className="fw-700">{formatMoney(product.salePrice)}</span>
										</div>
									</div>
									<div className="d-flex flex-column justify-content-center fz22">
										<b>{cashbox.defaultCurrencyName}</b>
									</div>
								</div>
								<div className="d-flex justify-content-between barcode mt-2">
									<div>
										<Barcode value={product.barcode} width={1} height={18} background="transparent" textMargin={0} fontOptions="bold" fontSize={10} />
									</div>
									<div className="vertical-center">
										<b className="fz12 text-end text-nowrap me-2">Цена за: 1 шт.</b>
										<div className="fz12 text-end me-2">{product.posName}</div>
									</div>
								</div>
							</div>
						))
						}
					</div>
				}
			</div>
		</>
	)
}

export default PriceTag60x30