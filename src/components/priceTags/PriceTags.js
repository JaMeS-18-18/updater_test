import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux'
import { CancelOutlined, AddCircleOutlined } from '@material-ui/icons';
import { toast } from 'react-toastify';
import { formatMoney } from 'helpers/helpers'
import PriceTag60x30 from './PriceTag60x30'
import PriceTag40x30 from './PriceTag40x30'
import PriceTag30x20 from './PriceTag30x20'
import '../../assets/css/tag.css'

function PriceTags() {
	const { t } = useTranslation();
  const posName = useSelector(state => state.cashbox.posName)
	const reduxSettings = useSelector(state => state.settings.settings)

  const printRef = useRef(null);
	const [selectedPriceTag, setSelectedPriceTag] = useState({
		'priceTag60x30_1': true,
		'priceTag60x30_2': false,
		'priceTag60x30_3': false,
		'priceTag60x30_4': false,
		'priceTag60x30_5': false,
		'priceTag40x30_1': false,
		'priceTag40x30_2': false,
		'priceTag30x20_1': false,
		'priceTag30x20_2': false,
		'priceTag30x20_3': false,
		'priceTag30x20_4': false,
	})
  const [products, setProducts] = useState([])
  const [printProducts, setPrintProducts] = useState([])
  const [searchData, setSearchData] = useState([])
  const [search, setSearch] = useState('')
  const [data, setData] = useState({
    productName: 'ВАФЛИ СЛАДОНЕЖ С ШОКОЛАДНЫМИ',
    posName: 'Market',
    salePrice: '17500',
    quantity: 10,
    currencyId: "So'm",
    barcode: "6921734977878",
    uomName: "шт",
    productImageUrl: ""
  });

  const searchProduct = () => {
		if(search.length > 0) {
			window.electron.dbApi.findProductsByName({
				'search': search,
				'searchExact': reduxSettings.searchExact,
			}).then(response => {
				if(response.row.length === 0) {
					toast.error(t('nothing_found'))
				}
				if(response.row.length === 1) {
					addToList(response.row[0])
				}
				if(response.row.length > 1) {
					setSearchData(response.row)
				}
			})
		}
  }

	const addToList = (product, fromList = false) => {
		if(fromList) {
			var searchDataCopy = [...searchData]
			var newArray = searchDataCopy.filter(e => e.barcode !== product.barcode)
			setSearchData(newArray)
			if(newArray.length === 0) {
				setSearch('')
			}
		} else {
			setSearch('')
		}

		var found = false
		if (products.length) {
			for (let i = 0; i < products.length; i++) {
				if (products[i].id === product.id) {
					products[i].quantity += 1
					found = true
				}
			}
			if (!found) {
				product.quantity = 1
				product.posName = posName
				setProducts([...products, product]);
			}
		} else {
			product.quantity = 1
			setProducts([...products, product]);
			product.posName = posName
		}
	}

  const selectProduct = (product) => {
    for (let i = 0; i < products.length; i++) {
      if (product.id === products[i]['id']) {
        products[i]['selected'] = true
      } else {
        products[i]['selected'] = false
      }
    }
    setData(product)
  }

  const deleteItem = (index) => {
    var productsCopy = [...products]
    productsCopy.splice(index, 1)
    setProducts(productsCopy)
  }

  function print() {
    var html = printRef.current.outerHTML
		window.electron.appApi.print(html, reduxSettings.priceTagPrinter)
  }

  const selectPriceTag = (selectedKey) => {
		var selectedPriceTagCopy = {...selectedPriceTag}
		for (const [key] of Object.entries(selectedPriceTagCopy)) {
			if(key === selectedKey) {
				selectedPriceTagCopy[key] = true
			} else {
				selectedPriceTagCopy[key] = false
			}
		}
		setSelectedPriceTag(selectedPriceTagCopy)
  }

  const changeProductQuantity = (e, i) => {
    var productsCopy = [...products]
    productsCopy[i].quantity = e
    setProducts(productsCopy)
  }

  useEffect(() => {
    var productsCopy = [...products]
    var prepareProducts = []
    for (let i = 0; i < productsCopy.length; i++) {
      for (let j = 0; j < productsCopy[i]['quantity']; j++) {
        prepareProducts.push(productsCopy[i])
      }
    }
    setPrintProducts(prepareProducts)
  }, [products])

	useEffect(() => {
		if(search.length === 0) {
			setSearchData([])
		}
  }, [search])

  return (
    <div className="pt-40">
      <div className="card p-2 mb-2">
        <div className="d-flex relative mb-2">
          <input type="text" className="form-control me-2" placeholder={t('search')} autoFocus
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') { searchProduct() }
            }}
            />
          <div className="btn btn-primary" onClick={() => searchProduct()}>{t('search')}</div>
					{ searchData.length > 0 &&
						<CancelOutlined className="search-cancel-icon" onClick={() => setSearch('')} />
					}

					{ searchData.length > 0 &&
						<span className="dropdown-search-menu">
							<div className="dropdown-menu-list">
								<div className="table-responsive p-2 mb-0">
									<table className="table">
										<thead>
											<tr>
												<th>{t('product_name')}</th>
												<th className="text-center">{t('barcode')}</th>
												<th className="text-center">{t('action')}</th>
											</tr>
										</thead>
										<tbody>
											{ searchData.map((item, index) => (
												<tr key={item.id}>
													<td>{item.productName}</td>
													<td className="text-center">{item.barcode}</td>
													<td className="text-center">
														<AddCircleOutlined className="success-icon cursor" onClick={() => addToList(item, true)} />
													</td>
												</tr>
												))
											}
										</tbody>
									</table>
								</div>
							</div>
						</span>
					}
        </div>

        {/* TABLE */}
        <div className="table-responsive h-table-price-tags">
          <table className="table fz14">
            <thead>
              <tr>
                <th>{t('product_name')}</th>
                <th className="text-center">{t('quantity')}</th>
                <th className="text-center">{t('barcode')}</th>
                <th className="text-center">{t('price')}</th>
                <th className="text-center">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              { products.map((product, index) => (
                <tr key={product.id} className={"cursor " + (product.selected ? "cashbox-table-active" : "cashbox-table-bg-on-hover")}>
                  <td onClick={() => selectProduct(product)}>{product.productName}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center">
                      <input type="number" className="auto-width-input" value={product.quantity}
											onChange={(e) => changeProductQuantity(e.target.value, index)} />
                    </div>
                  </td>
                  <td className="text-center" onClick={() => selectProduct(product)}>{product.barcode}</td>
                  <td className="text-center" onClick={() => selectProduct(product)}>{formatMoney(product.salePrice)}</td>
                  <td className="text-center">
                    <CancelOutlined className="cashbox-table-danger-icon" onClick={() => deleteItem(index)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* TABLE */}
      </div>

      {/* PRICE TAG EXAMPLES */}
      <div className="card px-2 pt-2 h-table-price-tags2 relative">
				<div className="h-table-price-tags3">
					<h6 className="mb-2">{t('price_tag')} (60х30 мм)</h6>
					<PriceTag60x30 data={data} selectedPriceTag={selectedPriceTag} selectPriceTag={selectPriceTag} printProducts={printProducts} printRef={printRef}></PriceTag60x30>
					<h6 className="mb-2">{t('price_tag')} (40x30 мм)</h6>
					<PriceTag40x30 data={data} selectedPriceTag={selectedPriceTag} selectPriceTag={selectPriceTag} printProducts={printProducts} printRef={printRef}></PriceTag40x30>
					<h6 className="mb-2">{t('price_tag')} (30x20 мм)</h6>
					<PriceTag30x20 data={data} selectedPriceTag={selectedPriceTag} selectPriceTag={selectPriceTag} printProducts={printProducts} printRef={printRef}></PriceTag30x20>
				</div>
        <button type="button" className="btn btn-primary w-25 absolute printing me-2" disabled={!products.length} onClick={print}>
          {t('print')}
        </button>
      </div>
    </div>
  )
}

export default PriceTags
