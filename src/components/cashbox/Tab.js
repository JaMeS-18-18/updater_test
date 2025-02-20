import React, { useEffect, useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  CloseOutlined, CancelOutlined, ChevronLeftOutlined, PersonOutline, AddOutlined, RemoveOutlined,
  AccountBoxOutlined, InfoOutlined, PhoneOutlined, PhoneAndroidOutlined, ChatBubbleOutline, DeleteOutlineOutlined,
  PersonOutlined, AccountBalanceOutlined
} from '@material-ui/icons';
import { DebounceInput } from 'react-debounce-input';
import { Modal, Popover, OverlayTrigger } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Barcode from 'react-barcode';
import QRCode from "react-qr-code";
import DatePicker from "react-datepicker"
import XLSX from 'xlsx';

import { SET_CASHBOX } from 'store/actions/cashbox'
import { INCREMENT, SET_UNSYNC_PRODUCTS } from 'store/actions/countUnsyncProducts';
import { SET_TAB_CHEQUE, SET_WHOLESALEPRICE_BOOLEAN } from 'store/actions/backendHelpers';
import { formatMoney, getUnixTime, formatUnixTime, generateChequeNumber, generateTransactionId, quantityOfUnitlist, todayDDMMYYYY, todayYYYYMMDD, dateFormat, formatDateBackend, formatDateWithTime, formatMoneyInput } from 'helpers/helpers';

import { POST, GET, globalValue, DELETE, PUT } from 'api/api';
import { O_POST } from 'api/apiOfd';
import { UZUM_POST } from 'api/apiUzum';

import Rightbar from './Rightbar';

import barcodeScanner from '../../assets/icons/barcode-scanner.svg';
import money from '../../assets/icons/money.svg';
import creditCard from '../../assets/icons/credit-card.svg';
import moneyWhite from '../../assets/icons/money-white.svg';
import creditCardWhite from '../../assets/icons/credit-card-white.svg';
import { CLICK_POST } from 'api/apiClick';
import { PAYME_POST } from 'api/apiPayme';
import Uget from './loyalty/Uget';
import Tirox from './loyalty/Tirox';

function Tab({ tabId, activeTabId }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const cashbox = useSelector(state => state.cashbox)
  const shift = useSelector(state => state.shift)
  const account = useSelector(state => state.account)
  const reduxSettings = useSelector(state => state.settings.settings)
  const internetConnection = useSelector(state => state.settings.internetConnection)
  const countUnsyncProducts = useSelector(state => state.countUnsyncProducts)
  const backendHelpers = useSelector(state => state.backendHelpers)

  const inputPromotionRef = useRef(null);
  const printChequeRef = useRef(null);
  const printChequeRef2 = useRef(null);
  const searchRef = useRef(null);
  const bottomProductSearchRef = useRef(null);
  const amountInRef = useRef(null);
  const amountInTerminalRef = useRef(null);
  const qrRef = useRef(null);
  const productWithParamsUnitRef = useRef(null);
  const loyaltyInputRef = useRef(null);
  const contactSearchRef = useRef(null);
  const scrollToBottomRef = useRef(null);
  const tbodyRef = useRef(null);
  const scrollRef = useRef(null);
  const globalDisable = useRef(false);
  const dataRef = useRef({});

  const [products, setProducts] = useState([]) // Быстрый подбор товаров
  const [showModalIkpu, setShowModalIkpu] = useState(false);
  const [searchByNameValue, setSearchByNameValue] = useState("") // Быстрый подбор товаров
  const [loyaltySearchUserInput, setLoyaltySearchUserInput] = useState("");
  const [loyaltyUserInfo, setLoyaltyUserInfo] = useState({
    "award": 0, "balance": 0, "code": 0, "firstName": "",
    "lastName": "", "reason": "", "status": "", "amount": "",
    "addCardNumber": "", "cardNumber": "",
  });
  const [loyaltyTransactionsListCash, setLoyaltyTransactionsListCash] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 1 });
  const [loyaltyTransactionsListTerminal, setLoyaltyTransactionsListTerminal] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 });
  const [numberOfProducts, setNumberOfProducts] = useState(0);
  const [markingProduct, setMarkingProduct] = useState({});
  const [storageChequeList, setStorageChequeList] = useState([]);

  const [popoverShow, setPopoverShow] = useState(false);
  const [rightBar, setRightBar] = useState(false);
  const [loyaltyValidated, setLoyaltyValidated] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [contactSearchInput, setContactSearchInput] = useState(""); // Продажа в долг
  const [clients, setClients] = useState([]) // Продажа в долг
  const [oldClients, setOldClients] = useState([]) // Продажа в долг
  const [client, setClient] = useState({ "comment": "", "name": "", "phone1": "998", "phone2": "998" }) // Продажа в долг
  const [debtorOut, setDebtorOut] = useState({ "clientId": 0, "clientComment": "", "clientAmount": 0 }) // Продажа в долг
  const [organizations, setOrganizations] = useState([])
  const [oldOrganizations, setOldOrganizations] = useState([])
  const [agents, setAgents] = useState([])
  const [oldAgents, setOldAgents] = useState([])
  const [selectedChequeFromState, setSelectedChequeFromState] = useState({})
  const [onlineChequeList, setOnlineChequeList] = useState([])

  const [activePrice, setActivePrice] = useState({ "active": 0 }); // 0 выключен 1 оптом 2 перечисление
  const [productWithParams, setProductWithParams] = useState({ "selectedUnit": { "name": "", "quantity": "" }, "modificationList": [], 'unitList': [] });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showProductWithParamsModal, setShowProductWithParamsModal] = useState({
    'unitParamsModal': false,
    'unitListModal': false,
    'unitProductModal': false,
  });
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showSelectClientModal, setShowSelectClientModal] = useState(false);
  const [showSelectOrganizationModal, setShowSelectOrganizationModal] = useState(false);
  const [showSelectAgentModal, setShowSelectAgentModal] = useState(false);
  const [showConfirmModalDeleteItem, setShowConfirmModalDeleteItem] = useState({ 'bool': false, 'index': 0 });
  const [showConfirmModalDeleteAllItems, setShowConfirmModalDeleteAllItems] = useState(false);
  const [showProductOutOfStock, setShowProductOutOfStock] = useState(false);
  const [showSavedChequesModal, setShowSavedChequesModal] = useState(false);
  const [showAgentChequesModal, setShowAgentChequesModal] = useState(false);
  const [showMarkingModal, setShowMarkingModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState({ 'bool': false, 'name': '', 'barcode': "" });

  const [productWithParamsUnit, setProductWithParamsUnit] = useState({ "packaging": 1, "piece": "0", "quantity": 1, "totalPrice": 0 });
  const [showOnlyCashPaymentModal, setShowOnlyCashPaymentModal] = useState(false);
  const [showOnlyTerminalPaymentModal, setShowOnlyTerminalPaymentModal] = useState(false);
  const [transactionsListCash, setTransactionsListCash] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 1 });
  const [transactionsListTerminal, setTransactionsListTerminal] = useState({ "amountIn": "", "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 });
  const [data, setData] = useState({
    "cashboxVersion": backendHelpers.version,
    "login": account.login,
    "cashboxId": cashbox.cashboxId,
    "change": 0,
    "chequeDate": 0,
    "chequeNumber": "",
    "clientAmount": 0,
    "clientComment": "",
    "clientId": 0,
    "currencyId": cashbox.defaultCurrency,
    "currencyRate": 0,
    "discountAmount": 0,
    "note": "",
    "offline": true,
    "outType": false,
    "paid": 0,
    "posId": cashbox.posId,
    "saleCurrencyId": cashbox.defaultCurrency,
    "shiftId": cashbox.id ? cashbox.id : shift.id,
    "totalPriceBeforeDiscount": 0, // this is only for showing when sale
    "totalPrice": 0,
    "totalVatAmount": 0,
    "transactionId": "",
    "itemsList": [],
    "transactionsList": [],
    "chequeTimeStart": "",
    "chequeTimeEnd": "",
    "appletVersion": "",
    "dateTime": "",
    "fiscalSign": "",
    "receiptSeq": "",
    "qRCodeURL": "",
    "terminalID": "",
    "cashierName": account.firstName,
    "selectOnSale": false,
    "chequeOfdType": 0,
    "loyaltyDiscount": false,
    "payedWith": "payment",
    "payedWithDiscount": "",
    "clientReturnDate": "",
    "organizationReturnDate": "",
  });

  // Format the message
  var formattedMessage;

  function searchProduct(params = { barcode: "", byName: false, promotion: false, promotionProductBarcode: "", forcePomotionQuantity: 0 }) {
    if (!cashbox.ofd && !params.barcode) return
    var barcode = params.barcode
    var byName = params.byName
    var promotion = params.promotion

    var barcodeScales = 0
    if (barcode.length === 13 &&
      (Number(barcode.substring(0, 2)) === Number(reduxSettings.weightPrefix) ||
        Number(barcode.substring(0, 2)) === reduxSettings.piecePrefix)
    ) {
      if (Number(reduxSettings.barcodeFormat) === 5) {
        barcodeScales = Number(barcode.substring(2, 7))
      }
      if (Number(reduxSettings.barcodeFormat) === 6) {
        barcodeScales = Number(barcode.substring(3, 8))
      }
    }

    window.electron.dbApi.findProducts(barcode, barcodeScales, reduxSettings?.productGrouping, byName).then(response => {
      var acceptSale = false
      if (!cashbox.saleMinus && response?.row?.balance > 0) { // Если отключена функция продажа в минус и имеется товар то продавать
        acceptSale = true
      }
      if (!cashbox.saleMinus && response?.row?.balance <= 0) { // Если отключена функция продажа в минус и не имеется товар то не продавать
        acceptSale = false
      }
      if (cashbox.saleMinus) {
        acceptSale = true
      }

      if (response?.row?.id && promotion) {
        response.row.forcePomotionQuantity = params.forcePomotionQuantity
        response.row.inserted = params.forcePomotionQuantity
        response.row.promotionProductBarcode = params.promotionProductBarcode
        response.row.salePrice = 0
        response.row.promotion = true
        response.row.promotionProduct = 0 // если акция 1 + 1 сам себе то это обязательное поле
      }

      if (!response.sqlError && response.row && acceptSale && !data.discountAmount) {
        // Logic for scale product
        var weight = 0
        var barcodeFirst2Digits = Number(barcode.substring(0, 2))
        if (response.scaleProduct && barcodeFirst2Digits === Number(reduxSettings.weightPrefix)) {
          if (Number(reduxSettings.barcodeFormat) === 5) {
            weight = Number(barcode.substring(7, 12)) / 1000 // 3445 to 3.445
          }
          if (Number(reduxSettings.barcodeFormat) === 6) {
            weight = Number(barcode.substring(8, 12)) / 1000
          }
        }
        // console.log('do', barcode.substring(10, 12))
        if (response.scaleProduct && barcodeFirst2Digits === Number(reduxSettings.piecePrefix)) {
          weight = Number(barcode.substring(10, 12))
        }

        if (response.row.uomId !== 1 && (response.row.balance > 0 && response.row.balance < 1) && barcodeFirst2Digits === Number(reduxSettings.piecePrefix)) {
          if (cashbox.saleMinus) {
            weight = 1
          } else {
            weight = response.row.balance
          }
        }


        if (response.row.uomId === 1 && barcodeFirst2Digits === Number(reduxSettings.weightPrefix)) {
          weight = parseInt(weight, 10);
        }
        // console.log('posle', weight)
        // Logic for scale product

        //console.log(response.row);
        response.row.active_price = activePrice.active
        response.row.discountAmount = 0
        response.row.outType = false

        response.row.modificationList = JSON.parse(response?.row?.modificationList)
        response.row.unitList = JSON.parse(response?.row?.unitList)

        if (response?.row?.modificationList?.length > 0) {
          if (response.row.modificationList.length === 1) {
            if (response.row.modificationList[0]['serial'])
              response.row.serial = response.row.modificationList[0]['serial']
            if (response.row.modificationList[0]['party'])
              response.row.party = response.row.modificationList[0]['party']
            if (response.row.modificationList[0]['expDate'])
              response.row.expDate = response.row.modificationList[0]['expDate']
          } else {
            for (let i = 0; i < response.row.modificationList.length; i++) {
              response.row.modificationList[i]['selected'] = false
            }
            response.row.selectedUnit = {}
            response.row.quantity = weight + (response.row.quantity || 0)

            console.log(response.row);
            setProductWithParams(response.row)
            setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': true, 'unitProductModal': false, 'unitListModal': false })
            return;
          }
        }

        if (response?.row?.unitList?.length > 0) {
          response.row.selectedUnit = response.row.unitList[0]
          if (response.row.unitList.length === 1) {
            setProductWithParams(response.row)
            setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitProductModal': true, 'unitListModal': false })
            setTimeout(() => {
              productWithParamsUnitRef.current.select()
            }, 300)
            setSearchInput('')
            return;
          } else {
            for (let i = 0; i < response.row.unitList.length; i++) {
              response.row.unitList[i]['selected'] = false
            }

            setProductWithParams(response.row)
            setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitProductModal': false, 'unitListModal': true })
          }
          return;
        }
        if (!cashbox.saleMinus && data.itemsList.length > 0) { // Если отключена функция продажа в минус и превышен лимит от остатка
          for (let i = 0; i < data.itemsList.length; i++) {
            if (data.itemsList[i].id === response.row.id) {
              if (data.itemsList[i].quantity >= Number(response.row.balance)) {

                var txt = t('limit_is_exceeded')
                if (response.group) { // если превышен лимит родителя группировочного товара
                  txt += ' ' + t('grouping')
                }
                toast.error(txt)
                return;
              }
            }
          }
        }

        if (!cashbox.saleMinus && weight > 0 && response.row.balance < weight) {
          toast.error(t('limit_is_exceeded'))
          return
        }

        if (Number(response?.row?.marking)) {
          setMarkingProduct(response.row)
          setShowMarkingModal(true)
          return
        }

        addToList(response.row, weight)
      } else {
        if (!response.row || !acceptSale) {
          if (reduxSettings?.showProductOutOfStock) {
            setShowProductOutOfStock(true)
          } else {
            txt = t('product_out_of_stock')
            if (response.group) { // если нету остатка родителя группировочного товара
              txt += ' ' + t('grouping')
            }
            toast.error(txt)
            setSearchInput('')
          }
          return;
        }

        if (data.discountAmount) {
          toast.error(t('discount_was_applied'))
          setSearchInput('')
          return;
        }
      }
    })
  }




  function addToList(response, weight = 0) {
    var dataCopy = { ...data }
    var quantity
    var promotionProduct
    dataCopy.totalPrice = 0

    var index = dataCopy.itemsList.findIndex(x => (x.productId === response.productId && !x.promotion))
    if (response?.markingNumber) index = -1
    if (response?.promotion && index >= 0) index = -1

    // PROMOTION LOGIC
    if (index === -1 && index !== undefined) { // if not exist same product in the itemsList
      if (!response.quantity) {
        response.quantity = 1
        if (weight) { // if scaleProduct
          response.quantity = weight
        }
        if (response?.promotion && response?.inserted) {
          response.quantity = response.inserted
        }
      } else {
        if (response?.quantity > response?.balance) {
          response.quantity = response.balance
          toast.error(t('limit_is_exceeded'))
        }
      }
      response.selected = false
      response.totalPrice = 0
      response.ref = null

      dataCopy.itemsList.push(response)

      dataCopy['totalVatAmount'] = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        if (dataCopy.itemsList[i]['active_price'] === 1) {
          dataCopy.itemsList[i]['salePrice'] = dataCopy.itemsList[i]['wholesalePrice']
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['wholesalePrice']) * Number(dataCopy.itemsList[i]['quantity'])
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['wholesalePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        } else if (dataCopy.itemsList[i]['active_price'] === 2) {
          dataCopy.itemsList[i]['salePrice'] = dataCopy.itemsList[i]['bankPrice']
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['bankPrice']) * Number(dataCopy.itemsList[i]['quantity'])
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['bankPrice']) * Number(dataCopy.itemsList[i]['quantity'])
        } else {
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        }

        dataCopy['totalVatAmount'] +=
          Number(dataCopy.itemsList[i]['totalPrice']) /
          (100 + Number(dataCopy.itemsList[i]['vat'])) *
          Number(dataCopy.itemsList[i]['vat'])
      }

      // PROMOTION LOGIC
      if (response.promotionProduct) {
        index = dataCopy.itemsList.length - 1

        if (dataCopy.itemsList[index]['promotionQuantity'] === dataCopy.itemsList[index]['promotionProductQuantity']) {
          quantity = dataCopy.itemsList[index]['quantity'] * dataCopy.itemsList[index]['promotionProductQuantity'] / dataCopy.itemsList[index]['promotionQuantity']
          if ((Math.floor(dataCopy.itemsList[index]['quantity'] / dataCopy.itemsList[index]['promotionProductQuantity'])) > (Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) / dataCopy.itemsList[index]['promotionProductQuantity'])) {
            togglePromotionModal(
              true,
              dataCopy,
              index,
              quantity,
              promotionProduct?.quantity ?? 0,
            )
          }
        }

        if (dataCopy.itemsList[index]['promotionQuantity'] < dataCopy.itemsList[index]['promotionProductQuantity']) {
          if (dataCopy.itemsList[index]['quantity'] >= dataCopy.itemsList[index]['promotionQuantity']) {
            quantity = calculateFreeItemsToProvide(dataCopy.itemsList[index]['quantity'], dataCopy.itemsList[index]['promotionQuantity'], dataCopy.itemsList[index]['promotionProductQuantity']);

            if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) > Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0)
            ) {
              togglePromotionModal(
                true,
                dataCopy,
                index,
                quantity,
                promotionProduct?.quantity ?? 0,
              )
            }
          }
        }

        if (dataCopy.itemsList[index]['promotionQuantity'] > dataCopy.itemsList[index]['promotionProductQuantity']) {
          if (dataCopy.itemsList[index]['quantity'] >= dataCopy.itemsList[index]['promotionQuantity']) {
            quantity = calculateFreeItemsToProvide(dataCopy.itemsList[index]['quantity'], dataCopy.itemsList[index]['promotionQuantity'], dataCopy.itemsList[index]['promotionProductQuantity']);

            if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) > Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0)
            ) {
              togglePromotionModal(
                true,
                dataCopy,
                index,
                quantity,
                promotionProduct?.quantity ?? 0,
              )
            }
          }
        }

      }
      // PROMOTION LOGIC
    } else {
      if (!response.quantity) { // if product have not unitList
        if (weight) { // if scaleProduct
          dataCopy.itemsList[index]['quantity'] = Number(dataCopy.itemsList[index]['quantity']) + Number(weight)
        } else {
          if (!cashbox.saleMinus && dataCopy.itemsList[index]['quantity'] >= Number(dataCopy.itemsList[index]['balance'])) {
            toast.error(t('limit_is_exceeded'))
            return;
          }
          dataCopy.itemsList[index]['quantity'] += 1

          // PROMOTION LOGIC
          if (index >= 0 && response?.promotionProduct) {
            promotionProduct = dataCopy.itemsList.find(x => (x.barcode === dataCopy.itemsList[index]['promotionProductBarcode'] && x.promotion))

            if (dataCopy.itemsList[index]['promotionQuantity'] === dataCopy.itemsList[index]['promotionProductQuantity']) {
              quantity = dataCopy.itemsList[index]['quantity'] * dataCopy.itemsList[index]['promotionProductQuantity'] / dataCopy.itemsList[index]['promotionQuantity']

              if (
                (Math.floor(dataCopy.itemsList[index]['quantity'] / dataCopy.itemsList[index]['promotionProductQuantity'])) >
                (Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) / dataCopy.itemsList[index]['promotionProductQuantity'])) {
                togglePromotionModal(
                  true,
                  dataCopy,
                  index,
                  quantity,
                  promotionProduct?.quantity ?? 0,
                )
              }
            }

            if (dataCopy.itemsList[index]['promotionQuantity'] < dataCopy.itemsList[index]['promotionProductQuantity']) {
              if (dataCopy.itemsList[index]['quantity'] >= dataCopy.itemsList[index]['promotionQuantity']) {
                quantity = calculateFreeItemsToProvide(dataCopy.itemsList[index]['quantity'], dataCopy.itemsList[index]['promotionQuantity'], dataCopy.itemsList[index]['promotionProductQuantity']);

                if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) !== 0) {
                  togglePromotionModal(
                    true,
                    dataCopy,
                    index,
                    quantity,
                    promotionProduct?.quantity ?? 0,
                  )
                }
              }
            }

            if (dataCopy.itemsList[index]['promotionQuantity'] > dataCopy.itemsList[index]['promotionProductQuantity']) {
              if (dataCopy.itemsList[index]['quantity'] >= dataCopy.itemsList[index]['promotionQuantity']) {
                quantity = calculateFreeItemsToProvide(dataCopy.itemsList[index]['quantity'], dataCopy.itemsList[index]['promotionQuantity'], dataCopy.itemsList[index]['promotionProductQuantity']);

                if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) !== 0) {
                  togglePromotionModal(
                    true,
                    dataCopy,
                    index,
                    quantity,
                    promotionProduct?.quantity ?? 0,
                  )
                }
              }
            }
          }
          // PROMOTION LOGIC
        }
      } else {
        dataCopy.itemsList[index]['quantity'] += response.quantity
      }

      dataCopy['totalVatAmount'] = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        if (dataCopy.itemsList[i]['active_price'] === 1) {
          dataCopy.itemsList[i]['active_price'] = 1
          dataCopy.itemsList[i]['salePrice'] = dataCopy.itemsList[i]['wholesalePrice']
          dataCopy.totalPrice += dataCopy.itemsList[i]['wholesalePrice'] * dataCopy.itemsList[i]['quantity']
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['wholesalePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        } else if (dataCopy.itemsList[i]['active_price'] === 2) {
          dataCopy.itemsList[i]['active_price'] = 2
          dataCopy.itemsList[i]['salePrice'] = dataCopy.itemsList[i]['bankPrice']
          dataCopy.totalPrice += dataCopy.itemsList[i]['bankPrice'] * dataCopy.itemsList[i]['quantity']
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['bankPrice']) * Number(dataCopy.itemsList[i]['quantity'])
        } else {
          dataCopy.itemsList[i]['active_price'] = 0
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
          dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        }

        dataCopy['totalVatAmount'] +=
          Number(dataCopy.itemsList[i]['totalPrice']) /
          (100 + Number(dataCopy.itemsList[i]['vat'])) *
          Number(dataCopy.itemsList[i]['vat'])
      }
    }

    if (dataCopy.itemsList.length === 1) {
      dataCopy.chequeTimeStart = getUnixTime()
    }

    if (response?.markingNumber) {
      setMarkingProduct({})
      setShowMarkingModal(false)
    }

    if (response?.promotionProduct) {
      dataCopy.promotion = true
    }

    setSearchInput("")
    if (document.getElementById('productSearchByName')?.value !== "" && reduxSettings.selectBottomSearch) {
      bottomProductSearchRef.current.focus()
      // Без этого не будет работать setState когда поиск не пустой
      window.electron.dbApi.getProducts().then(response => {
        setProducts([...products])
      })
    } else if (document.getElementById('productSearchByName')?.value !== "" && reduxSettings.leaveBottomSearchText) {
      searchRef.current.focus()
    } else {
      searchRef.current.focus()
      setSearchByNameValue("")
      getProductsFromDB()
    }

    if (index === -1 && index !== undefined) {

      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.itemsList[i]['selected'] = false
      }

      if (dataCopy.itemsList.length && !dataCopy.itemsList[dataCopy.itemsList.length - 1]['promotion'])
        dataCopy.itemsList[dataCopy.itemsList.length - 1]['selected'] = true

      setTimeout(() => {
        scrollToBottomRef.current.scrollTop = scrollToBottomRef?.current?.scrollHeight
      }, 100);
    } else if (index >= 0) {
      dataCopy = data
      var item = dataCopy.itemsList[index]

      if (item.promotion) return // если этот продукт в акции его нельзя выделить и удалить

      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        if ((item.productId === dataCopy.itemsList[i]['productId']) && !dataCopy.itemsList[i]['promotion']) {
          dataCopy.itemsList[i]['selected'] = true
        } else {
          dataCopy.itemsList[i]['selected'] = false
        }
      }

      setTimeout(() => {
        scrollToBottomRef.current.scrollTop = (index + 1) * 28
      }, 100);
    }

    calculateTotalPrice(dataCopy)
    console.log(response);

  }

  function addToListUnit() {
    var productWithParamsUnitCopy = { ...productWithParamsUnit }
    var productWithParamsCopy = { ...productWithParams }
    productWithParamsCopy.quantity = productWithParamsUnitCopy.quantity
    addToList(productWithParamsCopy)
    setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitListModal': false, 'unitProductModal': false })
    setProductWithParamsUnit({ "packaging": 1, "piece": 0, "quantity": 1, "totalPrice": 0 })
    setProductWithParams({ ...productWithParams, "selectedUnit": { "name": "", "quantity": "" }, "modificationList": [], 'unitList': [] })
  }

  function handleShortcut(event) {
    if (
      event.key === 'e' || event.key === '-' || event.key === '+' ||
      event.key === '*' || event.key === '/' || event.key === 'F5' ||
      event.key === 'F6' || event.key === 'F7'
    ) {
      var dataCopy = { ...data }
      if (event.key === '+' && Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))) {
        if (Number(dataCopy.discountAmount > 0)) {
          toast.error(t('discount_was_applied'))
          return
        }
        const inputData = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
        for (let i = 0; i < dataCopy.itemsList.length; i++) {
          if (dataCopy.itemsList[i]['selected']) {
            if (dataCopy.itemsList[i]['marking'] === true || dataCopy.itemsList[i]['marking'] === "1" || dataCopy.itemsList[i]['marking'] === 1) {
              toast.error(t('marking'))
              return
            }
            if (dataCopy.itemsList[i]['promotion']) {
              toast.error(t('promotion'))
              return
            }
            if (isFloat(inputData) && dataCopy.itemsList[i]['uomId'] === 145487) { // Штучные товары нельзя вводить дробным числом было 1
              toast.error(t('invalid_amount'))
              setSearchInput("")
              return;
            } else {
              if (!cashbox.saleMinus && (inputData > dataCopy.itemsList[i]['balance'])) { // Если отключена функция продажа в минус и не имеется товар то показать ошибку
                toast.error(t('limit_is_exceeded'))
                dataCopy.itemsList[i]['quantity'] = dataCopy.itemsList[i]['balance']
                calculateTotalPrice(dataCopy)
                setSearchInput("")
              } else {
                if (Number(dataCopy.itemsList[i]['quantity']) === Number(inputData)) {
                  setSearchInput("")
                  return
                }

                // PROMOTION LOGIC
                if (dataCopy.itemsList[i]?.promotionProduct && Number(dataCopy.itemsList[i]['quantity']) > Number(inputData)) {
                  toast.error("Нельзя уменьшить кол-во товара в акции")
                  setSearchInput("")
                  return
                }
                // PROMOTION LOGIC
                dataCopy.itemsList[i]['quantity'] = inputData

                // PROMOTION LOGIC
                if (
                  dataCopy.itemsList[i]?.promotionProduct &&
                  dataCopy.itemsList[i]['quantity'] >= dataCopy.itemsList[i]['promotionQuantity']
                ) {
                  var promotionProduct = dataCopy.itemsList.find(x => (x.barcode === dataCopy.itemsList[i]['promotionProductBarcode'] && x.promotion))
                  var quantity

                  if (dataCopy.itemsList[i]['promotionQuantity'] === dataCopy.itemsList[i]['promotionProductQuantity']) {
                    quantity = Math.floor(dataCopy.itemsList[i]['quantity'] / dataCopy.itemsList[i]['promotionQuantity']) * dataCopy.itemsList[i]['promotionProductQuantity']
                    if (
                      (Math.floor(dataCopy.itemsList[i]['quantity'] / dataCopy.itemsList[i]['promotionProductQuantity'])) >
                      (Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) / dataCopy.itemsList[i]['promotionProductQuantity'])
                    ) {
                      togglePromotionModal(
                        true,
                        dataCopy,
                        i,
                        quantity,
                        promotionProduct?.quantity ?? 0,
                      )
                    }
                  }

                  if (dataCopy.itemsList[i]['promotionQuantity'] < dataCopy.itemsList[i]['promotionProductQuantity']) {
                    if (dataCopy.itemsList[i]['quantity'] >= dataCopy.itemsList[i]['promotionQuantity']) {
                      quantity = calculateFreeItemsToProvide(dataCopy.itemsList[i]['quantity'], dataCopy.itemsList[i]['promotionQuantity'], dataCopy.itemsList[i]['promotionProductQuantity']);

                      if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) !== 0) {
                        togglePromotionModal(
                          true,
                          dataCopy,
                          i,
                          quantity,
                          promotionProduct?.quantity ?? 0,
                        )
                      }
                    }
                  }

                  if (dataCopy.itemsList[i]['promotionQuantity'] > dataCopy.itemsList[i]['promotionProductQuantity']) {
                    if (dataCopy.itemsList[i]['quantity'] >= dataCopy.itemsList[i]['promotionQuantity']) {
                      quantity = calculateFreeItemsToProvide(dataCopy.itemsList[i]['quantity'], dataCopy.itemsList[i]['promotionQuantity'], dataCopy.itemsList[i]['promotionProductQuantity']);

                      if (Number(quantity) - Number(promotionProduct?.quantity ? promotionProduct?.quantity : 0) !== 0) {
                        togglePromotionModal(
                          true,
                          dataCopy,
                          i,
                          quantity,
                          promotionProduct?.quantity ?? 0,
                        )
                      }
                    }
                  }
                }
                // PROMOTION LOGIC

                calculateTotalPrice(dataCopy)
                setTimeout(() => {
                  setSearchInput("")
                }, 100);
                searchRef.current.select()
              }
            }
            break;
          }
        }
        if (reduxSettings?.advancedSearchMode) {
          bottomProductSearchRef.current.select()
        }
        return;
      } else {
        setSearchInput("")
      }
      if (event.key === '*') {
        if (Number(dataCopy.discountAmount > 0)) {
          toast.error(t('discount_was_applied'))
          return
        }
        for (let i = 0; i < dataCopy.itemsList.length; i++) {
          if (dataCopy.itemsList[i]['selected']) {
            if (Number(searchInput.replace(/\D/g, '')) < dataCopy.itemsList[i]['price']) {
              toast.error(t('selling_price_cannot_be_lower_than_the_admission_price'))
              setSearchInput("")
              break;
            } else {
              if (activePrice.active === 1) {
                dataCopy.itemsList[i]['wholesalePrice'] = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
                dataCopy.itemsList[i]['salePrice'] = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
              } else if (activePrice.active === 2) {
                dataCopy.itemsList[i]['bankPrice'] = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
                dataCopy.itemsList[i]['salePrice'] = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
              } else {
                dataCopy.itemsList[i]['salePrice'] = Number(searchInput.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
              }
              calculateTotalPrice(dataCopy)
              setSearchInput("")
              searchRef.current.select()
              break;
            }
          }
        }
      }
      if (event.key === '-') {
        if (Number(dataCopy.discountAmount > 0)) {
          toast.error(t('discount_was_applied'))
          return
        }
        const inputData = Number(searchInput.replace(/[^0-9.]/g, ''))
        for (let i = 0; i < dataCopy.itemsList.length; i++) {
          if (dataCopy.itemsList[i]['selected']) {
            if (isFloat(Number(inputData) / Number(dataCopy.itemsList[i]['salePrice'])) && dataCopy.itemsList[i]['uomId'] === 1) { // Нельзя менять общую сумму штучной продукции только весовой
              toast.error(t('invalid_amount'))
              setSearchInput("")
            } else {
              if (!cashbox.saleMinus && ((Number(inputData) / Number(dataCopy.itemsList[i]['salePrice'])) > Number(dataCopy.itemsList[i]['balance']))) {
                toast.error(t('limit_is_exceeded'))
              } else if (!cashbox.saleMinus && (Number(dataCopy.itemsList[i]['balance']) > (Number(inputData) / Number(dataCopy.itemsList[i]['salePrice'])))) {
                dataCopy.itemsList[i]['quantity'] = Number(inputData) / Number(dataCopy.itemsList[i]['salePrice'])
              } else {
                dataCopy.itemsList[i]['quantity'] = Number(inputData) / Number(dataCopy.itemsList[i]['salePrice'])
              }
            }
            calculateTotalPrice(dataCopy)
            setSearchInput("")
            break;
          }
        }
      }
      if (event.key === '/') {
        if (Number(dataCopy.discountAmount > 0)) {
          toast.error(t('discount_was_applied'))
          return
        }
        setSearchInput("")
        for (let i = 0; i < dataCopy.itemsList.length; i++) {
          if (dataCopy.itemsList[i]['selected'] && dataCopy.itemsList[i]['unitList']?.length > 0) {
            searchProduct({ barcode: dataCopy.itemsList[i]['barcode'] })
            break;
          }
        }
      }
      if (event.key === 'F5') { // Discount in percent
        calculateDiscount(event.key, searchInput.replace(/[^0-9.]/g, ''))
        setSearchInput("")
        searchRef.current.select()
      }
      if (event.key === 'F6') { // Discount in amount
        calculateDiscount(event.key, searchInput.replace(/[^0-9.]/g, ''))
        setSearchInput("")
        searchRef.current.select()
      }
      if (event.key === 'F7') { // Discount in amount per item
        calculateDiscount(event.key, searchInput.replace(/[^0-9.]/g, ''))
        setSearchInput("")
        searchRef.current.select()
      }
    } else {
      setSearchInput(searchInput.replace(/[^0-9.]/g, ''))
    }
  }

  function handlePromotionLogic(e) {
    e.preventDefault()

    if (!showPromotionModal?.barcode) return

    if (showPromotionModal?.barcode !== showPromotionModal?.promotionProductBarcode) {
      toast.error('Неверный баркод')
      return
    }

    if (showPromotionModal.quantity === 1) {
      searchProduct({
        'barcode': showPromotionModal?.barcode,
        'promotion': true,
        'promotionProductBarcode': showPromotionModal?.promotionProductBarcode
      })
      setShowPromotionModal({
        ...showPromotionModal,
        'bool': false,
      })
    }

    if (showPromotionModal.quantity > 1) {
      if (Number(showPromotionModal.quantity) === Number(showPromotionModal.inserted + 1)) {
        var indexPromotion = data.itemsList.findIndex(x => (x.barcode === showPromotionModal.promotionProductBarcode && x.promotion))
        var dataCopy = { ...data }

        if (indexPromotion === -1 && indexPromotion !== undefined) {
          searchProduct({
            'barcode': showPromotionModal?.barcode,
            'promotion': true,
            'promotionProductBarcode': showPromotionModal?.promotionProductBarcode,
            'forcePomotionQuantity': showPromotionModal.inserted + 1
          })
        } else {
          dataCopy.itemsList[indexPromotion]['quantity'] = showPromotionModal.inserted + 1
        }

        setData(dataCopy)
        setShowPromotionModal({
          ...showPromotionModal,
          'bool': false,
          'inserted': '',
          'barcode': '',
        })
      } else {
        setShowPromotionModal({
          ...showPromotionModal,
          'inserted': showPromotionModal.inserted + 1,
          'barcode': '',
        })
      }
    }
  }

  function togglePromotionModal(bool, dataCopy, index, quantity = 1, inserted = 0) {
    //promotionQuantity = Math.floor(dataCopy.itemsList[index]['quantity'] / dataCopy.itemsList[index]
    setShowPromotionModal({
      ...showPromotionModal,
      'bool': true,
      'barcode': '',
      'inserted': inserted,
      'quantity': quantity,
      'mainProductBarcode': dataCopy.itemsList[index]['barcode'],
      'promotionProductName': dataCopy.itemsList[index]['promotionProductName'],
      'promotionProductBarcode': dataCopy.itemsList[index]['promotionProductBarcode'],
      'promotionProductQuantity': dataCopy.itemsList[index]['promotionProductQuantity'],
      'promotionQuantity': dataCopy.itemsList[index]['promotionQuantity'],
    })
    setTimeout(() => {
      inputPromotionRef.current.select()
    }, 100);
  }

  function calculateFreeItemsToProvide(purchasedQuantity, promotionQuantity, freeItemsPerPromotion) {
    const promotionsCount = Math.floor(purchasedQuantity / promotionQuantity);
    const freeItemsToProvide = promotionsCount * freeItemsPerPromotion;
    return freeItemsToProvide;
  }

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

  function selectProductWithParamsModification(index) {

    var productWithParamsCopy = { ...productWithParams }
    if (productWithParamsCopy.modificationList[index]['serial'])
      productWithParamsCopy.serial = productWithParamsCopy.modificationList[index]['serial']
    if (productWithParamsCopy.modificationList[index]['party'])
      productWithParamsCopy.party = productWithParamsCopy.modificationList[index]['party']
    if (productWithParamsCopy.modificationList[index]['expDate'])
      productWithParamsCopy.expDate = productWithParamsCopy.modificationList[index]['expDate']

    if (productWithParamsCopy.unitList.length === 1) {
      productWithParamsCopy.selectedUnit = productWithParamsCopy.unitList[0]
      setProductWithParams(productWithParamsCopy)
      setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitListModal': false, 'unitProductModal': true })
    } else if (productWithParamsCopy.unitList.length > 1) {
      setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitListModal': true, 'unitProductModal': false })
    } else {
      setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitListModal': false, 'unitProductModal': false })
      console.log(productWithParamsCopy.quantity);

      addToList(productWithParamsCopy)
    }
  }

  function selectProductWithParamsUnit(index) {
    var productWithParamsCopy = { ...productWithParams }
    productWithParamsCopy.selectedUnit = productWithParamsCopy.unitList[index]
    setProductWithParams(productWithParamsCopy)
    setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false, 'unitListModal': false, 'unitProductModal': true })
  }

  function calculateChange() {
    var change = 0
    var paid = 0
    if (transactionsListCash.amountIn !== "") {
      paid += Number(transactionsListCash.amountIn)
    }
    if (transactionsListTerminal.amountIn !== "") {
      paid += Number(transactionsListTerminal.amountIn)
    }

    if (isNaN(paid)) paid = 0 // right number keyboard prevent click dot and enter
    change = Number(paid) - Number(data.totalPrice)
    setData({ ...data, 'change': change, 'paid': paid })
    dataRef.current = data
  }

  function calculateTotalPrice(dataCopy) {
    dataCopy.totalPrice = 0
    dataCopy.totalVatAmount = 0
    for (let i = 0; i < dataCopy.itemsList.length; i++) {
      if (dataCopy.itemsList[i]['active_price'] === 1) {
        dataCopy.totalPrice += Number(dataCopy.itemsList[i]['wholesalePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['wholesalePrice']) * Number(dataCopy.itemsList[i]['quantity'])
      } else if (dataCopy.itemsList[i]['active_price'] === 2) {
        dataCopy.totalPrice += Number(dataCopy.itemsList[i]['bankPrice']) * Number(dataCopy.itemsList[i]['quantity'])
        dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['bankPrice']) * Number(dataCopy.itemsList[i]['quantity'])
      } else {
        dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
        dataCopy.itemsList[i]['totalPrice'] = Number(dataCopy.itemsList[i]['salePrice']) * Number(dataCopy.itemsList[i]['quantity'])
      }

      dataCopy['totalVatAmount'] +=
        Number(dataCopy.itemsList[i]['totalPrice']) /
        (100 + Number(dataCopy.itemsList[i]['vat'])) *
        Number(dataCopy.itemsList[i]['vat'])
    }
    dataCopy.totalPrice = Math.floor(dataCopy.totalPrice * 100) / 100

    setData(dataCopy)
  }

  function calculateProductWithParamsUnit() {
    var quantity = 0
    var totalPrice = 0

    if (
      (productWithParamsUnit.packaging === "" || Number(productWithParamsUnit.packaging) === 0) &&
      (productWithParamsUnit.piece === "" || Number(productWithParamsUnit.piece) === 0)
    ) {
      setProductWithParamsUnit({ ...productWithParamsUnit, 'packaging': "", 'piece': "", 'quantity': 0, 'totalPrice': 0 })
      return;
    }

    if (
      productWithParamsUnit.packaging > 0 &&
      (productWithParamsUnit.piece === "" || Number(productWithParamsUnit.piece) === 0)
    ) {
      quantity = Number(productWithParamsUnit.packaging)
      if (activePrice.active === 1) {
        totalPrice = Number(productWithParams.wholesalePrice * productWithParamsUnit.packaging)
      } else if (activePrice.active === 2) {
        totalPrice = Number(productWithParams.bankPrice * productWithParamsUnit.packaging)
      } else {
        totalPrice = Number(productWithParams.salePrice * productWithParamsUnit.packaging)
      }
      setProductWithParamsUnit({ ...productWithParamsUnit, 'quantity': quantity, 'totalPrice': totalPrice })
      return;
    }

    if (productWithParamsUnit.piece && productWithParamsUnit.piece > (productWithParams.secondQuantity * productWithParams.balance)) {
      setProductWithParamsUnit({ ...productWithParamsUnit, 'piece': "" })
      return;
    }

    if (
      (productWithParamsUnit.packaging !== "" || Number(productWithParamsUnit.packaging) > 0) &&
      (productWithParamsUnit.piece !== "" || Number(productWithParamsUnit.piece) > 0)
    ) {
      if (Number(productWithParamsUnit.piece) === Number(productWithParams.selectedUnit.quantity)) {
        quantity = Number(productWithParamsUnit.packaging) + 1
        if (activePrice.active === 1) {
          totalPrice = Number(productWithParams.wholesalePrice) * Number(productWithParamsUnit.packaging + 1)
        } else if (activePrice.active === 2) {
          totalPrice = Number(productWithParams.bankPrice) * Number(productWithParamsUnit.packaging + 1)
        } else {
          totalPrice = Number(productWithParams.salePrice) * Number(productWithParamsUnit.packaging + 1)
        }
        setProductWithParamsUnit({ ...productWithParamsUnit, 'quantity': quantity, 'totalPrice': totalPrice })
      } else {
        quantity = Number(productWithParamsUnit.packaging) + (Number(productWithParamsUnit.piece) / Number(productWithParams.selectedUnit.quantity))
        if (activePrice.active === 1) {
          totalPrice = Number(productWithParams.wholesalePrice * quantity)
        } else if (activePrice.active === 2) {
          totalPrice = Number(productWithParams.bankPrice * quantity)
        } else {
          totalPrice = Number(productWithParams.salePrice * quantity)
        }
        setProductWithParamsUnit({ ...productWithParamsUnit, 'quantity': quantity, 'totalPrice': totalPrice })
      }
      return;
    }

    if (
      (productWithParamsUnit.packaging === "" || Number(productWithParamsUnit.packaging) === 0) &&
      (productWithParamsUnit.piece !== "" || Number(productWithParamsUnit.piece) > 0)
    ) {
      quantity = Number(productWithParamsUnit.piece) / Number(productWithParams.secondQuantity)
      if (activePrice.active === 1) {
        totalPrice = Number(productWithParams.wholesalePrice * quantity)
      } else if (activePrice.active === 2) {
        totalPrice = Number(productWithParams.bankPrice * quantity)
      } else {
        totalPrice = Number(productWithParams.salePrice * quantity)
      }
      setProductWithParamsUnit({ ...productWithParamsUnit, 'quantity': quantity, 'totalPrice': totalPrice })
      return;
    }
  }

  function calculateDiscount(key, value, dataCopy = {}) {
    if (Object.keys(dataCopy).length === 0) {
      dataCopy = { ...data }
    }

    if (key === 'F5' && Number(value) > 100) {
      toast.error(t('limit_is_exceeded'))
      return
    }

    var temporaryTotalPrice = dataCopy.discountAmount === 0 ? dataCopy.totalPrice : dataCopy.totalPriceBeforeDiscount
    if (dataCopy.totalPriceBeforeDiscount === 0) {
      temporaryTotalPrice = dataCopy.totalPrice
    }
    if (key === 'F6' && (100 / (temporaryTotalPrice / Number(value))) > 100) {
      toast.error(t('limit_is_exceeded'))
      return
    }

    if (key === 'F7' && Number(value) > Number(dataCopy.totalPrice)) {
      toast.error(t('limit_is_exceeded'))
      return
    }

    if (key === 'F7' && Number(value) > 0) { // Он должен стоять до ф5 ф6
      dataCopy.payedWithDiscount = 'F7'
      dataCopy.totalPrice = 0
      dataCopy.discountAmount = 0
      dataCopy.totalVatAmount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        if (dataCopy.itemsList[i]['selected']) {
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice'] * dataCopy.itemsList[i]['quantity'])
          dataCopy.itemsList[i]['discountAmount'] = Number(value)
          dataCopy.itemsList[i]['totalPrice'] = dataCopy.itemsList[i]['totalPrice'] - Number(value)
          dataCopy.discountAmount += Number(dataCopy.itemsList[i]['discountAmount'])
        } else {
          dataCopy.discountAmount += Number(dataCopy.itemsList[i]['discountAmount'])
          dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice'] * dataCopy.itemsList[i]['quantity'])
        }

        dataCopy['totalVatAmount'] +=
          Number(dataCopy.itemsList[i]['totalPrice']) /
          (100 + Number(dataCopy.itemsList[i]['vat'])) *
          Number(dataCopy.itemsList[i]['vat'])
      }

      dataCopy.totalPriceBeforeDiscount = dataCopy.totalPrice
      dataCopy.totalPrice = dataCopy.totalPrice - dataCopy.discountAmount

      setData(dataCopy)
      return
    }

    if (data.discountAmount) {
      dataCopy.discountAmount = 0
      dataCopy.totalPrice = dataCopy.totalPriceBeforeDiscount
      dataCopy.totalPriceBeforeDiscount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.itemsList[i]['discountAmount'] = 0
        dataCopy.itemsList[i]['totalPrice'] = (dataCopy.itemsList[i]['salePrice'] * dataCopy.itemsList[i]['quantity'])
      }
    }

    if (key === 'F5' && Number(value) > 0) {
      dataCopy.payedWithDiscount = 'F5'
      dataCopy.discountAmount = 0
      dataCopy.totalPrice = 0
      dataCopy.totalVatAmount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.totalPrice += Number(dataCopy.itemsList[i]['salePrice'] * dataCopy.itemsList[i]['quantity'])
        dataCopy.itemsList[i]['discountAmount'] = (dataCopy.itemsList[i]['totalPrice'] * Number(value)) / 100
        dataCopy.itemsList[i]['totalPrice'] = dataCopy.itemsList[i]['totalPrice'] - (dataCopy.itemsList[i]['totalPrice'] * Number(value)) / 100

        dataCopy['totalVatAmount'] +=
          Number(dataCopy.itemsList[i]['totalPrice']) /
          (100 + Number(dataCopy.itemsList[i]['vat'])) *
          Number(dataCopy.itemsList[i]['vat'])
      }

      dataCopy.discountAmount = (dataCopy.totalPrice * Number(value)) / 100
      dataCopy.totalPriceBeforeDiscount = dataCopy.totalPrice
      dataCopy.totalPrice = dataCopy.totalPrice - (dataCopy.totalPrice * Number(value)) / 100

      setData(dataCopy)
    }

    if (key === 'F6' && Number(value) > 0) {
      dataCopy.payedWithDiscount = 'F6'
      var percent = 100 / (dataCopy.totalPrice / Number(value))
      if (percent > 100) {
        toast.error(t('limit_is_exceeded'))
        return
      }

      dataCopy.discountAmount = Number(value)
      dataCopy.totalPriceBeforeDiscount = dataCopy.totalPrice
      dataCopy.totalPrice = dataCopy.totalPriceBeforeDiscount - (dataCopy.totalPrice * percent) / 100
      dataCopy.totalVatAmount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.itemsList[i]['discountAmount'] = ((dataCopy.itemsList[i]['totalPrice'] * percent) / 100)
        dataCopy.itemsList[i]['totalPrice'] = dataCopy.itemsList[i]['totalPrice'] - ((dataCopy.itemsList[i]['totalPrice'] * percent) / 100)

        dataCopy['totalVatAmount'] +=
          Number(dataCopy.itemsList[i]['totalPrice']) /
          (100 + Number(dataCopy.itemsList[i]['vat'])) *
          Number(dataCopy.itemsList[i]['vat'])
      }

      setData(dataCopy)
    }
  }

  function calculateVat(i) {
    var vat = 0;
    if (data.itemsList[i]['discountAmount']) {
      vat = Number((data.itemsList[i]['salePrice'] * data.itemsList[i]['quantity']) - data.itemsList[i]['discountAmount']) *
        Number(data.itemsList[i]['vat']) /
        (100 + Number(data.itemsList[i]['vat']))
    } else {
      vat = Number((data.itemsList[i]['salePrice'] * data.itemsList[i]['quantity'])) *
        Number(data.itemsList[i]['vat']) /
        (100 + Number(data.itemsList[i]['vat']))
    }

    return formatMoney(vat)
  }

  function showRightBar(bool) {
    setRightBar(bool)
  }

  function handlePaymentModal(boolean, activeTab = 1) {
    if (data.itemsList.length > 0) {
      if (boolean) {
        // console.log(''); // without this line next not work
        setTransactionsListCash({ ...transactionsListCash, amountIn: Number(data.totalPrice), paymentPurposeId: 1, paymentTypeId: 1 })
        setTransactionsListTerminal({ ...transactionsListTerminal, amountIn: 0, paymentPurposeId: 1, paymentTypeId: 2 })
        setData({ ...data, chequeOfdType: 0 })
        setTimeout(() => {
          amountInRef.current.select()
        }, 100);
      } else {
        setActiveTab(1)
      }
      setShowPaymentModal(boolean)
      searchRef.current.select()

      if (activeTab === 3) {
        setLoyaltyUserInfo({ award: 0, balance: 0, code: 0, firstName: "", imageUrl: null, lastName: "", reason: "", status: "", amount: "" })
        setLoyaltySearchUserInput("")
      }
    }
  }

  function selectPaymentTab(tabNumber) {
    if (tabNumber === 1) {
      setTransactionsListCash({ ...transactionsListCash, amountIn: Number(data.totalPrice), paymentPurposeId: 1, paymentTypeId: 1 })
      setTransactionsListTerminal({ ...transactionsListTerminal, amountIn: 0, paymentPurposeId: 1, paymentTypeId: 2 })
    }
    if (tabNumber === 2) {
      setTransactionsListCash({ ...transactionsListCash, "amountIn": "" })
      setTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": "" })
      setData({ ...data, 'clientId': 0, 'clientName': '', 'organizationId': 0, 'organizationName': '' })
      setDebtorOut({ "clientId": 0, "clientComment": "", "clientAmount": 0 })
    }
    if (tabNumber === 3) {
      setTransactionsListCash({ ...transactionsListCash, "amountIn": Number(data.totalPrice) })
      setTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": "" })
      // 
      setLoyaltyTransactionsListCash({ ...transactionsListCash, "amountIn": Number(data.totalPrice) })
      setLoyaltyTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": "" })
    }
    if (tabNumber === 4) {
      setTransactionsListCash({ ...transactionsListCash, "amountIn": "" })
      setTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": "" })

      setData({ ...data, 'change': 0, 'clientId': 0, 'clientName': '', 'organizationId': 0, 'organizationName': '' })
      setDebtorOut({ "clientId": 0, "clientComment": "", "clientAmount": 0 })
    }

    setActiveTab(tabNumber);
  }

  function selectProduct(item) {
    if (item.promotion) return
    var dataCopy = { ...data }
    for (let i = 0; i < dataCopy.itemsList.length; i++) {
      if (item.productId === dataCopy.itemsList[i]['productId']) {
        dataCopy.itemsList[i]['selected'] = true
      } else {
        dataCopy.itemsList[i]['selected'] = false
      }
    }

    setData(dataCopy)
    searchRef.current.focus()
  }

  function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
  }

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms);
    })
  }

  const multikassaOfd = reduxSettings?.multikassaOfd;

  async function getProductInfoFromMultikassa(searchMxikCode) {
    const url = `http://localhost:8080/api/v1/products/check?mxikCode=${searchMxikCode}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Ensure correct path access with optional chaining
      return result.data?.data?.[0]?.info || {}; // Return an empty object if not available
    } catch (error) {
      console.error('Fetch error:', error);
      return {};
    }
  }

  function mapToMultikassa(input) {
    const currentDateTime = new Date().toISOString().replace('T', ' ').slice(0, 19); // Format: YYYY-MM-DD HH:MM:SS

    // Return promises for each item to handle async API calls within a non-async function
    const itemPromises = input.itemsList.map(item => {
      return getProductInfoFromMultikassa(item.gtin).then(details => {
        const packageInfo = details.packageNames?.[0] || {};

        return {
          classifier_class_code: item.gtin,
          product_mark: item.marking == 0,
          product_name: item.productName,
          product_barcode: item.barcode,
          product_barcodes: [
            {
              barcode: item.barcode,
              type: null
            }
          ],
          product_price: parseInt(item.salePrice, 10),
          total_product_price: item.totalPrice,
          product_without_vat: item.vat === 0,
          product_discount: item.discountAmount,
          count: item.quantity,
          product_vat_percent: item.vat,
          other: 0,
          product_package: String(packageInfo.code || "default_code"),
          product_package_name: packageInfo.nameLat || "default_name"

        };
      });
    });

    return Promise.all(itemPromises).then(items => ({
      module_operation_type: "3",
      receipt_sum: input.totalPrice * 100,
      receipt_cashier_name: localStorage.getItem("cashierName"),
      receipt_gnk_receivedcash: input.transactionsList.find(t => t.paymentTypeId === 1)?.amountIn * 100 || 0,
      receipt_gnk_receivedcard: input.transactionsList.find(t => t.paymentTypeId !== 1)?.amountIn * 100 || 0,
      receipt_gnk_time: currentDateTime,
      items: items,
      location: {
        latitude: parseFloat(localStorage.getItem("lat")),
        longitude: parseFloat(localStorage.getItem("lon")) //"tradepoint_coordinates": "(41.2969055300243,69.25275371796873)",
      }
    }));
  }

  const [expDate, setExpDate] = useState('')
  const [UtilPaidModal, setUtilPaidModal] = useState('')

  useEffect(() => {
    GET(`/services/desktop/api/exp-date/`, { posId: cashbox?.posId }).then(response => {
      const paidUntil = response;
      const endDate = paidUntil ? new Date(paidUntil.split(".").reverse().join("-")) : null;
      let daysUntilPaid = null;
      if (endDate && !isNaN(endDate.getTime())) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Bugunning vaqt qismini nolga o‘rnatamiz
        endDate.setHours(0, 0, 0, 0); // End Date vaqt qismini nolga o‘rnatamiz

        const differenceInMilliseconds = endDate.getTime() - now.getTime();
        daysUntilPaid = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));
        setExpDate(daysUntilPaid)
      }
    })
  }, [])


  async function createCheque(e, type = "cash") {
    if (e) e?.preventDefault();
    if (globalDisable.current) {
      return
    }

    globalDisable.current = true
    var dataCopy = JSON.parse(JSON.stringify(data))
    setTimeout(() => {
      globalDisable.current = false
    }, 3000);
    dataCopy.chequeNumber = generateChequeNumber(cashbox.posId, cashbox.cashboxId, cashbox.id ? cashbox.id : shift.id)

    if (Number(dataCopy.paid) > 99999999) {
      if (!reduxSettings?.amountExceedsLimit) {
        toast.error(t('amount_exceeds_maximum'))
        return;
      }
    }
    if (transactionsListCash.amountIn) {
      dataCopy.transactionsList.push(transactionsListCash)
    }

    if (transactionsListTerminal.amountIn) {
      dataCopy.transactionsList.push(transactionsListTerminal)
    }

    if (Number(dataCopy.change) > 0 && Number(dataCopy.paid) !== Number(dataCopy.change)) {
      dataCopy.transactionsList.push({ "amountIn": 0, "amountOut": dataCopy.change, "paymentTypeId": 1, "paymentPurposeId": 2 })
    }

    if (type === "F1" && reduxSettings?.showCashPaymentF1) {
      dataCopy.payedWith = "F1"
      dataCopy.transactionsList = []
      dataCopy.paid = Number(transactionsListCash.amountIn)
      dataCopy.transactionsList.push(transactionsListCash)
      if (Number(dataCopy.change) > 0) {
        dataCopy.transactionsList.push({ "amountIn": 0, "amountOut": dataCopy.change, "paymentTypeId": 1, "paymentPurposeId": 2 })
      }
    }
    if (type === "F1" && !reduxSettings?.showCashPaymentF1) {
      dataCopy.payedWith = "F1"
      dataCopy.transactionsList = []
      dataCopy.paid = Number(dataCopy.totalPrice)
      dataCopy.transactionsList.push({ "amountIn": Number(dataCopy.totalPrice), "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 1 })
    }

    if (type === "F2") {
      dataCopy.payedWith = "F2"
      dataCopy.transactionsList = []
      dataCopy.paid = Number(dataCopy.totalPrice)
      dataCopy.change = 0
      dataCopy.transactionsList.push({ "amountIn": Number(dataCopy.totalPrice), "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 })
    }

    if (dataCopy.discountAmount) { //must stay after f1 f2 logic
      dataCopy.totalPrice = dataCopy.totalPriceBeforeDiscount
    }

    if (debtorOut.clientId) {
      dataCopy.clientId = debtorOut.clientId
      dataCopy.clientName = debtorOut.clientName
      dataCopy.clientComment = debtorOut.clientComment
      dataCopy.clientCurrencyId = debtorOut.clientCurrencyId
      dataCopy.clientAmount = Math.abs(dataCopy.change)
      if (debtorOut.clientBalance) {
        dataCopy.clientBalance = Number(debtorOut.clientBalance) + dataCopy.change
      }
      dataCopy.change = 0
    }

    if (debtorOut.organizationId) {
      dataCopy.organizationId = debtorOut.organizationId
      dataCopy.organizationName = debtorOut.organizationName
      dataCopy.organizationComment = debtorOut.organizationComment
      dataCopy.organizationCurrencyId = debtorOut.organizationCurrencyId
      dataCopy.organizationAmount = Math.abs(dataCopy.change)
      dataCopy.change = 0
    }

    if (type === "loyalty") {
      dataCopy.transactionsList = []
      if (loyaltyTransactionsListCash.amountIn) {
        dataCopy.transactionsList.push(loyaltyTransactionsListCash)
      }
      if (loyaltyTransactionsListTerminal.amountIn) {
        dataCopy.transactionsList.push(loyaltyTransactionsListTerminal)
      }
      if (loyaltyUserInfo.amount) {
        dataCopy.transactionsList.push({ "amountIn": loyaltyUserInfo.amount, "amountOut": 0, "paymentTypeId": 4, "paymentPurposeId": 9 })
      }
      dataCopy.change = 0
      dataCopy.loyaltyClientId = loyaltyUserInfo.userId
      dataCopy.loyaltyClientLogin = loyaltyUserInfo.userLogin
      dataCopy.loyaltyClientName = loyaltyUserInfo.firstName
      dataCopy.loyaltyBonusPercentage = loyaltyUserInfo.award
      dataCopy.loyaltyClientAmount = loyaltyUserInfo.amount ? loyaltyUserInfo.amount : 0
      dataCopy.loyaltyBonus = ((dataCopy.totalPrice - loyaltyUserInfo.amount) * (loyaltyUserInfo.award / 100))
    }

    dataCopy.chequeDate = getUnixTime()
    dataCopy.chequeTimeEnd = getUnixTime()
    dataCopy.transactionId = generateTransactionId(cashbox.posId, cashbox.cashboxId, cashbox.id ? cashbox.id : shift.id)

    if (transactionsListTerminal?.paymentTypeId === 7) {
      if (!cashbox?.uzumPay?.merchant_secret_key) {
        return toast.error('Отсуствуют merchant данные Uzum')
      }

      cashbox.uzumPay.type = "uzum"
      var authToken = window.electron.appApi.generateSha1(cashbox.uzumPay)
      var uzumPayload = {
        "amount": transactionsListTerminal.amountIn * 100,
        "cashbox_code": `posId${cashbox.posId}cashboxId${cashbox.cashboxId}shiftId${cashbox.id ? cashbox.id : shift.id}`,
        "otp_data": dataCopy.otpCode,
        "transaction_id": dataCopy.transactionId,
        "service_id": cashbox?.uzumPay?.merchant_service_id
      }
      var response = await UZUM_POST("/merchant/payment", uzumPayload, authToken)

      dataCopy.uzumPaymentId = response.payment_id
      dataCopy.uzumClientPhone = response.client_phone_number
      dataCopy.QRPaymentProvider = 161
      if (response?.error_code > 0) {
        toast.error(response?.error_message)
        return
      }
    }

    if (transactionsListTerminal?.paymentTypeId === 6) {
      if (!cashbox?.paymePay?.merchant_secret_key) {
        return toast.error('Отсуствуют merchant данные Payme')
      }

      var paymePayloadCreate = {
        "id": dataCopy.chequeNumber,
        "method": "receipts.create",
        "params": {
          "amount": transactionsListTerminal.amountIn * 100,
          "account": {
            "order_id": dataCopy.chequeNumber,
          },
          "detail": {
            "receipt_type": 0,
            "items": [],
          },
        }
      }
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        var obj = {
          'title': dataCopy.itemsList[i]['productName'],
          'price': dataCopy.itemsList[i]['salePrice'] * 100,
          'count': dataCopy.itemsList[i]['quantity'],
          'code': dataCopy.itemsList[i]['gtin'],
          'vat_percent': dataCopy.itemsList[i]['vat'],
          'package_code': dataCopy.itemsList[i]['packageCode'],
        }
        paymePayloadCreate.params.detail.items.push(obj)
      }
      //var auth = "5e730e8e0b852a417aa49ceb:ZPDODSiTYKuX0jyO7Kl2to4rQbNwG08jbghj" //test auth
      var auth = `${cashbox?.paymePay?.merchant_id}:${cashbox?.paymePay?.merchant_secret_key}`
      //var token = "65491a117d9dec5565554793_E5YAUtEMTvdVmhfO7OnU5gHfUDaFZdkzGjpKkPPS05X30CEMICwEq92HWB5G4EXw8YXkX9n4YzWa76tJIR71psQZiHRSnOI79htZRI3EQRCbSNRpkxmavtvJVdJzHTrfijEj0RhRY64Mwu2fKDJpIudddbGzAFC0YKfu0hjxMO7SY7pDRPXcf8WxCBC0NryZhNqjHQN0K14stIYfewSVROYAuMcW69Swg4P65fhrj4KtK9XObKBN1USBiiuyhOqCEd2UA3F8QzkxwuCGQmBQEiS7nXUUSf8c7czAh0H86yVHZfXJqbdoh1aSKodoGcTIX0cwhbSoDS6YCCMScBVN7QSPo5CyTHzfmEjn8psJQnZ7Uqhp97hrstVTbPh8bHRyuRTc9n"
      var paymeResponseCreate = await PAYME_POST("/merchant/payment", paymePayloadCreate, auth)

      var paymePayload = {
        "id": paymeResponseCreate.id,
        "method": "receipts.pay",
        "params": {
          "id": paymeResponseCreate.result.receipt._id,
          "token": dataCopy.otpCode,
        }
      }
      var paymeResponse = await PAYME_POST("/merchant/payment", paymePayload, auth)
      if (paymeResponse?.error?.code) {
        toast.error(paymeResponse?.error?.message + paymeResponse?.error?.data)
        return
      }
      dataCopy.paymePaymentId = paymeResponse.result.receipt._id
      dataCopy.paymeClientPhone = paymeResponse.result.receipt.payer.phone
      dataCopy.QRPaymentProvider = 161
      if (response?.error_code > 0) {
        toast.error(response?.error_message)
        return
      }
    }

    if (transactionsListTerminal?.paymentTypeId === 5) {
      if (!cashbox?.clickPay?.merchant_secret_key) {
        return toast.error('Отсуствуют merchant данные Click')
      }
      cashbox.clickPay.type = "click"

      var clickAuthToken = window.electron.appApi.generateSha1(cashbox.clickPay)
      var clickPayload = {
        "amount": transactionsListTerminal.amountIn,
        "cashbox_code": `posId${cashbox.posId}cashboxId${cashbox.cashboxId}shiftId${cashbox.id ? cashbox.id : shift.id}`,
        "otp_data": dataCopy.otpCode,
        "transaction_id": dataCopy.transactionId,
        "service_id": cashbox?.clickPay?.merchant_service_id,
        "items": []
      }

      // for (let i = 0; i < dataCopy.itemsList.length; i++) {
      // 	var clickObj = {
      // 		'Name': dataCopy.itemsList[i]['productName'],
      // 		'Barcode': dataCopy.itemsList[i]['barcode'] * 100,
      // 		'Labels': "",
      // 		'SPIC': dataCopy.itemsList[i]['gtin'],
      // 		'Units': "",
      // 		'PackageCode': dataCopy.itemsList[i]['packageCode'],
      // 		'GoodPrice': dataCopy.itemsList[i]['salePrice'],
      // 		'Price': (dataCopy.itemsList[i]['salePrice'] * 100) * dataCopy.itemsList[i]['quantity'],
      // 		'Amount': dataCopy.itemsList[i]['quantity'],
      // 		'VAT': dataCopy.itemsList[i]['vat'],
      // 		'VATPercent': dataCopy.itemsList[i]['vat'],
      // 		'Discount': dataCopy.itemsList[i]['discount'],
      // 		'Other': dataCopy.itemsList[i]['packageCode'],
      // 		'CommissionInfo': {
      // 			'TIN': ''
      // 		},
      // 	}
      // 	clickPayload.items.push(clickObj)
      // }
      var clickResponse = await CLICK_POST("", clickPayload, clickAuthToken)

      dataCopy.clickPaymentId = clickResponse.payment_id
      dataCopy.clickClientPhone = clickResponse.phone_number
      dataCopy.QRPaymentProvider = 161
      if (clickResponse?.error_code) {
        toast.error(clickResponse?.error_note)
        return
      }
    }

    if (reduxSettings?.ofd && !reduxSettings?.ofdFactoryId) {
      toast.error('FactoryID не найден в настройках')
      return
    }
    let invalidProducts = [];
    if (reduxSettings.ofd && cashbox.ofd && reduxSettings?.ofdFactoryId) {
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        const item = dataCopy.itemsList[i];
        if (!item['gtin'] || !item['packageCode']) {
          invalidProducts.push(`Продукт №${i + 1} ${item.name}`);
        }
      }
    }
    if (invalidProducts.length > 0) {
      toast.error(`Продукты без ofd:\n${invalidProducts.join(', ')}`);
      return;
    }


    //reduxSettings.ofd && cashbox.ofd && reduxSettings?.ofdFactoryId
    if (reduxSettings?.ofd && cashbox.ofd && reduxSettings?.ofdFactoryId) {
      var printerResponse;
      //var receiptPrinter = reduxSettings.receiptPrinter;
      var receiptPrinter = reduxSettings?.receiptPrinter;
      // console.log(receiptPrinter)
      //XP-58C (copy 1)
      var domInString2 = printChequeRef2.current.outerHTML
      window.electron.appApi.print(domInString2, receiptPrinter)

      await delay(1000)

      // console.log('delay:', receiptPrinter)
      printerResponse = await window.electron.appApi.cmdPrinter(receiptPrinter)
      // console.log("printerResponse", printerResponse)
      const lines = printerResponse.replace(/"/g, ``).split(/\r?\n/)
      var printerJobIds = []
      for (let i = 0; i < lines.length; i++) {
        if (Number(lines[i].slice(0, 4).trim()) !== 0 && !isNaN(Number(lines[i].slice(0, 4).trim()))) {
          printerJobIds.push({
            "printerName": receiptPrinter,
            "id": Number(lines[i].slice(0, 4).trim()),
          })
        }
      }

      if (printerJobIds.length > 0) {
        try {
          window.electron.ipcRenderer.send('cmd-delete-printer-job', printerJobIds)
        } catch (error) {
          console.log(error)
        }
      }

      if (reduxSettings?.ofd && cashbox.ofd) {
        if (printerResponse.includes("Id")) {
          toast.error(t('printer_problems'))
          return
        }
      }

      var responseDate = {}
      try {
        if (window.navigator.onLine) {
          responseDate = await GET("/services/desktop/api/date-helper")
        }
      } catch (error) {
        console.log('error')
      }
      dataCopy.chequeDate = responseDate?.unixDateTime ? responseDate?.unixDateTime : getUnixTime()
      dataCopy.dateFormat1 = responseDate?.dateFormat1
      dataCopy.chequeTimeEnd = responseDate?.unixDateTime ? responseDate?.unixDateTime : getUnixTime()
      responseDate.ofdDate = responseDate?.ofdDate ? responseDate?.ofdDate : todayYYYYMMDD()
      var responseOfd = await createOfdCheque(dataCopy, responseDate.ofdDate)
      dataCopy.fiscalResult = responseOfd?.result
      dataCopy.appletVersion = dataCopy?.fiscalResult?.AppletVersion
      dataCopy.dateTime = dataCopy?.fiscalResult?.DateTime
      dataCopy.fiscalSign = dataCopy?.fiscalResult?.FiscalSign
      dataCopy.receiptSeq = dataCopy?.fiscalResult?.ReceiptSeq
      dataCopy.qRCodeURL = dataCopy?.fiscalResult?.QRCodeURL
      dataCopy.terminalID = dataCopy?.fiscalResult?.TerminalID

      if (responseOfd?.error) {
        switch (responseOfd?.error?.code) {
          case 36870:
            toast.error(`Код ошибки: 36870 Количество чеков равно нулю`)
            break;
          case 36871:
            toast.error(`Код ошибки: 36871 Номер чека не правильный`)
            break;
          case 36872:
            toast.error(`Код ошибки: 36872 Чек не найден`)
            break;
          case 36873:
            toast.error(`Код ошибки: 36873 Размер информации не поддерживается`)
            break;
          case 36877:
            toast.error(`Код ошибки: 36877 Формат чека на правильный`)
            break;
          case 36878:
            toast.error(`Код ошибки: 36878 Общая сумма превышает максимального значение`)
            break;
          case 36879:
            toast.error(`Код ошибки: 36879 Общая сумма превышает стоимость по товарным позициям`)
            break;
          case 36886:
            toast.error(`Код ошибки: 36886 Память чека заполнена`)
            break;
          case 36888:
            toast.error(`Код ошибки: 36888 Время чека старое`)
            break;
          case 36889:
            toast.error(`Код ошибки: 36889 Кол-во дней хранения чеков превышено, следует отправить чеки`)
            break;
          case 36890:
            toast.error(`Код ошибки: 36890 Формат времени последней транзакции ошибочна`)
            break;
          case 36891:
            toast.error(`Код ошибки: 36891 Формат времени чека ошибочная`)
            break;
          case 36892:
            toast.error(`Код ошибки: 36892 Ошибка сервера ОФД по длине строк`)
            break;
          case 36893:
            toast.error(`Код ошибки: 36893 Ошибка сервера ОФД по подписи чека`)
            break;
          case 36894:
            toast.error(`Код ошибки: 36894 Ошибка сервера ОФД по номеру ФМ (все три позиции связаны с несанкционированным доступом к серверу ОФД)`)
            break;
          case 36895:
            toast.error(`Код ошибки: 36895 -`)
            break;
          case 36896:
            toast.error(`Код ошибки: 36896 Ошибка связана с длиной строки Z-report`)
            break;
          case 36897:
            toast.error(`Код ошибки: 36897 Время закрытие чека старое`)
            break;
          case 36898:
            toast.error(`Код ошибки: 36898 Память Z-report заполнена`)
            break;
          case 36899:
            toast.error(`Код ошибки: 36899 Формат текущего времени ошибочна`)
            break;
          case 36900:
            toast.error(`Код ошибки: 36900 Формат времени последнего отправленного чека ошибочна`)
            break;
          case 36902:
            toast.error(`Код ошибки: 36902 Номер Z-report не правильный`)
            break;
          case 36903:
            toast.error(`Код ошибки: 36903 -`)
            break;
          case 36904:
            toast.error(`Код ошибки: 36904 Фискальный модуль заблокирован`)
            break;
          case 36905:
            toast.error(`Код ошибки: 36905 -`)
            break;
          case 36906:
            toast.error(`Код ошибки: 36906 -`)
            break;
          case 36907:
            toast.error(`Код ошибки: 36907 Текущий Z-report пустой`)
            break;
          case 36908:
            toast.error(`Код ошибки: 36908 Общая сумма чека не может быть нулем`)
            break;
          case 36909:
            toast.error(`Код ошибки: 36909 Z-report не открыт`)
            break;
          case 36910:
            toast.error(`Код ошибки: 36910 Формат времени открытия Z-report ошибочна`)
            break;
          case 36911:
            toast.error(`Код ошибки: 36911 Превышено кол-во операций (продажи и возврата) в Z-отчете`)
            break;
          case 36912:
            toast.error(`Код ошибки: 36912 Z-report уже открыт`)
            break;
          case 36913:
            toast.error(`Код ошибки: 36913 Не достаточно средств для возврата (наличка)`)
            break;
          case 36914:
            toast.error(`Код ошибки: 36914 Не достаточно средств для возврата (пластик)`)
            break;
          case 36915:
            toast.error(`Код ошибки: 36915 Не достаточно средств для возврата (НДС)`)
            break;
          case 36916:
            toast.error(`Код ошибки: 36916 Время открытия Z-report старое`)
            break;
          case 36917:
            toast.error(`Код ошибки: 36917 Требуется обслуживание со стороны ОФД`)
            break;
          case 65274:
            toast.error(`Код ошибки: 65274 При регистрации чека возврата и при проверки информации об
						отозванном чеке (RefundInfo) возникла ошибка подключения к
						серверу ОФД. Повторите попытку.
						`)
            break;
          case 65275:
            toast.error(`Код ошибки: 65275 При регистрации чека возврата была передана информация об
						отозванном чеке (RefundInfo) с недействительным ФП
						`)
            break;
          case 65276:
            toast.error(`Код ошибки: 65276 При регистрации чека возврата была передана информация об
						отозванном чеке (RefundInfo) с неправильными значениями`)
            break;
          case 65277:
            toast.error(`Код ошибки: 65277 При регистрации чека возврата не была передана информация
						об отозванном чеке (RefundInfo)`)
            break;
          case 65278:
            toast.error(`Код ошибки: 65278 Сбой при вызове команды ФМ, повторите попытку.`)
            break;
          case 65279:
            toast.error(`Код ошибки: 65279 Сервер ОФД заблокировал принятия чеков от ФМ, обратитесь
						в ОФД. После разблокировки ФМ в ОФД, подождите
						определенное время (10 минут), затем перезапустите сервис
						FiscalDriveAPI для продолжения работы.`)
            break;
          case 65524:
            toast.error(`Код ошибки: 65524 Не удалось декодировать ответ от ФМ, повторите попытку.
						Возможно ФМ поврежден.`)
            break;
          case 65525:
            toast.error(`Код ошибки: 65525 Сервис FiscalDriveAPI не поддерживает версию апплета в ФМ,
						следует подключить новый ФМ с новым апплетом`)
            break;
          case 65528:
            toast.error(`Код ошибки: 65528 Ошибка при сохранении файла чека в БД, возможно файл БД
						поврежден.`)
            break;
          case 65529:
            toast.error(`Код ошибки: 65529 Не удалось декодировать ответ от ФМ, повторите попытку.
						Возможно ФМ поврежден.`)
            break;
          case 65531:
            toast.error(`Код ошибки: 65531 В переданном чеке есть ошибочные параметры, возможно не
						соблюдаются условия уравнения приведенные в разделе
						10.2.1`)
            break;
          case 65532:
            toast.error(`Код ошибки: 65532 Передан недействительный параметр в JSON`)
            break;
          case 65533:
            toast.error(`Код ошибки: 65533 Не удалось выбрать апплет в ФМ. Возможно в ФМ не был
						прошит апплетом или ФМ поврежден.`)
            break;
          case 65534:
            toast.error(`Код ошибки: 65534 Не удалось подключится к ФМ, ФМ не подключен или не
						найден по указанному заводскому номеру`)
            break;
          case 65535:
            toast.error(`Код ошибки: 65535 Другие ошибки. Подробности ошибки смотрите в лог файле
						сервиса FiscalDriveAPI`)
            break;
          case 'ERROR_RECEIPT_MEMORY_FULL':
            toast.error(`Отправить на сервер файлы чеков, получить
						RECEIPT_ACK и выполнить INS_ACK_RECEIPT`)
            break;
          default:
            toast.error(`Код ошибки: Неизвестная ошибка`)
            break;
        }
        return
      }
    }

    if (multikassaOfd) {
      try {
        // Call createOfdMultikassa and wait for the result

        var responseMultikassa = await createOfdMultikassa(dataCopy);


        // Update dataCopy with the returned values
        dataCopy.fiscalResult = {
          AppletVersion: responseMultikassa.appletVersion,
          DateTime: responseMultikassa.dateTime,
          FiscalSign: responseMultikassa.fiscalSign,
          ReceiptSeq: responseMultikassa.receiptSeq,
          QRCodeURL: responseMultikassa.qRCodeURL,
          TerminalID: responseMultikassa.terminalID,

        }
        dataCopy.requestOfd = JSON.stringify(responseMultikassa.requestOfd);
        dataCopy.responseOfd = JSON.stringify(responseMultikassa.responseOfd);
        dataCopy.chequeDate = responseMultikassa.chequeDate;
        dataCopy.chequeTimeEnd = responseMultikassa.chequeTimeEnd;
        dataCopy.appletVersion = responseMultikassa.appletVersion;
        dataCopy.dateTime = responseMultikassa.dateTime;
        dataCopy.fiscalSign = responseMultikassa.fiscalSign;
        dataCopy.receiptSeq = responseMultikassa.receiptSeq;
        dataCopy.qRCodeURL = responseMultikassa.qRCodeURL;
        dataCopy.terminalID = responseMultikassa.terminalID;

      } catch (error) {
        // Handle any errors during the process
        // toast.error("Error in multikassaOfd processing:", error);
      }
    }

    //console.log(dataCopy?.uzumPaymentId)
    if (reduxSettings?.ofd && dataCopy?.uzumPaymentId) {
      var uzumPayloadQr = {
        "payment_id": dataCopy?.uzumPaymentId,
        "fiscal_url": dataCopy?.qRCodeURL,
      }
      var response2 = await UZUM_POST("/merchant/payment/fiscal", uzumPayloadQr, authToken)
      dataCopy.uzumPaymentId = response2.payment_id
      if (response2?.error_code > 0) {
        toast.error(response2?.error_message)
        return
      }
    }

    if (reduxSettings?.humoTerminal && transactionsListTerminal?.amountIn && Number(transactionsListTerminal?.paymentTypeId) === 2) {
      var pinPadResult = await window.electron.appApi.cmdCommand(transactionsListTerminal?.amountIn)
      pinPadResult = pinPadResult.split("\r\n")
      if (pinPadResult[0] !== '000') {
        toast.error(`Код ошибки: ${pinPadResult[0]}`)
        return
      } else {
        dataCopy.pinPadCode = pinPadResult[0]
        dataCopy.pinPadCardNumber = pinPadResult[1]
        dataCopy.pinPad0 = pinPadResult[0]
        dataCopy.pinPad1 = pinPadResult[1]
        dataCopy.pinPad2 = pinPadResult[2]
        dataCopy.pinPad3 = pinPadResult[3]
        dataCopy.pinPad4 = pinPadResult[4]
        dataCopy.pinPad5 = pinPadResult[5]
        dataCopy.pinPad6 = pinPadResult[6]
        dataCopy.pinPad7 = pinPadResult[7]
      }
    }



    setData(dataCopy)
    await delay(200)

    window.electron.dbApi.insertCheques(dataCopy).then(() => {
      if (reduxSettings?.ofd || multikassaOfd) {
        var domInString3 = printChequeRef.current.outerHTML
        window.electron.appApi.print(domInString3, reduxSettings?.receiptPrinter)
      }
      if (!reduxSettings?.ofd && !multikassaOfd) {
        //setData(dataCopy)
        var domInString = printChequeRef.current.outerHTML
        if (!reduxSettings?.printerBroken && Number(reduxSettings?.printTo) === 0) {
          window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
          if (reduxSettings?.print2cheques) {
            setTimeout(() => {
              window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
            }, 300);
          }
        }

        if (reduxSettings?.print2cheques) {
          setTimeout(() => {
            window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
          }, 300);
        }
      }

      if (Number(reduxSettings?.printTo) === 1) { // print to excel
        var temporaryData = [
          { "A": t('pos'), "B": cashbox.posName },
          { "A": t('cashier'), "B": account.firstName + " " + account.lastName },
          { "A": '№ ' + t('check_number'), "B": dataCopy.chequeNumber },
          { "A": t('date'), "B": formatUnixTime(dataCopy.chequeDate) },
        ];

        temporaryData.push({ "A": t('product'), "B": t('quantity'), "C": t('price') })
        for (let i = 0; i < dataCopy.itemsList.length; i++) {
          temporaryData.push({
            "A": `${i + 1}. ${dataCopy.itemsList[i]['productName']}`,
            "B": dataCopy.itemsList[i]['quantity'] + ' X ' + formatMoney(dataCopy.itemsList[i]['salePrice']),
            "C": formatMoney(dataCopy.itemsList[i]['quantity'] * dataCopy.itemsList[i]['salePrice'])
          })
        }

        temporaryData.push({ "A": t('sale_amount'), "B": formatMoney(dataCopy.totalPrice) })
        temporaryData.push({ "A": t('discount'), "B": formatMoney(dataCopy.discountAmount) }) //
        temporaryData.push({ "A": t('to_pay'), "B": formatMoney(dataCopy.totalPrice - dataCopy.discountAmount) })

        temporaryData.push({ "A": t('paid'), "B": formatMoney(dataCopy.paid) })
        temporaryData.push({ "A": t('vat') + ' 12%', "B": dataCopy.totalVatAmount ? formatMoney(dataCopy.totalVatAmount) : formatMoney(0) })
        if (dataCopy.loyaltyClientName)
          temporaryData.push({ "A": t('client'), "B": dataCopy.loyaltyClientName })
        if (dataCopy.loyaltyBonus)
          temporaryData.push({ "A": 'Loyalty', "B": formatMoney(dataCopy.loyaltyBonus) })

        for (let i = 0; i < dataCopy.transactionsList.length; i++) {
          if (dataCopy.transactionsList[i]['paymentTypeId'] === 1) {
            temporaryData.push({ "A": t('cash'), "B": dataCopy.transactionsList[i]['amountIn'] })
          }
          if (dataCopy.transactionsList[i]['paymentTypeId'] === 2) {
            temporaryData.push({ "A": t('terminal'), "B": dataCopy.transactionsList[i]['amountIn'] })
          }
          if (dataCopy.transactionsList[i]['paymentTypeId'] === 4) {
            temporaryData.push({ "A": 'uGet', "B": dataCopy.transactionsList[i]['amountIn'] })
          }
        }

        temporaryData.push({ "A": t('change'), "B": formatMoney(dataCopy.change) })
        temporaryData.push({ "A": t('debt_amount'), "B": formatMoney(dataCopy.clientAmount) })
        if (dataCopy.clientAmount > 0) {
          temporaryData.push({ "A": t('debtor'), "B": dataCopy.clientName })
        }
        if ((Number(dataCopy.clientAmount) === 0 && dataCopy.clientName)) {
          temporaryData.push({ "A": t('client'), "B": dataCopy.clientName })
        }

        const ws = XLSX.utils.json_to_sheet(temporaryData, { skipHeader: true });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
        //XLSX.writeFile(wb, dataCopy.chequeNumber + ".xlsx");
        const args = {
          data: wb,
          chequeNumber: dataCopy.chequeNumber,
          openExcelFile: reduxSettings?.openExcelFile,
        }
        window.electron.appApi.uploadExcelToLocalDisk(args)
      }

      if (type === "loyalty" || type === "tirox") {
        POST("/services/desktop/api/cheque", dataCopy, false, false).then(response => {
          window.electron.dbApi.updateChequeStatus(dataCopy.chequeNumber, response.id)
        })
        setInitialLoyaltyState()
      }

      if (window.navigator.onLine && internetConnection !== 2 && reduxSettings?.autoSync) {
        if (type !== "loyalty") {
          dataCopy.cashierLogin = dataCopy.login
          syncCheque(dataCopy)
        }
      } else {
        if (type !== "loyalty") {
          dispatch(INCREMENT())
        }
      }

      setInitialDataState(type)
      handlePaymentModal(false)


      if (expDate < 4) {
        setUtilPaidModal(true)
      }

      if (!reduxSettings?.printerBroken) {
        localStorage.setItem("check_count", parseInt(localStorage.getItem("check_count")) + 1)
      }

      if (type === "F1") {
        setShowOnlyCashPaymentModal(false)
      }
      if (type === "F2") {
        setShowOnlyTerminalPaymentModal(false)
      }

      if (window.navigator.onLine && internetConnection !== 2 && reduxSettings?.autoSync && countUnsyncProducts >= 30) {
        syncCheques()
      }
    }).catch(e => {
      toast.error(e)
    })
  }

  async function createOfdMultikassa(dataCopy) {
    try {
      // Map data for Multikassa
      const mappedData = await mapToMultikassa(dataCopy);

      // Set requestOfd
      dataCopy.requestOfd = mappedData;

      // Send the request to the external API
      const responseOfd = await POST("http://localhost:8080/api/v1/operations", JSON.stringify(dataCopy.requestOfd), false, false);

      // Handle the response
      if (responseOfd?.success) {
        dataCopy.responseOfd = responseOfd;

        // Populate additional fields
        dataCopy.chequeDate = getUnixTime();
        dataCopy.chequeTimeEnd = getUnixTime();
        dataCopy.appletVersion = responseOfd.data?.receipt_gnk_appletversion;
        dataCopy.dateTime = responseOfd.data?.receipt_gnk_datetime;
        dataCopy.fiscalSign = responseOfd.data?.receipt_gnk_fiscalsign;
        dataCopy.receiptSeq = responseOfd.data?.receipt_gnk_receiptseq;
        dataCopy.qRCodeURL = responseOfd.data?.receipt_gnk_qrcodeurl;
        dataCopy.terminalID = responseOfd.data?.module_gnk_id;
      } else {
        // Handle errors from the response
        const formattedMessage = responseOfd.data.error.message + ": " +
          responseOfd.data.error.products.map(product => product).join(", ");
        toast.error(formattedMessage, { autoClose: 10000 });
      }

      // Return the updated dataCopy
      return dataCopy;
    } catch (error) {
      // Handle any errors during the process
      // toast.error("Error during createOfdMultikassa: " + error.message, { autoClose: 10000 });
      return null
    }
  }

  async function createOfdCheque(dataCopy, dateTime) {
    var method = "Api.SendSaleReceipt"
    var ReceiptType = dataCopy.chequeOfdType

    if (Number(dataCopy.chequeOfdType) === 1) {
      method = "Api.SendAdvanceReceipt"
    }

    if (Number(dataCopy.chequeOfdType) === 2) {
      method = "Api.SendCreditReceipt"
    }

    var ownerTin = ""
    var ownerPinfl = ""
    if (cashbox?.tin?.length === 9) {
      ownerTin = cashbox.tin
    }
    if (cashbox?.tin?.length === 14) {
      ownerPinfl = cashbox.tin
    }

    var ofdData = {
      "method": method,
      "id": 2,
      "params": {
        "FactoryID": reduxSettings?.ofdFactoryId,
        "Receipt": {
          "IsRefund": 0,
          "ReceivedCash": 0,
          "ReceivedCard": 0,
          "ReceiptType": ReceiptType,
          "Time": dateTime,
          "Location": {
            "Latitude": 0, //cashbox.gpsPointY,
            "Longitude": 0, //cashbox.gpsPointX,
          },
          "ExtraInfo": {
            "TIN": ownerTin,
            "PINFL": ownerPinfl,
            "CarNumber": "",
            "QRPaymentID": dataCopy?.uzumPaymentId,
            "QRPaymentProvider": dataCopy?.QRPaymentProvider,
            "PhoneNumber": dataCopy?.uzumClientPhone,
          },
          "Items": [],
        }
      },
      "jsonrpc": "2.0"
    }

    if (transactionsListCash.amountIn) {
      if (Number(transactionsListCash.amountIn) >= Number(dataCopy.totalPrice)) {
        ofdData.params.Receipt.ReceivedCash = parseInt(Number(dataCopy.totalPrice) * 100)
      } else {
        ofdData.params.Receipt.ReceivedCash = parseInt(Number(transactionsListCash.amountIn) * 100)
      }
    }

    if (transactionsListTerminal.amountIn) {
      ofdData.params.Receipt.ReceivedCard = parseInt(Number(transactionsListTerminal.amountIn) * 100)
    }

    for (let i = 0; i < dataCopy.itemsList.length; i++) {
      var vat = 0;

      vat = Number((dataCopy.itemsList[i]['salePrice'] * dataCopy.itemsList[i]['quantity']) - dataCopy.itemsList[i]['discountAmount']) /
        (100 + Number(dataCopy.itemsList[i]['vat'])) *
        Number(dataCopy.itemsList[i]['vat'])

      var organizationTin = ""
      var organizationPinfl = ""
      if (dataCopy.itemsList[i]['organizationTin'].length === 9) {
        organizationTin = dataCopy.itemsList[i]['organizationTin']
      }
      if (dataCopy.itemsList[i]['organizationTin'].length === 14) {
        organizationPinfl = dataCopy.itemsList[i]['organizationTin']
      }
      ofdData.params.Receipt.Items.push(
        {
          "SPIC": dataCopy.itemsList[i]['gtin'], // Уникальный номер в едином каталоге
          "VATPercent": parseInt(Number(dataCopy.itemsList[i]['vat'])),
          "VAT": parseInt(Number(vat) * 100),
          "Discount": parseInt(dataCopy.itemsList[i]['discountAmount']) * 100,
          "Price": parseInt(dataCopy.itemsList[i]['quantity'] * Number(dataCopy.itemsList[i]['salePrice']) * 100),
          "Barcode": dataCopy.itemsList[i]['barcode'],
          "Amount": parseInt(Number(dataCopy.itemsList[i]['quantity']) * 1000),
          "Label": dataCopy.itemsList[i]['markingNumber'] ?? "", // маркированные товары сигареты
          "Units": dataCopy.itemsList[i]['ofdUomId'],
          "packageCode": dataCopy.itemsList[i]['packageCode'],
          "Name": dataCopy.itemsList[i]['productName'],
          "Other": 0,
          "CommissionInfo": { "PINFL": organizationPinfl, "TIN": organizationTin },
        },
      )
    }

    var response = await O_POST(ofdData)
    return response
  }

  function closeLoyaltyModal() {
    setShowLoyaltyModal(false)
    setInitialLoyaltyState()
  }

  function setInitialLoyaltyState() {
    setLoyaltyUserInfo({ loyaltyClientId: 0, loyaltyClientLogin: 0, award: 0, balance: 0, code: 0, firstName: "", imageUrl: null, lastName: "", reason: "", status: "", amount: "" })
    setLoyaltyTransactionsListTerminal({ ...loyaltyTransactionsListTerminal, "amountIn": "" })
    setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, "amountIn": "" })
    setLoyaltySearchUserInput("")
    setShowLoyaltyModal(false)
  }

  function setInitialDataState(type) {
    if (type === 'debt') {
      setClient({ "comment": "", "name": "", "phone1": "998", "phone2": "998" })
      setDebtorOut({
        "clientId": 0, "clientComment": "", "clientAmount": 0, "clientName": '',
        "organizationId": 0, "organizationComment": "", "organizationAmount": 0, 'organizationName': ''
      })
    }

    setData({
      ...data, 'note': "", 'clientId': 0, 'clientAmount': 0, 'clientComment': "", "clientName": '', 'discountAmount': 0,
      'chequeNumber': "", 'change': 0, 'paid': 0, 'totalPrice': 0, 'totalPriceBeforeDiscount': 0,
      'transactionsList': [], 'itemsList': [], 'organizationId': 0, 'organizationName': '', 'chequeOfdType': 0,
      "clientReturnDate": "", "organizationReturnDate": "",
      "agentId": "", "agentLogin": "", "agentName": "",
      'loyaltyDiscount': false, 'version': account?.version
    })
    setTransactionsListCash({ "amountIn": "", "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 1 })
    setTransactionsListTerminal({ "amountIn": "", "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 })

    if (
      (reduxSettings?.selectClientOnSale && data.clientId) ||
      (reduxSettings?.selectOrganizationOnSale && data.organizationId)
    ) {
      setShowOnlyCashPaymentModal(false)
      closeOnlyTerminalPaymentModal()
    }

    getProductsFromDB()
    searchRef.current.select()
    dispatch(SET_TAB_CHEQUE({}))
  }

  function syncCheque(data) {
    POST("/services/desktop/api/cheque", data, false, false).then(response => {
      window.electron.dbApi.updateChequeStatus(data['chequeNumber'], response['id']);
    }).catch(e => {
      dispatch(INCREMENT())
    })
  }

  function syncCheques() {
    window.electron.dbApi.getUnsyncCheques().then(response => {
      if (response.length > 0) {
        for (let i = 0; i < response.length; i++) {
          response[i]['itemsList'] = JSON.parse(response[i]['itemsList'])
          response[i]['transactionsList'] = JSON.parse(response[i]['transactionsList'])
          response[i]['cashierLogin'] = response[i]['login']
        }

        POST("/services/desktop/api/cheque-create-list", response, false, false).then(response2 => {
          for (let i = 0; i < response2.length; i++) {
            window.electron.dbApi.updateChequeStatus(response[i]['transactionId'], response2[i]['chequeId']);
          }
        })

        window.electron.dbApi.getUnsyncCheques().then(response => {
          dispatch(SET_UNSYNC_PRODUCTS(response.length))
        })
      }
    })
  }
  function addLoyaltyCardNumber() {
    if (loyaltyUserInfo.addCardNumber.length >= 6 && loyaltyUserInfo.addCardNumber.length <= 14) {
      var sendData = {
        'userLogin': loyaltyUserInfo.userLogin,
        'cardNumber': loyaltyUserInfo.addCardNumber,
        'posId': cashbox.posId,
      }
      POST("/services/desktop/api/uget-user-card", sendData).then(() => {
        setLoyaltyUserInfo({ ...loyaltyUserInfo, 'cardNumber': loyaltyUserInfo.addCardNumber })
      })
    } else {
      toast.error(t("card_length_error"))
    }
  }

  function onKeyDown(event, button = false) {
    if (event.keyCode === 38 && event.target.id === 'cash') {
      exactAmount(event.target.id)
      return
    }
    if (event.keyCode === 38 && event.target.id === 'terminal') {
      exactAmount(event.target.id)
      return
    }

    if (tabId === activeTabId && data.itemsList.length > 0) {
      if (event.keyCode === 112) { // F1 Show Only cash modal
        setTransactionsListCash({ ...transactionsListCash, "amountIn": Number(data.totalPrice) })
        if (reduxSettings?.showCashPaymentF1) {
          setShowOnlyCashPaymentModal(true)
          setTimeout(() => {
            amountInRef.current.select()
          }, 100);
        } else {
          if (!globalDisable.current) {
            if (button) event = null // if clicked payment button not F1
            createCheque(event, 'F1')
          }
        }
        return;
      }
      if (event.keyCode === 113) { // F2 Show Only terminal modal
        setTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": Number(data.totalPrice) })
        if (reduxSettings?.showTerminalPaymentF2) {
          setShowOnlyTerminalPaymentModal(true)
          setTimeout(() => {
            document.getElementById("confirmButton").focus();
          }, 100);
        } else {
          if (!globalDisable.current) {
            if (button) event = null // if clicked payment button not F2
            createCheque(event, 'F2')
          }
        }
        return;
      }
      if (event.keyCode === 114) { // F3 Show cash and terminal modal
        handlePaymentModal(true)
        return;
      }
      if (event.keyCode === 115) { // F4 Show Loyalty modal
        if (window.navigator.onLine) {
          setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, "amountIn": Number(data.totalPrice) })
          setShowLoyaltyModal(true)
          // setTimeout(() => {
          // 	loyaltyInputRef?.current?.select()
          // }, 100);
        } else {
          toast.error(t('no_connection'))
        }
        return;
      }
      if (event.keyCode === 119) { // F8 Cancel discount
        cancelDiscount()
        return
      }
      if (event.keyCode === 120) { // F9 Delete all products
        if (reduxSettings?.showConfirmModalDeleteAllItems) {
          setShowConfirmModalDeleteAllItems(true)
          setTimeout(() => {
            document.getElementById("confirmButton").focus();
          }, 100);
        } else {
          deleteAllItems()
        }
      }
    }
  }

  function printChequeCopy() {
    var domInString = printChequeRef.current.outerHTML
    window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
  }

  // ПРОДАЖА В ДОЛГ
  function toggleClientsModal(type = 'payment') {
    if (window.navigator.onLine && internetConnection !== 2) {
      GET(`/services/desktop/api/clients-pos-helper/${cashbox.posId}`).then(response => {
        for (let i = 0; i < response.length; i++) {
          response.selected = false
        }
        setContactSearchInput("")
        setOldClients(response)
        setClients(response)
        if (type === 'payment') {
          setData({ ...data, 'selectOnSale': false })
          setShowSelectClientModal(true)
        }
        if (type === 'onSale') {
          setShowSelectClientModal(true)
        }
      })
    } else {
      window.electron.dbApi.getClients().then(response => {
        for (let i = 0; i < response.length; i++) {
          response.selected = false
        }
        setContactSearchInput("")
        setOldClients(response)
        setClients(response)
        setShowSelectClientModal(true)
        setTimeout(() => {
          contactSearchRef.current.select()
        }, 100);
      })
    }
  }

  async function toggleOrganizationsModal(type = 'payment') {
    var organizations
    if (window.navigator.onLine && internetConnection !== 2) {
      var response = await GET("/services/desktop/api/organization-helper")
      window.electron.dbApi.deleteOrganizations()
      window.electron.dbApi.insertOrganizations(response).catch(e => { toast.error(e) })
      organizations = response

      for (let i = 0; i < organizations.length; i++) {
        organizations[i]['selected'] = false
        organizations[i]['organizationId'] = organizations[i]['id']
      }
      setOrganizations(organizations)
      setOldOrganizations(organizations)

      setContactSearchInput("")
      if (type === 'payment') {
        setData({ ...data, 'selectOnSale': false })
        setShowSelectOrganizationModal(true)
      }
      if (type === 'onSale') {
        setShowSelectOrganizationModal(true)
      }
    } else {
      organizations = await window.electron.dbApi.getOrganizations()
      for (let i = 0; i < organizations.length; i++) {
        organizations[i]['selected'] = false
      }
      setContactSearchInput("")
      setOrganizations(organizations)
      setOldOrganizations(organizations)
      setShowSelectOrganizationModal(true)
      setTimeout(() => {
        contactSearchRef.current.select()
      }, 100);
    }
  }

  async function toggleAgentsModal(type = 'payment') {
    var agents
    if (window.navigator.onLine && internetConnection !== 2) {
      var response = await GET("/services/desktop/api/agent-helper")
      agents = response

      for (let i = 0; i < organizations.length; i++) {
        agents[i]['selected'] = false
      }
      setAgents(agents)
      setOldAgents(agents)

      setContactSearchInput("")
      if (type === 'payment') {
        setData({ ...data, 'selectOnSale': false })
        setShowSelectAgentModal(true)
      }
      if (type === 'onSale') {
        setShowSelectAgentModal(true)
      }
    } else {
      agents = await window.electron.dbApi.getAgents()
      for (let i = 0; i < agents.length; i++) {
        agents[i]['selected'] = false
      }
      setContactSearchInput("")
      setAgents(agents)
      setOldAgents(agents)
      setShowSelectAgentModal(true)
      setTimeout(() => {
        contactSearchRef.current.select()
      }, 100);
    }
  }

  function createClient() {
    var clientCopy = { ...client }

    if (clientCopy?.phone1?.length !== 12) {
      toast.error(t('phone_length'))
      return
    }
    if (clientCopy?.phone2?.length === 3) {
      clientCopy.phone2 = ''
    }
    if (clientCopy?.phone2 && clientCopy?.phone2?.length !== 12) {
      toast.error(t('phone_length'))
      return
    }

    POST("/services/desktop/api/clients", clientCopy).then(() => {
      setClient({ "comment": "", "name": "", "phone1": "998", "phone2": "998" })
      setShowAddClientModal(false)
      toggleClientsModal('payment')
    })
  }

  function searchClient(search) {
    if (search.length === 0) {
      setClients(oldClients)
    } else {
      setContactSearchInput(search)
      var clientsCopy = [...oldClients]
      var arr = []
      for (let i = 0; i < clientsCopy.length; i++) {
        if (clientsCopy[i]['name']?.toLowerCase().includes(search?.toLowerCase())) {
          arr.push(clientsCopy[i])
        }
      }
      setClients(arr)
    }
  }

  function searchOrganization(search) {
    if (search.length === 0) {
      setOrganizations(oldOrganizations)
    } else {
      setContactSearchInput(search)
      var organizationsCopy = [...oldOrganizations]
      var arr = []
      for (let i = 0; i < organizationsCopy.length; i++) {
        if (organizationsCopy[i]['name']?.toLowerCase().includes(search?.toLowerCase())) {
          arr.push(organizationsCopy[i])
        }
      }
      setOrganizations(arr)
    }
  }

  function searchAgents(search) {
    if (search.length === 0) {
      setAgents(oldAgents)
    } else {
      setContactSearchInput(search)
      var agentsCopy = [...oldAgents]
      var arr = []
      for (let i = 0; i < agentsCopy.length; i++) {
        if (agentsCopy[i]['name']?.toLowerCase().includes(search?.toLowerCase())) {
          arr.push(agentsCopy[i])
        }
      }
      setAgents(arr)
    }
  }

  function selectClient(index) {
    var clientsCopy = [...clients]
    for (let i = 0; i < clientsCopy.length; i++) {
      if (clients[index]['id'] === clientsCopy[i]['id']) {
        clientsCopy[i]['selected'] = true
      } else {
        clientsCopy[i]['selected'] = false
      }
    }
    setClients(clientsCopy)
  }

  function selectOrganization(index) {
    var organizationsCopy = [...organizations]
    for (let i = 0; i < organizationsCopy.length; i++) {
      if (organizations[index]['organizationId'] === organizationsCopy[i]['organizationId']) {
        organizationsCopy[i]['selected'] = true
      } else {
        organizationsCopy[i]['selected'] = false
      }
    }
    setOrganizations(organizationsCopy)
  }

  function selectAgent(index) {
    var agentsCopy = [...agents]
    for (let i = 0; i < agentsCopy.length; i++) {
      if (agents[index]['agentLogin'] === agentsCopy[i]['agentLogin']) {
        agentsCopy[i]['selected'] = true
      } else {
        agentsCopy[i]['selected'] = false
      }
    }
    setAgents(agentsCopy)
  }

  function selectClientDone() {
    var clientsCopy = [...clients]
    for (let i = 0; i < clientsCopy.length; i++) {
      if (clientsCopy[i]['selected']) {
        if (data.selectOnSale) {
          setData({
            ...data,
            'clientId': clientsCopy[i]['clientId'],
            'clientName': clientsCopy[i]['name'],
            'clientAddress': clientsCopy[i]['address'],
            'clientPhone1': clientsCopy[i]['phone1'],
            'clientPhone2': clientsCopy[i]['phone2'],
          })
        }
        if (!data.selectOnSale) {
          setDebtorOut({
            ...debtorOut, 'clientId':
              clientsCopy[i]['clientId'],
            'clientName': clientsCopy[i]['name'],
            'clientBalance': clientsCopy[i]['balance'],
            'clientCurrencyId': cashbox.defaultCurrency
          })
        }
      }
    }
    //return
    setShowSelectClientModal(false)
  }

  function selectOrganizationDone() {
    var organizationsCopy = [...organizations]
    for (let i = 0; i < organizationsCopy.length; i++) {
      if (organizationsCopy[i]['selected']) {
        if (data.selectOnSale) {
          setData({
            ...data,
            'organizationId': organizationsCopy[i]['organizationId'],
            'organizationName': organizationsCopy[i]['name'],
            'organizationAmount': 0,
          })
        }
        if (!data.selectOnSale) {
          setDebtorOut({
            ...debtorOut,
            'organizationId': organizationsCopy[i]['organizationId'],
            'organizationName': organizationsCopy[i]['name'],
            'organizationCurrencyId': cashbox.defaultCurrency
          })
        }
      }
    }
    setShowSelectOrganizationModal(false)
  }

  function selectAgentDone() {
    var agentsCopy = [...agents]
    for (let i = 0; i < agentsCopy.length; i++) {
      if (agentsCopy[i]['selected']) {
        if (data.selectOnSale) {
          setData({
            ...data,
            'agentLogin': agentsCopy[i]['agentLogin'],
            'agentName': agentsCopy[i]['name'],
          })
        }
      }
    }
    setShowSelectAgentModal(false)
  }

  // ПРОДАЖА В ДОЛГ

  // БЫСТРЫЙ ПОДБОР ТОВАРОВ

  function getProductsFromDB() {
    window.electron.dbApi.getProducts().then(response => {
      setProducts(response)
    })
  }

  function searchByName(search) {
    setSearchByNameValue(search)
    if (search.length > 0) {
      window.electron.dbApi.findProductsByName({
        'search': search,
        'searchExact': reduxSettings?.searchExact,
      }).then(response => {
        setProducts(response.row)
      })
    } else {
      getProductsFromDB()
    }
  }
  // БЫСТРЫЙ ПОДБОР ТОВАРОВ

  function deleteAllItemsConfirModal() {
    if (reduxSettings?.showConfirmModalDeleteAllItems) {
      setShowConfirmModalDeleteAllItems(true)
      setTimeout(() => {
        document.getElementById("confirmButton").focus();
      }, 100);
    } else {
      deleteAllItems()
    }
  }

  function deleteItemConfirModal(index) {
    if (reduxSettings?.showConfirmModalDeleteItem) {
      setShowConfirmModalDeleteItem({ 'bool': true, 'index': index })
      setTimeout(() => {
        document.getElementById("confirmButton").focus();
      }, 100);
    } else {
      deleteItem(index)
    }
  }

  function deleteItem(index) {
    if (reduxSettings?.showConfirmModalDeleteItem) {
      setShowConfirmModalDeleteItem({ 'bool': false, 'index': 0 })
    }
    var dataCopy = { ...data }
    saveDeletedItems(dataCopy.itemsList[index], 'object')

    var promotionProductBarcode
    if (dataCopy.itemsList[index]['promotionProduct']) {
      promotionProductBarcode = dataCopy.itemsList[index]['promotionProductBarcode']
    }
    dataCopy.itemsList.splice(index, 1);
    dataCopy.totalPrice = 0

    if (promotionProductBarcode) {
      var indexPromotion = dataCopy.itemsList.findIndex(x => (x.barcode === promotionProductBarcode && x.promotion))
      dataCopy.itemsList.splice(indexPromotion, 1);
    }

    if (dataCopy.itemsList.length === 0) {
      setInitialDataState()
      return;
    }

    if (!dataCopy.discountAmount) {
      calculateTotalPrice(dataCopy)
    } else {
      dataCopy.discountAmount = 0
      dataCopy.totalPriceBeforeDiscount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.itemsList[i]['discountAmount'] = 0
      }
      calculateTotalPrice(dataCopy)
    }

    setTimeout(() => {
      searchRef.current.select()
    }, 100)
  }

  function deleteAllItems() {
    var dataCopy = { ...data }

    setInitialDataState(null)
    handlePaymentModal(false)
    setShowConfirmModalDeleteAllItems(false)
    searchRef.current.select()

    saveDeletedItems(dataCopy.itemsList, "array")
  }

  function saveDeletedItems(products, type) {
    var sendData = []
    if (type === "object") {
      sendData.push(products)
    } else {
      sendData = products
    }
    for (let i = 0; i < sendData.length; i++) {
      sendData[i]['login'] = account.login
      sendData[i]['cashboxId'] = cashbox.cashboxId
      sendData[i]['posId'] = cashbox.posId
      sendData[i]['shiftId'] = cashbox.id ? cashbox.id : shift.id
      sendData[i]['chequeDate'] = getUnixTime()
      sendData[i]['saleCurrencyId'] = cashbox.defaultCurrency
      sendData[i]['status'] = 0
    }
    window.electron.dbApi.insertDeletedProducts(sendData)
  }

  function cancelDiscount() {
    var dataCopy = { ...data }

    if (Number(dataCopy.discountAmount) > 0) {
      dataCopy.discountAmount = 0
      dataCopy.totalPriceBeforeDiscount = 0
      for (let i = 0; i < dataCopy.itemsList.length; i++) {
        dataCopy.itemsList[i]['discountAmount'] = 0
        dataCopy.itemsList[i]['salePrice'] = dataCopy.itemsList[i]['originalSalePrice']
      }
      calculateTotalPrice(dataCopy)
    }
  }

  function switchWholeSale(bool, type) {
    if (!bool)
      type = 0
    dispatch(SET_WHOLESALEPRICE_BOOLEAN(type))
    setActivePrice({ ...activePrice, 'active': type })
  }

  function handleTableKeyDown(event, item, index) {
    event.stopPropagation();
    const currentRow = tbodyRef.current?.children.namedItem(item.id);
    switch (event.key) {
      case "ArrowUp":
        currentRow?.previousElementSibling?.focus();
        scrollRef.current.scrollTop = (index * 25.8) + 30
        break;
      case "ArrowDown":
        currentRow?.nextElementSibling?.focus();
        scrollRef.current.scrollTop = (index * 25.8) - 30
        break;
      case "ArrowRight":
        searchProduct({ barcode: item.barcode })
        break;
      default: break;
    }
  }

  function calculateNumberOfProducts() {
    var totalQuantity = 0
    for (let i = 0; i < data.itemsList.length; i++) {
      totalQuantity += Number(data.itemsList[i]['quantity'])
    }
    setNumberOfProducts(totalQuantity)
  }

  function closeOnlyTerminalPaymentModal() {
    setShowOnlyTerminalPaymentModal(false)
    setTransactionsListTerminal({ "amountIn": "", "amountOut": 0, "paymentTypeId": 2, "paymentPurposeId": 1 })
  }

  function exactAmount(type) {

    const totalPrice = Number(data.totalPrice).toFixed(4);

    if (type === 'cash') {
      if (transactionsListCash.amountIn === 0 && transactionsListTerminal.amountIn === data.totalPrice) {
        setTransactionsListCash({
          "amountIn": parseFloat(totalPrice), // Maintain as a float with two decimals if necessary
          "amountOut": 0,
          "paymentTypeId": 1,
          "paymentPurposeId": 1
        });

        setTransactionsListTerminal({
          "amountIn": 0,
          "amountOut": 0,
          "paymentTypeId": 2,
          "paymentPurposeId": 1
        });
      } else {
        const cashAmount = parseFloat((totalPrice - transactionsListTerminal.amountIn).toFixed(4));
        setTransactionsListCash({
          "amountIn": cashAmount,
          "amountOut": 0,
          "paymentTypeId": 1,
          "paymentPurposeId": 1
        });
      }
    }

    if (type === 'terminal') {
      if (transactionsListTerminal.amountIn === 0 && transactionsListCash.amountIn === data.totalPrice) {
        setTransactionsListTerminal({
          "amountIn": parseFloat(totalPrice),
          "amountOut": 0,
          "paymentTypeId": 2,
          "paymentPurposeId": 1
        });

        setTransactionsListCash({
          "amountIn": 0,
          "amountOut": 0,
          "paymentTypeId": 1,
          "paymentPurposeId": 1
        });
      } else {
        const terminalAmount = parseFloat((totalPrice - transactionsListCash.amountIn).toFixed(4));
        setTransactionsListTerminal({
          "amountIn": terminalAmount,
          "amountOut": 0,
          "paymentTypeId": 2,
          "paymentPurposeId": 1
        });
      }
    }
  }

  function selectPaymentType(type) {
    if (type === 3) {
      setTransactionsListCash({ ...transactionsListCash, 'amountIn': 0 })
      setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': data.totalPrice, 'paymentTypeId': 3 })
      amountInTerminalRef?.current?.select()
    }
    if (type === 5) {
      setTransactionsListCash({ ...transactionsListCash, 'amountIn': 0 })
      setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': data.totalPrice, 'paymentTypeId': 5 })
      setTimeout(() => {
        qrRef.current.select()
      }, 500);
    }
    if (type === 6) {
      setTransactionsListCash({ ...transactionsListCash, 'amountIn': 0 })
      setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': data.totalPrice, 'paymentTypeId': 6 })
      setTimeout(() => {
        qrRef.current.select()
      }, 500);
    }
    if (type === 7) {
      setTransactionsListCash({ ...transactionsListCash, 'amountIn': 0 })
      setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': data.totalPrice, 'paymentTypeId': 7 })
      setTimeout(() => {
        qrRef.current.select()
      }, 500);
    }
    if (type === 'client') {
      setData({ ...data, 'selectOnSale': true, 'clientId': 0, 'clientName': '' })
      toggleClientsModal('onSale')
    }
    if (type === 'organization') {
      setData({ ...data, 'selectOnSale': true, 'organizationId': 0, 'organizationName': '' })
      toggleOrganizationsModal('onSale')
    }
    if (type === 'agent') {
      setData({ ...data, 'selectOnSale': true, 'agentLogin': '', 'organizationName': '' })
      toggleAgentsModal('onSale')
    }
    if (type === 'avans') {
      setData({ ...data, 'chequeOfdType': 1 })
    }
    if (type === 'credit') {
      setData({ ...data, 'chequeOfdType': 2 })
    }
  }

  async function addChequeToSaved(type) {
    var dataCopy = { ...data }
    if (!dataCopy.itemsList.length) {
      toast.error('Отсутствуют товары')
      return
    }
    dataCopy.selected = false
    dataCopy.createdDate = todayYYYYMMDD()

    if (type === 'offline') {
      var storageChequeListCopy = JSON.parse(localStorage.getItem('chequeList'))
      if (!storageChequeListCopy) {
        storageChequeListCopy = []
      }
      storageChequeListCopy.push(dataCopy)
      localStorage.setItem('chequeList', JSON.stringify(storageChequeListCopy))
      setInitialDataState(null)
    }
    if (type === 'online') {
      var sendData = {
        'clientId': dataCopy?.clientId,
        'clientName': dataCopy?.clientName,
        'organizationId': dataCopy?.organizationId,
        'organizationName': dataCopy?.organizationName,
        'cheque': JSON.stringify(dataCopy)
      }
      await POST(`/services/desktop/api/cheque-online-cashbox`, sendData, true)
      setInitialDataState(null)
    }
  }

  async function getChequeFromSaved(type) {
    if (type === 'offline') {
      if (!JSON.parse(localStorage.getItem('chequeList'))) {
        return
      }
      var storageChequeListCopy = [...JSON.parse(localStorage.getItem('chequeList'))]
      for (let i = 0; i < storageChequeListCopy.length; i++) {
        storageChequeListCopy[i]['createdDate'] = dateFormat(storageChequeListCopy[i]['createdDate'], 'dd/MM HH:mm')
      }
      setStorageChequeList(storageChequeListCopy)
    }

    var newArray = []
    if (type === 'online') {
      var response = await GET(`/services/desktop/api/cheque-online-list-cashbox/${cashbox.posId}`)
      for (let i = 0; i < response.length; i++) {
        response[i]['createdDate'] = dateFormat(response[i]['createdDate'], 'dd/MM HH:mm')
        response[i]['cheque'] = JSON.parse(response[i]['cheque'])
        response[i]['cheque']['chequeOnlineId'] = response[i]['id']
        response[i]['cheque']['id'] = response[i]['id']
        response[i]['cheque']['selected'] = false
        newArray.push(response[i]['cheque'])
      }

      setOnlineChequeList(newArray)
    }
    setShowSavedChequesModal(true)
  }

  function selectChequeFromSaved(index, type) {
    var storageChequeListCopy = [...storageChequeList]
    if (type === 'online') {
      storageChequeListCopy = [...onlineChequeList]
    }

    if (reduxSettings?.postponeOffline) {
      for (let i = 0; i < storageChequeListCopy.length; i++) {
        if (index === i) {
          storageChequeListCopy[i]['selected'] = true
          setSelectedChequeFromState(storageChequeListCopy[i])
        } else {
          storageChequeListCopy[i]['selected'] = false
        }
      }
    }
    if (reduxSettings?.postponeOnline) {
      for (let i = 0; i < storageChequeListCopy.length; i++) {
        if (index === i) {
          storageChequeListCopy[i]['selected'] = true
          setSelectedChequeFromState(storageChequeListCopy[i])
        } else {
          storageChequeListCopy[i]['selected'] = false
        }
      }
    }
  }

  function selectSavedChequeDone() {
    var storageChequeListCopy = [...storageChequeList]
    if (reduxSettings?.postponeOffline) {
      if (!storageChequeListCopy || !storageChequeListCopy.length) {
        toast.error('Выберите чек')
        return
      }
    } else {
      storageChequeListCopy = [...onlineChequeList]
    }

    var foundCheque = storageChequeListCopy.find(item => item.selected === true)
    storageChequeListCopy = storageChequeListCopy.filter(item => item.selected !== true)

    if (Number(foundCheque.currencyId) !== Number(cashbox.defaultCurrency)) {
      toast.error('Разные валюты')
      return
    }

    if (reduxSettings?.postponeOffline) {
      setData(foundCheque)
      setShowSavedChequesModal(false)
      setSelectedChequeFromState([])
      localStorage.setItem('chequeList', JSON.stringify(storageChequeListCopy))
    }
    if (reduxSettings?.postponeOnline) {
      foundCheque['chequeTimeStart'] = getUnixTime()
      foundCheque['chequeTimeEnd'] = ""
      foundCheque['appletVersion'] = ""
      foundCheque['dateTime'] = ""
      foundCheque['fiscalSign'] = ""
      foundCheque['receiptSeq'] = ""
      foundCheque['qRCodeURL'] = ""
      foundCheque['terminalID'] = ""
      foundCheque['terminalID'] = ""
      foundCheque['cashboxId'] = cashbox.cashboxId
      foundCheque['posId'] = cashbox.posId
      foundCheque['shiftId'] = cashbox.id ? cashbox.id : shift.id
      foundCheque['cashierName'] = account.firstName
      foundCheque['login'] = account.login
      foundCheque['currencyId'] = cashbox.defaultCurrency
      foundCheque['saleCurrencyId'] = cashbox.defaultCurrency
      foundCheque['selectOnSale'] = false

      setData(foundCheque)
      setShowSavedChequesModal(false)
      setSelectedChequeFromState([])
    }
  }

  async function getChequeFromCloud() {
    var response = await GET(`/services/desktop/api/cheque-online-list/${cashbox.posId}`)

    for (let i = 0; i < response.length; i++) {
      response[i]['createdDate'] = dateFormat(response[i]['createdDate'], 'dd/MM HH:mm')
      response[i]['cheque'] = JSON.parse(response[i]['cheque'])
      response[i]['totalPrice'] = 0
      for (let j = 0; j < response[i]['cheque'].itemsList.length; j++) {
        response[i]['totalPrice'] += response[i]['cheque']['itemsList'][j]['totalPrice'];
      }
    }

    setShowAgentChequesModal(true)
    setOnlineChequeList(response)
  }

  function selectChequeFromCloud(index) {
    var onlineChequeListCopy = [...onlineChequeList]
    for (let i = 0; i < onlineChequeListCopy.length; i++) {
      if (index === i) {
        onlineChequeListCopy[i]['selected'] = true
        setSelectedChequeFromState(onlineChequeListCopy[i]['cheque'])
      } else {
        onlineChequeListCopy[i]['selected'] = false
      }
    }
  }

  function selectCloudChequeDone() {
    var onlineChequeListCopy = [...onlineChequeList]
    var foundCheque = onlineChequeListCopy.find(item => item.selected === true)
    if (!foundCheque) {
      toast.error('Выберите чек')
      return
    }
    var dataCopy = foundCheque['cheque']

    if (Number(dataCopy.currencyId) !== Number(cashbox.defaultCurrency)) {
      toast.error('Разные валюты')
      return
    }
    dataCopy['chequeTimeStart'] = getUnixTime()
    dataCopy['chequeTimeEnd'] = ""
    dataCopy['appletVersion'] = ""
    dataCopy['dateTime'] = ""
    dataCopy['fiscalSign'] = ""
    dataCopy['receiptSeq'] = ""
    dataCopy['qRCodeURL'] = ""
    dataCopy['terminalID'] = ""
    dataCopy['terminalID'] = ""
    dataCopy['cashboxId'] = cashbox.cashboxId
    dataCopy['posId'] = cashbox.posId
    dataCopy['shiftId'] = cashbox.id ? cashbox.id : shift.id
    dataCopy['cashierName'] = account.firstName
    dataCopy['login'] = account.login
    dataCopy['currencyId'] = cashbox.defaultCurrency
    dataCopy['saleCurrencyId'] = cashbox.defaultCurrency
    dataCopy['selectOnSale'] = false
    dataCopy['agentLogin'] = foundCheque['agentLogin']
    dataCopy['agentName'] = foundCheque['agentName']
    dataCopy['clientId'] = foundCheque['clientId']
    dataCopy['clientName'] = foundCheque['clientName']
    dataCopy['organizationId'] = foundCheque['organizationId']
    dataCopy['organizationName'] = foundCheque['organizationName']
    dataCopy['chequeOnlineId'] = foundCheque['id']
    if (dataCopy['discount'] > 0) {
      dataCopy['discountAmount'] = Number(dataCopy['totalPriceBeforeDiscount']) - Number(dataCopy['totalPrice'])
    }
    // console.log(dataCopy);

    setData(dataCopy)
    setShowAgentChequesModal(false)
    setSelectedChequeFromState([])
  }

  function deleteSavedChequeDone() {
    var storageChequeListCopy = [...storageChequeList]

    for (let i = 0; i < storageChequeListCopy.length; i++) {
      if (storageChequeListCopy[i]['selected']) {
        storageChequeListCopy.splice(i, 1)
      }
    }
    setStorageChequeList(storageChequeListCopy)
    setSelectedChequeFromState([])

    localStorage.setItem('chequeList', JSON.stringify(storageChequeListCopy))
  }

  async function deleteCloudChequeDone() {
    var onlineChequeListCopy = [...onlineChequeList]
    if (!onlineChequeList.length) {
      onlineChequeListCopy = [...storageChequeList]
    }
    var id = null
    for (let i = 0; i < onlineChequeListCopy.length; i++) {
      if (onlineChequeListCopy[i]['selected']) {
        id = onlineChequeListCopy[i]['id']
        onlineChequeListCopy.splice(i, 1)
      }
    }
    setOnlineChequeList(onlineChequeListCopy)
    setSelectedChequeFromState([])

    await DELETE(`/services/desktop/api/cheque-online-cashbox/${id}`)
  }

  function chequeCopyExcel() {
    var dataCopy = { ...data }
    var temporaryData = [
      { "A": t('pos'), "B": cashbox.posName },
      { "A": t('cashier'), "B": dataCopy.cashierName },
      { "A": t('date'), "B": todayDDMMYYYY() },
    ];

    temporaryData.push({ "A": t('product'), "B": t('quantity'), "C": t('price'), "D": t('total') })
    for (let i = 0; i < dataCopy.itemsList.length; i++) {
      temporaryData.push({
        "A": `${i + 1}. ${dataCopy.itemsList[i]['productName']}`,
        "B": dataCopy.itemsList[i]['quantity'],
        "C": dataCopy.itemsList[i]['salePrice'],
        "D": formatMoney(dataCopy.itemsList[i]['totalPrice'])
      })
    }

    temporaryData.push({ "A": t('total'), "B": '', "C": '', "D": dataCopy.totalPrice })

    const ws = XLSX.utils.json_to_sheet(temporaryData, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
    XLSX.writeFile(wb, todayDDMMYYYY() + ".xlsx");
  }

  function returnPrinterWidth() {
    var name = ""
    switch (reduxSettings?.checkPrintWidth) {
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

  async function changeCurrency() {
    var currency = cashbox.defaultCurrency === 2 ? 1 : 2
    await PUT(`/services/desktop/api/cashbox`, {
      'cashboxId': cashbox.posId,
      'defaultCurrency': currency,
    }, true)
    const response = await GET(`/services/desktop/api/get-balance-product-list/${cashbox.posId}/${currency}`)
    window.electron.dbApi.deleteProducts()
    window.electron.dbApi.insertProducts(response).catch(e => { toast.error(e) })

    dispatch(SET_CASHBOX({ ...cashbox, 'defaultCurrency': currency }))

    setData({
      ...data, 'note': "", 'clientId': 0, 'clientAmount': 0, 'clientComment': "", "clientName": '', 'discountAmount': 0,
      'chequeNumber': "", 'change': 0, 'paid': 0, 'totalPrice': 0, 'totalPriceBeforeDiscount': 0,
      'transactionsList': [], 'itemsList': [], 'organizationId': 0, 'organizationName': '', 'chequeOfdType': 0,
      'loyaltyDiscount': false, 'version': account?.version, 'currencyId': currency, 'defaultCurrency': currency
    })
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  function highlight(text) {
    return text.replace(
      new RegExp(searchByNameValue, "gi"),
      '<span class="highlighted">$&</span>'
    );
  }

  useEffect(async () => {
    let getData = await JSON.parse(localStorage.getItem("tabCheque"))
    if (getData) {
      let getDataFilter = await getData.find(item => item.tabId == activeTabId)
      if (getDataFilter) {
        setData({ ...getDataFilter, tabId: activeTabId })
        await localStorage.setItem("tabCheque", JSON.stringify(getData))
      }
    }
  }, [activeTabId])

  useEffect(() => {

    if (data.tabId == activeTabId) {
      let getData = JSON.parse(localStorage.getItem("tabCheque"))
      if (getData) {
        let getDataFilter = getData.find(item => item.tabId == activeTabId)
        let getDataIndex = getData.findIndex(item => item.tabId == activeTabId)
        if (!getDataFilter) {
          console.log('if ishladi');
          getData.push(data)
          localStorage.setItem("tabCheque", JSON.stringify(getData))
        } else {
          getData[getDataIndex] = { ...data }
          localStorage.setItem("tabCheque", JSON.stringify(getData))
        }
      } else {
        localStorage.setItem("tabCheque", JSON.stringify([data]))
      }

      dispatch(SET_TAB_CHEQUE({ ...data }))
    }
    // window.addEventListener('keydown', onKeyDown)
    // if (reduxSettings.showNumberOfProducts) {
    // 	calculateNumberOfProducts()
    // }
    // return () => {
    // 	window.removeEventListener('keydown', onKeyDown)
    // }
  }, [activeTabId, data.totalPrice, transactionsListCash, transactionsListTerminal]) // eslint-disable-line react-hooks/exhaustive-deps
  // data.totalPrice что б onKeyDown перезаписывался и брал последний обновленный стейт
  // ибо сет таймоут и листенеры берут то состояние в момент когда они были обявлены


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

  useEffect(() => {
    calculateChange();
  }, [transactionsListCash, transactionsListTerminal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    calculateProductWithParamsUnit()
  }, [productWithParamsUnit.packaging, productWithParamsUnit.piece]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, 'amountIn': data.totalPrice - loyaltyUserInfo.amount })
  }, [loyaltyUserInfo.amount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // titlebar дан синхронизация кнопкаси босилса
    getProductsFromDB()
  }, [backendHelpers.updateProductsFromDB]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (backendHelpers?.tabCheque?.itemsList?.length > 0 && backendHelpers?.tabCheque?.tabId === tabId) {
      setData({ ...backendHelpers?.tabCheque })
      console.log('ishladi');
    } else {
      console.log('ishlamadi');
      setData({ ...data, tabId: tabId })
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>


      <div className="d-flex">
        <div className="w-97 relatvive">
          <span className="absolute caret-left-icon cursor" onClick={() => showRightBar(rightBar ? false : true)}>
            <ChevronLeftOutlined className={rightBar ? 'rotate180' : ''} style={{ fontSize: '1rem', color: 'ffffff' }} />
          </span>

          {/* HEADER */}
          <div className="d-flex justify-content-between pt-2">
            <div className="d-flex">
              <div className="ms-2 position-relative">
                <input tabIndex="1" autoFocus className="custom-input"
                  style={{ 'width': '240px' }}
                  placeholder={t('search_by_barcode')}
                  value={searchInput}
                  ref={searchRef}
                  onChange={(e) => { setSearchInput(e.target.value) }}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      searchProduct({ barcode: e.target.value })
                    }
                  }}
                  onKeyUp={(e) => {
                    if (
                      e.key === 'e' || e.key === '-' || e.key === '+' ||
                      e.key === '*' || e.key === '/' || e.key === 'F5' ||
                      e.key === 'F6' || e.key === 'F7'
                    ) {
                      handleShortcut(e)
                    }
                  }}
                />
                <span className="input-info-icon cursor" onClick={() => setPopoverShow(!popoverShow)}>
                  <OverlayTrigger trigger="click" onHide={() => setPopoverShow(false)} rootClose placement="bottom" show={popoverShow} overlay={
                    <Popover>
                      <Popover.Content>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: '+' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2"><span>+</span></div>
                          <div className="vertical-center">{t('shortkey_text1')}</div>
                        </div>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: '-' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2">-</div>
                          <div className="vertical-center">{t('shortkey_text2')}</div>
                        </div>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: '*' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2">*</div>
                          <div className="vertical-center">{t('shortkey_text3')}</div>
                        </div>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: '/' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2">/</div>
                          <div className="vertical-center">{t('shortkey_text4')}</div>
                        </div>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: 'F5' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2">F5</div>
                          <div className="vertical-center">{t('shortkey_text5')} %</div>
                        </div>
                        <div className="d-flex mb-2" onClick={() => { handleShortcut({ key: 'F6' }); setPopoverShow(false) }}>
                          <div className="cashbox-popover-icon me-2">F6</div>
                          <div className="vertical-center">{t('shortkey_text6')}</div>
                        </div>
                        <div className="d-flex mb-2">
                          <div className="cashbox-popover-icon me-2">ENTER</div>
                          <div className="vertical-center">{t('shortkey_text7')}</div>
                        </div>
                      </Popover.Content>
                    </Popover>
                  }>
                    <InfoOutlined style={{ color: '626262' }} />
                  </OverlayTrigger>
                </span>
              </div>
              {!cashbox.wholesalePriceIn &&
                <div className="d-flex ms-2" style={{ 'height': '38px' }}>
                  <div className="d-flex bg-f8 h-100 px-2">
                    <div className="vertical-center me-2">
                      {t('wholesale')}
                    </div>
                    <div className="vertical-center">
                      <input className="ios-switch light" type="checkbox" tabIndex="-1"
                        checked={activePrice.active === 1 ? true : false}
                        onChange={(e) => switchWholeSale(e.target.checked, 1)} />
                    </div>
                  </div>
                </div>
              }
              {cashbox.bankPrice &&
                <div className="d-flex ms-2" style={{ 'height': '38px' }}>
                  <div className="d-flex bg-f8 h-100 px-2">
                    <div className="vertical-center me-2">
                      {t('bank_price')}
                    </div>
                    <div className="vertical-center">
                      <input className="ios-switch light" type="checkbox" tabIndex="-1"
                        checked={activePrice.active === 2 ? true : false}
                        onChange={(e) => switchWholeSale(e.target.checked, 2)} />
                    </div>
                  </div>
                </div>
              }
              <div className="d-flex ms-2" style={{ 'height': '38px' }}
                onClick={changeCurrency}>
                <button className="btn btn-primary" tabIndex="-1">
                  {cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}
                </button>
              </div>
              {reduxSettings?.selectClientOnSale &&
                <div className="d-flex ms-2" style={{ 'height': '38px' }}
                  onClick={() => selectPaymentType('client')}>
                  <button className="btn btn-primary" tabIndex="-1">
                    <PersonOutlined></PersonOutlined>
                  </button>
                </div>
              }
              {reduxSettings?.selectOrganizationOnSale &&
                <div className="d-flex ms-2" style={{ 'height': '38px' }}
                  onClick={() => selectPaymentType('organization')}>
                  <button className="btn btn-primary" tabIndex="-1">
                    <AccountBalanceOutlined></AccountBalanceOutlined>
                  </button>
                </div>
              }
              {(reduxSettings?.showLastScannedProduct && data.itemsList.length > 0) &&
                <div className="vertical-center ms-2">
                  <h3 className="last-product">{data.itemsList[data.itemsList.length - 1]['productName']}</h3>
                </div>
              }

            </div>
            <div className="d-flex gap-2">
              <div>
                {reduxSettings?.showNumberOfProducts &&
                  <div className="vertical-center me-2">
                    <button className="btn btn-outline-secondary fz18" disabled title={t('number_of_products')}>{numberOfProducts}</button>
                  </div>
                }
              </div>

              <div>
                <button className="d-flex btn btn-danger"
                  tabIndex="-1"
                  disabled={!data?.itemsList?.length}
                  onClick={deleteAllItemsConfirModal}
                  title="Быстрая клавиша: F9">
                  <DeleteOutlineOutlined />
                  <div className="text-uppercase">{t('clear')}</div>
                </button>
              </div>
            </div>
          </div>
          {/* HEADER */}

          {/* CONTENT */}
          <div className="d-flex flex-column justify-content-between p-2 h-table">
            {data.itemsList.length > 0 &&
              <div className="table-responsive" ref={scrollToBottomRef}>
                <table className="table fz14">
                  <thead>
                    <tr>
                      <th style={{ 'width': '58%' }}>№ {t('product_name')}</th>
                      <th style={{ 'width': '10%' }} className="text-end">{t('price')}</th>
                      <th style={{ 'width': '12%' }} className="text-end">{t('quantity')}</th>
                      <th style={{ 'width': '15%' }} className="text-end">{t('to_pay')}</th>
                      <th style={{ 'width': '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.itemsList?.map((item, index) => (
                      <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected === true ? 'cashbox-table-active' : '')}
                        ref={item.ref} key={index}>
                        <td onClick={() => selectProduct(item)}>{index + 1}. {item.productName}</td>
                        <td className="text-end text-nowrap" onClick={() => selectProduct(item)}>
                          {item.active_price === 1 &&
                            <span>{formatMoney(item.wholesalePrice)}</span>
                          }
                          {item.active_price === 2 &&
                            <span>{formatMoney(item.bankPrice)}</span>
                          }
                          {item.active_price === 0 &&
                            <span>{formatMoney(item.salePrice)}</span>
                          }
                          {!item.active_price && item.active_price !== 0 &&
                            <span>{formatMoney(item.salePrice)}</span>
                          }
                        </td>
                        <td className="text-end" onClick={() => selectProduct(item)}>
                          {item.uomId === 7 ?
                            <>
                              {item?.quantity?.toString()?.split('.')[0] > 0 ? item?.quantity?.toString()?.split('.')[0] + ` ${item.uomName} ` : ''}
                              {item?.quantity?.toString()?.split('.')[1] > 0 ? item?.quantity?.toString()?.split('.')[1] + ` ${item.secondUomName} ` : ''}
                              {(item?.quantity?.toString()?.split('.')[0] > 0 && item?.quantity?.toString()?.split('.')[1] > 0) &&
                                `= ${Number(item.quantity) * Number(item?.secondQuantity)}  ${item.secondUomName}`
                              }
                            </>
                            :
                            formatMoney(item.quantity)
                          }
                        </td>
                        <td className="text-end text-nowrap" onClick={() => selectProduct(item)}>
                          {data.totalPriceBeforeDiscount ?
                            <div>
                              {formatMoney(item.totalPrice)}
                            </div>
                            :
                            <div>
                              {item.active_price === 1 &&
                                formatMoney(item.wholesalePrice * item.quantity)
                              }
                              {item.active_price === 2 &&
                                formatMoney(item.bankPrice * item.quantity)
                              }
                              {item.active_price === 0 &&
                                formatMoney(item.salePrice * item.quantity)
                              }
                              {!item.active_price && item.active_price !== 0 &&
                                formatMoney(item.salePrice * item.quantity)
                              }
                            </div>
                          }
                        </td>
                        <td className="text-center">
                          {!item.promotion &&
                            <CancelOutlined className="cashbox-table-danger-icon"
                              onClick={() => deleteItemConfirModal(index)} />
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            {data.itemsList.length === 0 &&
              <div className="d-flex flex-column barcode-scanner-block">
                <div className="d-flex justify-content-center">
                  <img src={barcodeScanner} alt="scaner" />
                </div>
                <p className="text-center" style={{ 'width': '300px' }}>{t('scanner_text')}.</p>
              </div>
            }

            <div className="d-flex justify-content-between row pt-2">
              {/* ПОИСК ТОВАРОВ */}
              <div className={"cashbox-left d-flex flex-column justify-content-end " + (!rightBar ? 'col-md-8' : 'col-md-8')}>
                <div className="card-background br-3 product-search-table" ref={scrollRef}>
                  <table className="table fz16">
                    <thead>
                      <tr>
                        <th colSpan="2">
                          <DebounceInput
                            id="productSearchByName"
                            type="text"
                            placeholder={t('search') + '...'}
                            className="product-search-table-input left-product-search"
                            debounceTimeout={1000}
                            inputRef={bottomProductSearchRef}
                            value={searchByNameValue}
                            onChange={(e) => searchByName(e.target.value)}
                            onKeyUp={(e) => {
                              if (e.key === 'Enter') {
                                if (products.length === 1) {
                                  if (products[0]['barcode'] === "" || products[0]['barcode'] === " ") {
                                    searchProduct({ barcode: products[0]['productName'], byName: true })
                                  }
                                  if (products[0]['barcode']) {
                                    searchProduct({ barcode: products[0]['productName'] })
                                  }
                                }
                              }
                              if (e.keyCode === 40) {
                                if (products.length > 0) {
                                  const currentRow = tbodyRef.current?.children.namedItem(products[0]['id']);
                                  currentRow?.focus()
                                }
                              }
                            }}
                          />
                        </th>
                        <th className="text-end text-nowrap">{t('balance')}</th>
                        {!cashbox.hidePriceIn &&
                          <th className="text-end text-nowrap">{t('admission_price')}</th>
                        }
                        {activePrice.active === 1 &&
                          <th className="text-end text-nowrap">{t('wholesale_price')}</th>
                        }
                        {activePrice.active === 2 &&
                          <th className="text-end text-nowrap">{t('bank_price')}</th>
                        }
                        <th className="text-end text-nowrap">{t('price')}</th>
                      </tr>
                    </thead>
                    <tbody ref={tbodyRef}>
                      {products?.length > 0 ?
                        products?.map((item, index) => (
                          <tr id={item.id} className="cashbox-table-bg-on-hover cursor"
                            tabIndex={-1}
                            key={index}
                            onKeyDown={(e) => handleTableKeyDown(e, item, index)}
                            onDoubleClick={() => {
                              if (item.barcode === "" || item.barcode === " ") {
                                searchProduct({ barcode: item.productName, byName: true })
                                return
                              }
                              if (item.barcode) {
                                searchProduct({ barcode: item.barcode })
                              }
                            }}>
                            <td>
                              <div dangerouslySetInnerHTML={{ __html: highlight(item.barcode) }}></div>
                            </td>
                            <td
                              title={item.productName}
                              className={reduxSettings?.showFullProductName ? '' : 'ellipsis-td'}
                              style={{ 'maxWidth': activePrice.active ? '187px' : '260px' }}>
                              <div dangerouslySetInnerHTML={{ __html: highlight(item.productName) }}></div>
                            </td>
                            <td className="text-end text-nowrap noselect"
                              title={quantityOfUnitlist(item)}>
                              {item.uomId === 7 ?
                                <>
                                  {item?.balance?.toString()?.split('.')[0] > 0 ? item?.balance?.toString()?.split('.')[0] + ` ${item.uomName} ` : ''}
                                  {item?.balance?.toString()?.split('.')[1] > 0 ? item?.balance?.toString()?.split('.')[1] + ` ${item.secondUomName} ` : ''}
                                  {(item?.balance?.toString()?.split('.')[0] > 0 && item?.balance?.toString()?.split('.')[1] > 0) &&
                                    `= ${Number(item.balance) * Number(item?.secondQuantity)}  ${item.secondUomName}`
                                  }
                                </>
                                :
                                formatMoney(item.balance)
                              }
                            </td>
                            {!cashbox.hidePriceIn &&
                              <td className="text-end text-nowrap noselect">{formatMoney(item.price)}</td>
                            }
                            {activePrice.active === 1 &&
                              <td className="text-end text-nowrap noselect 3">{formatMoney(item.wholesalePrice)}</td>
                            }
                            {activePrice.active === 2 &&
                              <td className="text-end text-nowrap noselect 2">{formatMoney(item.bankPrice)}</td>
                            }
                            <td className="text-end text-nowrap noselect 1">{formatMoney(item.salePrice)}</td>
                          </tr>
                        ))
                        :
                        <tr>
                          <td colSpan="10" rowSpan="7" className="text-center">{t('nothing_found')}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              {/* ПОИСК ТОВАРОВ */}

              {/* PAYMENT */}
              <div className={"cashbox-right d-flex flex-column justify-content-end text-color-grey " + (!rightBar ? 'col-md-4' : 'col-md-4')}>
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-uppercase"><b>{t('total')}:</b></div>
                  <div className="d-flex">
                    {data.discountAmount === 0 ?
                      <b>{formatMoney(data.totalPrice)}</b>
                      :
                      <b>{formatMoney(data.totalPriceBeforeDiscount)}</b>
                    }
                    <div className="fz14 ms-1"><b>{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</b></div>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-uppercase"><b>{t('discount')}:</b></div>
                  <div className="d-flex">
                    <b className="me-2">({formatMoney((data.discountAmount / data.totalPriceBeforeDiscount) * 100)}%)</b>
                    <b>{formatMoney(data.discountAmount > 0 ? data.discountAmount : 0)}</b>
                    <b className="fz14 ms-1">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</b>
                  </div>
                </div>
                <div><hr /></div>
                <div className="text-end">
                  <b className="text-uppercase">{t('to_pay')}:</b><br />
                  <div className="d-flex justify-content-between">
                    <div className="d-flex mb-2">
                      {reduxSettings?.showFastPayButtons &&
                        <>
                          <button className="btn btn-primary me-2"
                            tabIndex={-1}
                            disabled={data.itemsList.length === 0}
                            onClick={() => onKeyDown({ keyCode: 112 }, true)}>
                            <img src={moneyWhite} width={25} alt="money" />
                          </button>
                          <button className="btn btn-primary"
                            tabIndex={-1}
                            disabled={data.itemsList.length === 0}
                            onClick={() => onKeyDown({ keyCode: 113 }, true)}>
                            <img src={creditCardWhite} width={25} alt="terminal" />
                          </button>
                        </>
                      }
                    </div>
                    <div className="d-flex justify-content-end">
                      <h1 className="text-primary text-nowrap fz40">{formatMoney(data.totalPrice)}</h1>
                      <b className="fz20 ms-1 text-primary">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</b>
                    </div>
                  </div>
                  <button className="btn btn-lg btn-primary w-100 text-uppercase"
                    disabled={data.itemsList.length === 0}
                    onClick={() => handlePaymentModal(true)} tabIndex="-1">
                    {t('payment')}
                  </button>
                </div>
              </div>
              {/* PAYMENT */}
            </div>

          </div>
          {/* CONTENT */}
        </div>

        <Rightbar
          rightBar={rightBar}
          searchProduct={searchProduct}
          showRightBar={showRightBar}
          cancelDiscount={cancelDiscount}
          printChequeCopy={printChequeCopy}
          addChequeToSaved={addChequeToSaved}
          getChequeFromSaved={getChequeFromSaved}
          getChequeFromCloud={getChequeFromCloud}
          chequeCopyExcel={chequeCopyExcel}
          tabSearchInput={searchInput}
          searchByNameValue={searchByNameValue}
          tabSetSearchInput={setSearchInput}
          handleShortcut={handleShortcut}
          onKeyDown={onKeyDown}
        >
        </Rightbar>
      </div>
      {/* Multikassa error Modal */}

      <Modal onClose={() => setShowModalIkpu(false)} show={showModalIkpu} >
        <h2>{t('errors')}</h2>
        <p>{formattedMessage}</p>
        <button onClick={() => setShowModalIkpu(false)}>Close</button>
      </Modal>

      <Modal show={showModalIkpu} animation={false} centered
        dialogClassName="payment-terminal-modal-width" onHide={() => setShowModalIkpu(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowModalIkpu(false)}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <h2>{t('errors')}</h2>
            <p>{formattedMessage}</p>
            <button onClick={() => setShowModalIkpu(false)}>Close</button>
          </div>
        </Modal.Body>
      </Modal>



      {/* PAYMENT MODAL */}
      <Modal show={showPaymentModal} animation={false} centered dialogClassName="payment-modal-width"
        backdrop="static" onHide={() => handlePaymentModal(false, activeTab)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => handlePaymentModal(false, activeTab)}><CloseOutlined /></div>
          <div className="tabs">
            <ul>
              <li onClick={() => selectPaymentTab(1)}>
                <span className={'text-uppercase ' + (activeTab === 1 ? 'active' : '')}>{t('payment')}</span>
              </li>
              <li onClick={() => selectPaymentTab(2)}>
                <span className={'text-uppercase ' + (activeTab === 2 ? 'active' : '')}>{t('on_credit')}</span>
              </li>
              <li onClick={() => selectPaymentTab(3)}>
                <span className={'text-uppercase ' + (activeTab === 3 ? 'active' : '')}>{t('loyalty')}</span>
              </li>
              {/* <li onClick={() => selectPaymentTab(5)}>
								<span className={'text-uppercase ' + (activeTab === 5 ? 'active' : '')}>Tirox</span>
							</li> */}
              {reduxSettings?.organizationDebtButton &&
                <li onClick={() => selectPaymentTab(4)}>
                  <span className={'text-uppercase ' + (activeTab === 4 ? 'active' : '')}>{t('organization')}</span>
                </li>
              }
            </ul>
          </div>

          {/* PAYMENT TAB */}
          {activeTab === 1 &&
            <div className="payment-tab-body d-flex justify-content-between">
              <form onSubmit={(e) => createCheque(e)} className="w-75">
                <h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
                <h5 className="color-62"><b>{formatMoney(data.totalPrice)}</b>
                  <span className="fz16">
                    {cashbox.defaultCurrency === 2 ? 'USD' : ` ${t('sum')}`}
                  </span>
                </h5>
                <div className="form-group position-relative">
                  <label className="color-a2">{t('cash')}</label>
                  <input id="cash" type="text" placeholder={`${formatMoney(0)} ${cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}`}
                    className="custom-input"
                    ref={amountInRef}
                    disabled={transactionsListTerminal.amountIn >= data.totalPrice}
                    value={transactionsListCash.amountIn ? formatMoneyInput(transactionsListCash.amountIn) : ''}
                    onChange={e => {
                      if (Number(e.target.value.replace(/[^0-9.]/g, '') >= data.totalPrice)) {
                        setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': '' })
                      }
                      setTransactionsListCash({ ...transactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                    }} />
                  <span className="input-inner-icon"
                    onClick={() => {
                      exactAmount('cash')
                    }}>
                    <img src={money} width={25} alt="money" />
                  </span>
                </div>
                <div className="form-group position-relative">
                  <label className="color-a2">
                    {t('bank_card')}
                    {transactionsListTerminal.paymentTypeId === 7 &&
                      <span>[UZUM]</span>
                    }
                    {transactionsListTerminal.paymentTypeId === 6 &&
                      <span>[PAYME]</span>
                    }
                    {transactionsListTerminal.paymentTypeId === 5 &&
                      <span>[CLICK]</span>
                    }
                  </label>
                  <input id="terminal" type="text" placeholder={`${formatMoney(0)} ${cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}`}
                    className="custom-input"
                    ref={amountInTerminalRef}
                    disabled={transactionsListCash.amountIn >= data.totalPrice}
                    value={transactionsListTerminal.amountIn ? formatMoneyInput(transactionsListTerminal.amountIn) : ''}
                    onChange={e => {
                      if (Number(e.target.value.replace(/[^0-9.]/g, '')) === Number(data.totalPrice)) {
                        setTransactionsListCash({ ...transactionsListCash, 'amountIn': '' })
                      }
                      if (Number(e.target.value.replace(/[^0-9.]/g, '')) <= Number(data.totalPrice)) {
                        setTransactionsListTerminal({ ...transactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                      }
                    }} />
                  <span className="input-inner-icon"
                    onClick={() => {
                      exactAmount('terminal')
                    }}>
                    <img src={creditCard} width={25} alt="credit-card" />
                  </span>
                </div>
                {(transactionsListTerminal.paymentTypeId === 5 || transactionsListTerminal.paymentTypeId === 6 || transactionsListTerminal.paymentTypeId === 7) &&
                  <div className="form-group position-relative">
                    <label className="color-a2">{t('otp_code')}</label>
                    <input type="text" className="custom-input" ref={qrRef}
                      value={data.otpCode}
                      onChange={e => setData({ ...data, otpCode: e.target.value })} />
                  </div>
                }
                <h6 className="color-62 text-uppercase"><b>{t('change')}:</b></h6>
                <h5 className="color-62 mb-4"><b>{formatMoney(data.change)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                <button type="submit" className="btn btn-primary w-100 text-uppercase"
                  disabled={data.change < 0 || globalDisable.current}>
                  {t('to_accept')}
                </button>
              </form>
              <div className="vertical-column">
                <button className={`payment-tab-icon-wrapper mb-2 ${transactionsListTerminal.paymentTypeId === 3 ? 'active' : ''}`}
                  onClick={() => selectPaymentType(3)}>
                  <span className="span-uzum">{t('transfer')}</span>
                </button>
                <button className={`payment-tab-icon-wrapper mb-2 ${transactionsListTerminal.paymentTypeId === 7 ? 'active' : ''}`}
                  onClick={() => selectPaymentType(7)}>
                  <span className="span-uzum">Uzum</span>
                </button>
                <button className={`payment-tab-icon-wrapper mb-2 ${transactionsListTerminal.paymentTypeId === 6 ? 'active' : ''}`}
                  onClick={() => selectPaymentType(6)}>
                  <span className="span-uzum">Payme</span>
                </button>
                <button className={`payment-tab-icon-wrapper mb-2 ${transactionsListTerminal.paymentTypeId === 5 ? 'active' : ''}`}
                  onClick={() => selectPaymentType(5)}>
                  <span className="span-uzum">Click</span>
                </button>
                {cashbox.ofd &&
                  <>
                    <button className={`payment-tab-icon-wrapper mb-2 ${data.chequeOfdType === 1 ? 'active' : ''}`}
                      onClick={() => selectPaymentType('avans')}>
                      <span className="span-uzum">{t('prepaid')}</span>
                    </button>

                    <button className={`payment-tab-icon-wrapper mb-2 ${data.chequeOfdType === 2 ? 'active' : ''}`}
                      onClick={() => selectPaymentType('credit')}>
                      <span className="span-uzum">{t('credit')}</span>
                    </button>
                  </>
                }

                {reduxSettings?.selectClientOnSale &&
                  <button className={`payment-tab-icon-wrapper mb-2 ${data.clientId ? 'active' : ''}`}
                    onClick={() => selectPaymentType('client')}>
                    {!data.clientId ?
                      <div className="span-uzum">{t('client')}</div>
                      :
                      <div>{data.clientName}</div>
                    }
                  </button>
                }
                {reduxSettings?.selectOrganizationOnSale &&
                  <button className={`payment-tab-icon-wrapper mb-2 ${data.organizationId ? 'active' : ''}`}
                    onClick={() => selectPaymentType('organization')}>
                    {!data.organizationId ?
                      <div className="span-uzum">{t('organization')}</div>
                      :
                      <div>{data.organizationName}</div>
                    }
                  </button>
                }
                {reduxSettings?.selectAgentOnSale &&
                  <button className={`payment-tab-icon-wrapper ${data.agentLogin ? 'active' : ''}`}
                    onClick={() => selectPaymentType('agent')}>
                    {!data.agentLogin ?
                      <div className="span-uzum">{t('agent')}</div>
                      :
                      <div>{data.agentName}</div>
                    }
                  </button>
                }
              </div>
            </div>
          }
          {/* PAYMENT TAB */}

          {/* DEBT TAB */}
          {activeTab === 2 &&
            <form onSubmit={(e) => createCheque(e, 'debt')}>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="color-62 text-uppercase"><b>{t('client')}:</b></h6>
                  <div className="form-group">
                    <input className="custom-input" placeholder={t('client')}
                      value={debtorOut.clientName ?? ''} disabled
                      onChange={() => { }} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <button type="button" className="btn btn-warning" onClick={() => toggleClientsModal()}>{t('choose')}</button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowAddClientModal(true)}>{t('add')}</button>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group w-100">
                      <label className="color-a2">{t('currency')}</label>
                      <select className="form-select"
                        disabled={!debtorOut.clientId}
                        onChange={(e) => setDebtorOut({ ...debtorOut, 'clientCurrencyId': e.target.value })}
                        value={debtorOut.clientCurrencyId ?? cashbox.defaultCurrency}>
                        <option value="1">{t('sum')}</option>
                        <option value="2">USD</option>
                      </select>
                    </div>
                    <div className="form-group w-100">
                      <label>{t('return_date')}</label>
                      <div className="calendar-input">
                        <DatePicker
                          className="form-control"
                          dateFormat="dd.MM.yyyy"
                          selected={data.clientReturnDate ? new Date(data.clientReturnDate) : ''}
                          onChange={(date) => setData({ ...data, 'clientReturnDate': formatDateBackend(date) })}
                          minDate={new Date()} />
                        <i className="uil uil-calendar-alt"></i>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="color-a2 text-uppercase">{t('note')}</label>
                    <input className="custom-input" placeholder={t('note')} value={debtorOut.clientComment}
                      disabled={!debtorOut.clientId}
                      onChange={(e) => setDebtorOut({ ...debtorOut, 'clientComment': e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
                  <h5 className="color-62"><b>{formatMoney(data.totalPrice)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                  <div className="form-group position-relative">
                    <label className="color-a2">{t('cash')}</label>
                    <input type="text" placeholder={formatMoney(0) + ' ' + (cashbox.defaultCurrency === 2 ? 'USD' : t('sum'))} className="custom-input" ref={amountInRef}
                      value={transactionsListCash.amountIn ? formatMoneyInput(transactionsListCash.amountIn) : ''}
                      onChange={e => {
                        if ((Number(e.target.value.replace(/[^0-9.]/g, '')) + Number(transactionsListTerminal.amountIn)) <= data.totalPrice) {
                          setTransactionsListCash({ ...transactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                        }
                      }} />
                    <span className="input-inner-icon">
                      <img src={money} width={25} alt="money" />
                    </span>
                  </div>
                  <div className="form-group position-relative">
                    <label className="color-a2">{t('bank_card')}</label>
                    <input type="text" placeholder={formatMoney(0) + ' ' + (cashbox.defaultCurrency === 2 ? 'USD' : t('sum'))} className="custom-input"
                      disabled={transactionsListCash.amountIn >= data.totalPrice}
                      value={transactionsListTerminal.amountIn ? formatMoney(transactionsListTerminal.amountIn) : ''}
                      onChange={e => {
                        if ((Number(e.target.value.replace(/[^0-9.]/g, '')) + Number(transactionsListCash.amountIn)) <= data.totalPrice) {
                          setTransactionsListTerminal({ ...transactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                        }
                      }} />
                    <span className="input-inner-icon">
                      <img src={creditCard} width={25} alt="credit-card" />
                    </span>
                  </div>
                  <h6 className="color-62 text-uppercase"><b>{t('debt_amount')}:</b></h6>
                  <h5 className="color-62 mb-4"><b>{formatMoney(data.change)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                  <button type="submit" className="btn btn-primary w-100 text-uppercase" disabled={!debtorOut.clientId}>{t('to_accept')}</button>
                </div>
              </div>
            </form>
          }
          {/* DEBT TAB */}

          {/* LOYALTY TAB */}
          {activeTab === 3 &&
            <Uget
              data={data}
              setData={setData}
              loyaltyValidated={loyaltyValidated}
              setLoyaltyValidated={setLoyaltyValidated}
              addLoyaltyCardNumber={addLoyaltyCardNumber}
              createCheque={createCheque}
              loyaltyUserInfo={loyaltyUserInfo}
              setLoyaltyUserInfo={setLoyaltyUserInfo}
              loyaltyTransactionsListCash={loyaltyTransactionsListCash}
              loyaltyTransactionsListTerminal={loyaltyTransactionsListTerminal}
              setLoyaltyTransactionsListCash={setLoyaltyTransactionsListCash}
              setLoyaltyTransactionsListTerminal={setLoyaltyTransactionsListTerminal}
            />
            // <div className="payment-tab-body">
            // 	<div className="w-75 m0-auto">
            // 		<div className="d-flex justify-content-between">
            // 			<div>
            // 				<h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
            // 				<h5 className="color-62">
            // 					<b>{formatMoney(data.totalPrice)}</b>
            // 					<span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span>
            // 				</h5>
            // 			</div>
            // 			<div className="d-flex">
            // 				<div className="vertical-center me-2">
            // 					{t('discount')}
            // 				</div>
            // 				<div className="vertical-center">
            // 					<input className="ios-switch light" type="checkbox" tabIndex="-1"
            // 						checked={data.loyaltyDiscount}
            // 						onChange={(e) => setData({ ...data, 'loyaltyDiscount': e.target.checked })} />
            // 				</div>
            // 			</div>
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('enter_qr_or_phone')}</label>
            // 			<DebounceInput
            // 				type="number"
            // 				className="custom-input"
            // 				placeholder={t('enter_qr_or_phone')}
            // 				debounceTimeout={2000}
            // 				value={loyaltySearchUserInput}
            // 				inputRef={loyaltyInputRef}
            // 				onChange={() => { }}
            // 				onKeyUp={(e) => {
            // 					if (e.keyCode === 13) {
            // 						searchUserBalance(e.target.value)
            // 					}
            // 				}}
            // 			/>
            // 			<span className="input-inner-icon" onClick={() => toggleCreateloyaltyModal(true)}>
            // 				<div className="table-action-button table-action-primary-button">
            // 					<AddOutlined />
            // 				</div>
            // 			</span>
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('card_number')}</label>
            // 			{!loyaltyUserInfo.cardNumber ?
            // 				<>
            // 					<input type="number" className="custom-input"
            // 						onChange={(e) => setLoyaltyUserInfo({ ...loyaltyUserInfo, 'addCardNumber': e.target.value })}
            // 						disabled={!loyaltyUserInfo.userLogin}
            // 						value={loyaltyUserInfo.addCardNumber} />
            // 					<span className="input-inner-icon" onClick={addLoyaltyCardNumber}>
            // 						<div className="table-action-button table-action-primary-button">
            // 							<AddOutlined />
            // 						</div>
            // 					</span>
            // 				</>
            // 				:
            // 				<>
            // 					<input type="number" className="custom-input"
            // 						onChange={() => { }}
            // 						disabled
            // 						value={loyaltyUserInfo.cardNumber} />
            // 				</>
            // 			}
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('client')}</label>
            // 			<input type="text" disabled className="custom-input" onChange={function () { }}
            // 				value={loyaltyUserInfo.firstName && loyaltyUserInfo.firstName + ' ' + loyaltyUserInfo.lastName + ' [' + loyaltyUserInfo.status + ' ' + loyaltyUserInfo.award + '%]'} />
            // 			<span className="input-inner-icon">
            // 				<PersonOutline style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
            // 			</span>
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('accumulated_points')}</label>
            // 			<input type="text" disabled className="custom-input"
            // 				onChange={function () { }} value={loyaltyUserInfo.balance} />
            // 			<span className="input-inner-icon">
            // 				<AddOutlined style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
            // 			</span>
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('points_to_be_deducted')}</label>
            // 			<input type="number" className="custom-input"
            // 				value={loyaltyUserInfo.amount}
            // 				onChange={(e) => {
            // 					if (loyaltyUserInfo.balance >= e.target.value && data.totalPrice >= e.target.value) {
            // 						setLoyaltyUserInfo({ ...loyaltyUserInfo, 'amount': e.target.value })
            // 					}
            // 				}} />
            // 			<span className="input-inner-icon">
            // 				<RemoveOutlined style={{ fontSize: '1.5rem', color: 'a2a2a2' }} />
            // 			</span>
            // 		</div>
            // 		<div className="d-flex">
            // 			<div className="form-group position-relative w-100 me-3">
            // 				<label className="color-a2">{t('cash_amount')}</label>
            // 				<input type="text" placeholder="0" className="custom-input" ref={amountInRef}
            // 					value={loyaltyTransactionsListCash.amountIn ? formatMoney(loyaltyTransactionsListCash.amountIn) : ''}
            // 					onChange={e => setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
            // 				<span className="input-inner-icon">
            // 					<img src={money} width={25} alt="money" />
            // 				</span>
            // 			</div>
            // 			<div className="form-group position-relative w-100">
            // 				<label className="color-a2">{t('terminal_amount')}</label>
            // 				<input type="text" placeholder="0" className="custom-input"
            // 					value={loyaltyTransactionsListTerminal.amountIn ? formatMoney(loyaltyTransactionsListTerminal.amountIn) : ''}
            // 					onChange={e => setLoyaltyTransactionsListTerminal({ ...loyaltyTransactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
            // 				<span className="input-inner-icon">
            // 					<img src={creditCard} width={25} alt="credit-card" />
            // 				</span>
            // 			</div>
            // 		</div>
            // 		<div className="form-group position-relative">
            // 			<label className="color-a2">{t('points_to_be_credited')}</label>
            // 			<input type="number" disabled className="custom-input"
            // 				value={formatMoney((data.totalPrice - loyaltyUserInfo.amount) * (loyaltyUserInfo.award / 100))} />
            // 			<span className="input-inner-icon">
            // 				<img src={money} width={25} alt="money" />
            // 			</span>
            // 		</div>
            // 		{!!data.loyaltyDiscount &&
            // 			<div className="d-flex justify-content-between py-2">
            // 				<b>{t('discounted_amount')}</b>
            // 				<b>{formatMoney(data.totalPrice - (data.totalPrice * loyaltyUserInfo.award / 100))}</b>
            // 			</div>
            // 		}
            // 		<button className="btn btn-primary w-100 text-uppercase"
            // 			disabled={!loyaltyValidated}
            // 			onClick={(e) => createCheque(e, 'loyalty')}>
            // 			{t('to_accept')}
            // 		</button>
            // 	</div>
            // </div>
          }
          {activeTab === 5 &&
            <Tirox
              data={data}
              createCheque={createCheque}
            />
          }
          {/* LOYALTY TAB */}

          {/* ORGANIZATION DEBT TAB */}
          {activeTab === 4 &&
            <form onSubmit={(e) => createCheque(e, 'debt')}>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="color-62 text-uppercase"><b>{t('organization')}:</b></h6>
                  <div className="form-group">
                    <input className="custom-input" placeholder={t('organization')}
                      value={debtorOut.organizationName} disabled onChange={() => function () { }} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <button type="button" className="btn btn-warning"
                      onClick={() => toggleOrganizationsModal()}>{t('choose')}</button>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group w-100">
                      <label className="color-a2">{t('currency')}</label>
                      <select className="form-select"
                        disabled={!debtorOut.organizationId}
                        onChange={(e) => setDebtorOut({ ...debtorOut, 'organizationCurrencyId': e.target.value })}
                        value={debtorOut.organizationCurrencyId ?? cashbox.defaultCurrency}>
                        <option value="1">{t('sum')}</option>
                        <option value="2">USD</option>
                      </select>
                    </div>
                    <div className="form-group w-100">
                      <label>{t('return_date')}</label>
                      <div className="calendar-input">
                        <DatePicker
                          className="form-control"
                          dateFormat="dd.MM.yyyy"
                          selected={data.organizationReturnDate ? new Date(data.organizationReturnDate) : ''}
                          onChange={(date) => setData({ ...data, 'organizationReturnDate': formatDateBackend(date) })}
                          minDate={new Date()} />
                        <i className="uil uil-calendar-alt"></i>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="color-a2 text-uppercase">{t('note')}</label>
                    <input className="custom-input" placeholder={t('note')} value={debtorOut.organizationComment}
                      onChange={(e) => setDebtorOut({ ...debtorOut, 'organizationComment': e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
                  <h5 className="color-62"><b>{formatMoney(data.totalPrice)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                  <div className="form-group position-relative">
                    <label className="color-a2">{t('cash')}</label>
                    <input type="text" placeholder={formatMoney(0) + ' ' + (cashbox.defaultCurrency === 2 ? 'USD' : t('sum'))} className="custom-input" ref={amountInRef}
                      value={transactionsListCash.amountIn ? formatMoney(transactionsListCash.amountIn) : ''}
                      onChange={e => {
                        if ((Number(e.target.value.replace(/[^0-9.]/g, '')) + Number(transactionsListTerminal.amountIn)) <= data.totalPrice) {
                          setTransactionsListCash({ ...transactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                        }
                      }} />
                    <span className="input-inner-icon">
                      <img src={money} width={25} alt="money" />
                    </span>
                  </div>
                  <div className="form-group position-relative">
                    <label className="color-a2">{t('bank_card')}</label>
                    <input type="text" placeholder={formatMoney(0) + ' ' + (cashbox.defaultCurrency === 2 ? 'USD' : t('sum'))} className="custom-input"
                      value={transactionsListTerminal.amountIn ? formatMoney(transactionsListTerminal.amountIn) : ''}
                      onChange={e => {
                        if ((Number(e.target.value.replace(/[^0-9.]/g, '')) + Number(transactionsListCash.amountIn)) <= data.totalPrice) {
                          setTransactionsListTerminal({ ...transactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })
                        }
                      }} />
                    <span className="input-inner-icon">
                      <img src={creditCard} width={25} alt="credit-card" />
                    </span>
                  </div>
                  <h6 className="color-62 text-uppercase"><b>{t('debt_amount')}:</b></h6>
                  <h5 className="color-62 mb-4"><b>{formatMoney(data.change)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                  <button type="submit" className="btn btn-primary w-100 text-uppercase" disabled={!debtorOut.organizationId}>{t('to_accept')}</button>
                </div>
              </div>
            </form>
          }
          {/* ORGANIZATION DEBT TAB */}
        </Modal.Body>
      </Modal>
      {/* PAYMENT MODAL */}

      {/* PAYMENT LOYALTY MODAL */}
      <Modal show={showLoyaltyModal} animation={false} centered dialogClassName="payment-modal-width" onHide={() => closeLoyaltyModal()}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => closeLoyaltyModal()}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
              <h5 className="color-62"><b>{formatMoney(data.totalPrice)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
              <div className="form-group position-relative">
                <label className="color-a2">{t('enter_qr_or_phone')}</label>
                <DebounceInput
                  type="number"
                  className="custom-input"
                  placeholder={t('enter_qr_or_phone')}
                  debounceTimeout={2000}
                  value={loyaltySearchUserInput}
                  inputRef={loyaltyInputRef}
                  onChange={(e) => searchUserBalance(e.target.value)}
                />
                <span className="input-inner-icon">
                  <AccountBoxOutlined style={{ color: 'a2a2a2' }} />
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
                <input type="text" disabled className="custom-input" onChange={function () { }} value={loyaltyUserInfo.balance} />
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
                    value={loyaltyTransactionsListCash.amountIn}
                    onChange={e => setLoyaltyTransactionsListCash({ ...loyaltyTransactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
                  <span className="input-inner-icon">
                    <img src={money} width={25} alt="money" />
                  </span>
                </div>
                <div className="form-group position-relative w-100">
                  <label className="color-a2">{t('terminal_amount')}</label>
                  <input type="text" placeholder="0" className="custom-input"
                    value={loyaltyTransactionsListTerminal.amountIn}
                    onChange={e => setLoyaltyTransactionsListTerminal({ ...loyaltyTransactionsListTerminal, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
                  <span className="input-inner-icon">
                    <img src={creditCard} width={25} alt="credit-card" />
                  </span>
                </div>
              </div>
              <div className="form-group position-relative">
                <label className="color-a2">{t('points_to_be_credited')}</label>
                <input type="number" disabled className="custom-input"
                  value={data.totalPrice * (loyaltyUserInfo.award / 100)} />
                <span className="input-inner-icon">
                  <img src={money} width={25} alt="money" />
                </span>
              </div>
              <button className="btn btn-primary w-100 text-uppercase"
                disabled={!loyaltyValidated}
                onClick={(e) => createCheque(e, 'loyalty')}>
                {t('to_accept')}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* PAYMENT LOYALTY MODAL */}

      {/* PAYMENT ONLY CASH MODAL */}
      <Modal show={showOnlyCashPaymentModal} animation={false} centered dialogClassName="payment-modal-width"
        onHide={() => setShowOnlyCashPaymentModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowOnlyCashPaymentModal(false)}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={(e) => createCheque(e, 'F1')}>
                <h6 className="color-62 text-uppercase"><b>{t('to_pay')}</b></h6>
                <h5 className="color-62"><b>{formatMoney(data.totalPrice)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                <div className="form-group position-relative">
                  <label className="color-a2">{t('cash')}</label>
                  <input type="text"
                    placeholder="0"
                    className="custom-input"
                    ref={amountInRef}
                    value={transactionsListCash.amountIn ? formatMoney(transactionsListCash.amountIn) : ''}
                    onChange={e => setTransactionsListCash({ ...transactionsListCash, amountIn: e.target.value.replace(/[^0-9.]/g, '') })} />
                  <span className="input-inner-icon">
                    <img src={money} width={25} alt="money" />
                  </span>
                </div>
                <h6 className="color-62"><b>{t('change')}:</b></h6>
                <h5 className="color-62 text-uppercase mb-4"><b>{formatMoney(data.change)}</b> <span className="fz16">{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}</span></h5>
                <button type="submit" className="btn btn-primary w-100 text-uppercase" disabled={data.change < 0}>{t('to_accept')}</button>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* PAYMENT ONLY CASH MODAL */}

      {/* PAYMENT ONLY TERMINAL MODAL */}
      <Modal show={showOnlyTerminalPaymentModal} animation={false} centered
        dialogClassName="payment-terminal-modal-width" onHide={() => closeOnlyTerminalPaymentModal()}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => closeOnlyTerminalPaymentModal()}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={(e) => createCheque(e, 'F2')}>
                <h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
                <h5 className="color-62 my-3"><b>{t('pay')}?</b></h5>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-danger w-100" onClick={() => closeOnlyTerminalPaymentModal()}>{t('cancel')}</button>
                  <button type="submit" id="confirmButton" className="btn btn-primary w-100">{t('ok')}</button>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* PAYMENT ONLY TERMINAL MODAL */}

      {/* PARTY SERIAL EXPDATE MODAL */}
      <Modal show={showProductWithParamsModal.unitParamsModal} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false })}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitParamsModal': false })}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-100 m0-auto">
              {productWithParams.modificationList.length > 0 &&
                <div className="table-responsive mb-5">
                  <table className="table fz14">
                    <thead>
                      <tr>
                        <th>{t('serial')}</th>
                        <th className="text-center">{t('expdate')}</th>
                        <th className="text-center">{t('party')}</th>
                        <th className="text-center">{t('balance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productWithParams.modificationList.map((item, index) => (
                        <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected === true ? 'cashbox-table-active' : '')}
                          key={index} onClick={() => selectProductWithParamsModification(index)}>
                          <td>{item.serial ? item.serial : '-'}</td>
                          <td className="text-center">{item.expDate ? item.expDate : '-'}</td>
                          <td className="text-center">{item.party ? item.party : '-'}</td>
                          <td className="text-center">{formatMoney(item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* PARTY SERIAL EXPDATE MODAL */}


      {/* EXPDATE MODAL */}
      <Modal show={UtilPaidModal} animation={false} centered dialogClassName="modal-width"
      >
        <Modal.Body className=' text-center' style={{ fontSize: "17px" }}>

          {(expDate <= 3) && <>
            <div className='d-block w-100 rounded-1 p-2 text-center fw-bold'>
              <p className='text-danger'>{t('attention')} !!!</p>
              <p>{t('dear_user')} <br /> {t('subscription_fee')} <br /> <span className='text-danger fs-5'>{expDate < 0 ? 0 : expDate} {t('days_away')}</span> <br />{t('on_time')}</p>
            </div>

            {Object.keys(cashbox).length !== 0 && (
              <div className="w-100 d-flex justify-content-between align-items-center h-100   my-2 ">
                <div className=''>
                  <div className="titlebar-left d-flex">
                    <div className="h-100 vertical-center fs-6">
                      ID: {cashbox.posId}
                    </div>
                  </div>

                  <div className="titlebar-left d-flex my-3">
                    <div className="h-100 vertical-center fs-6">
                      {t('store')}: {account.lastName}
                    </div>
                  </div>
                  <div className="titlebar-left text-start ">
                    <div className="h-100  fs-6">
                      {t('contact_center')}: <span className='mt-1'> +998 99 524-09-99 </span>
                    </div>
                  </div>
                </div>

                <div className='d-grid gap-2 mt-2'>
                  <div className="titlebar-left ">
                    <div className="h-100 vertical-center fs-6">
                      Telegram: <br /> <p className='mt-1'> @idokon_support_bot</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setUtilPaidModal(false)} className="btn btn-primary w-50 text-uppercase my-2">
              {'ok'}
            </button>
          </>
          }
        </Modal.Body>
      </Modal>
      {/*EXPDATE MODAL*/}






      {/* SELECT FROM UNITLIST MODAL */}
      <Modal show={showProductWithParamsModal.unitListModal} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitListModal': false })}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitListModal': false })}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-100 m0-auto">
              {productWithParams.unitList.length > 0 &&
                <div className="table-responsive mb-5">
                  <table className="table fz14">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th className="text-center">{t('quantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productWithParams.unitList.map((item, index) => (
                        <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected === true ? 'cashbox-table-active' : '')}
                          key={index} onClick={() => selectProductWithParamsUnit(index)}>
                          <td>{item.name}</td>
                          <td className="text-center">{formatMoney(item.quantity)}</td>
                        </tr>
                      ))
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* SELECT FROM UNITLIST MODAL */}

      {/* UNIT PRODUCT MODAL */}
      <Modal show={showProductWithParamsModal.unitProductModal} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitProductModal': false })}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowProductWithParamsModal({ ...showProductWithParamsModal, 'unitProductModal': false })}><CloseOutlined /></div>
          <form className="payment-tab-body" onSubmit={() => addToListUnit()}>
            <div className="w-100 m0-auto">
              <div className="form-group">
                <label className="color-a2">{t('quantity')}</label>
                <input type="number" placeholder="0" className="custom-input"
                  ref={productWithParamsUnitRef}
                  value={productWithParamsUnit.packaging}
                  onChange={e => setProductWithParamsUnit({ ...productWithParamsUnit, packaging: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="color-a2">{t('out_of_packaging')}</label>
                <input type="number" placeholder="0" className="custom-input"
                  value={productWithParamsUnit.piece}
                  onChange={e => setProductWithParamsUnit({ ...productWithParamsUnit, piece: e.target.value })} />
              </div>
              <div className="mb-2">
                <p>{t('product_name')}: {productWithParams.productName}</p>
                <p>{t('packaged')}: {productWithParams.selectedUnit?.quantity}</p>
                <p>{t('quantity_package')}: {productWithParams?.balance?.toString()?.split('.')[0]}</p>
                {activePrice.active === 1 &&
                  <p>{t('bank_price')}: {formatMoney(productWithParams.bankPrice)}</p>
                }
                {activePrice.active === 2 &&
                  <p>{t('wholesale_price')}: {formatMoney(productWithParams.wholesalePrice)}</p>
                }
                {activePrice.active === 0 &&
                  <p>{t('price')}: {formatMoney(productWithParams.salePrice)}</p>
                }
                <p>{t('quantity')} {productWithParams.secondUomName}: {productWithParams?.balance?.toString()?.split('.')[1]}</p>
                {activePrice.active === 1 &&
                  <p>{t('bank_price')}: {formatMoney(productWithParams.bankPrice / productWithParams.selectedUnit?.quantity)}</p>
                }
                {activePrice.active === 2 &&
                  <p>{t('wholesale_price')}: {formatMoney(productWithParams.wholesalePrice / productWithParams.selectedUnit?.quantity)}</p>
                }
                {activePrice.active === 0 &&
                  <p>{t('price')}: {formatMoney(productWithParams.salePrice / productWithParams.selectedUnit?.quantity)}</p>
                }
                <p>{t('quantity')}: {formatMoney(productWithParamsUnit.quantity, 3)}</p>
                <p>{t('to_pay')}: {formatMoney(productWithParamsUnit.totalPrice)}</p>
              </div>
              <button className="btn btn-primary w-100 text-uppercase">{t('apply')}</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {/* UNIT PRODUCT MODAL */}

      {/* SELECT & ADD CLIENT MODAL */}
      <Modal show={showAddClientModal} animation={false} centered dialogClassName="debtors-modal-width"
        onHide={() => setShowAddClientModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowAddClientModal(false)}><CloseOutlined /></div>
          <div className="w-100">
            <div className="form-group position-relative">
              <label className="color-a2">{t('contact_name')}</label>
              <input
                className="custom-input"
                value={client.name}
                onChange={e => setClient({ ...client, name: e.target.value })} />
              <span className="input-inner-icon">
                <AccountBoxOutlined style={{ color: 'a2a2a2' }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t('phone')}</label>
              <input type="number" className="custom-input"
                value={client.phone1}
                onChange={e => setClient({ ...client, phone1: e.target.value })} />
              <span className="input-inner-icon">
                <PhoneOutlined style={{ color: 'a2a2a2' }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t('phone')}</label>
              <input type="number" className="custom-input"
                value={client.phone2}
                onChange={e => setClient({ ...client, phone2: e.target.value })} />
              <span className="input-inner-icon">
                <PhoneAndroidOutlined style={{ color: 'a2a2a2' }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t('comment')}</label>
              <input className="custom-input"
                value={client.comment}
                onChange={e => setClient({ ...client, comment: e.target.value })} />
              <span className="input-inner-icon">
                <ChatBubbleOutline style={{ color: 'a2a2a2' }} />
              </span>
            </div>
            <div className="form-group">
              <label className="color-a2">{t('address')}</label>
              <input className="custom-input"
                value={client.address}
                onChange={e => setClient({ ...client, address: e.target.value })} />
            </div>
            <button className="btn btn-primary w-100"
              disabled={(client.name.length === 0 || client.phone1.length === 0)}
              onClick={createClient}>
              {t('save')}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showSelectClientModal} animation={false} centered dialogClassName="client-select-modal-width"
        onHide={() => setShowSelectClientModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowSelectClientModal(false)}><CloseOutlined /></div>
          <div className="w-100">
            <DebounceInput
              type="text"
              className="custom-input mb-3"
              placeholder={t('search_by_contacts')}
              debounceTimeout={300}
              autoFocus
              value={contactSearchInput}
              inputRef={contactSearchRef}
              onChange={(e) => { searchClient(e.target.value) }}
            />
            <div className="debtor-table-height my-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('contact')}</th>
                    <th className="text-center">{t('phone')}</th>
                    <th className="text-center">{t('phone')}</th>
                    <th className="text-center">{t('comment')}</th>
                    <th className="text-center">{t('address')}</th>
                    <th className="text-end">{t('debt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((item, index) => (
                    <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected === true ? 'cashbox-table-active' : '')} key={index} onClick={() => selectClient(index)}>
                      <td>{item.name}</td>
                      <td className="text-center">{item.phone1}</td>
                      <td className="text-center">{item.phone2}</td>
                      <td className="text-center">{item.comment}</td>
                      <td className="text-center">{item.address}</td>
                      <td className="text-end">
                        {item?.balanceList?.map((balance, index2) => (
                          <div key={index2}>
                            <span className="text-nowrap me-2">{formatMoney(balance.totalAmount)}</span>
                            <span>{balance.currencyName}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-warning w-25"
                onClick={() => setShowAddClientModal(true)}>
                {t('add')}
              </button>
              <button className="btn btn-primary w-75 text-uppercase"
                onClick={() => selectClientDone()}>
                {t('choose')}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* SELECT & ADD CLIENT MODAL */}

      {/* SELECT ORGANIZATION MODAL */}
      <Modal show={showSelectOrganizationModal} animation={false} centered dialogClassName="client-select-modal-width"
        onHide={() => setShowSelectOrganizationModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowSelectOrganizationModal(false)}><CloseOutlined /></div>
          <div className="w-100">
            <DebounceInput
              type="text"
              className="custom-input mb-3"
              placeholder={t('search')}
              autoFocus
              debounceTimeout={300}
              value={contactSearchInput}
              inputRef={contactSearchRef}
              onChange={(e) => { searchOrganization(e.target.value) }}
            />
            <div className="debtor-table-height my-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('contact')}</th>
                    <th>{t('phone')}</th>
                    <th className="text-end">{t('debt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations?.map((item, index) => (
                    <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
                      key={index} onClick={() => selectOrganization(index)}>
                      <td>{item.name}</td>
                      <td>{item.phone}</td>
                      <td className="text-end">
                        {item?.balanceList?.map((balance, index2) => (
                          <div key={index2}>
                            <span className="me-2">{formatMoney(balance.totalAmount)}</span>
                            {balance.currencyName}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary w-100 text-uppercase" onClick={() => selectOrganizationDone()}>{t('choose')}</button>
          </div>
        </Modal.Body>
      </Modal>
      {/* SELECT ORGANIZATION MODAL */}

      {/* SELECT AGENT MODAL */}
      <Modal show={showSelectAgentModal} animation={false} centered dialogClassName="client-select-modal-width"
        onHide={() => setShowSelectAgentModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowSelectAgentModal(false)}><CloseOutlined /></div>
          <div className="w-100">
            <DebounceInput
              type="text"
              className="custom-input mb-3"
              placeholder={t('search')}
              autoFocus
              debounceTimeout={300}
              value={contactSearchInput}
              inputRef={contactSearchRef}
              onChange={(e) => { searchAgents(e.target.value) }}
            />
            <div className="debtor-table-height my-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agents?.map((item, index) => (
                    <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
                      key={index} onClick={() => selectAgent(index)}>
                      <td>{item.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary w-100 text-uppercase" onClick={() => selectAgentDone()}>{t('choose')}</button>
          </div>
        </Modal.Body>
      </Modal>
      {/* SELECT AGENT MODAL */}

      {/* CONFIRM DELETE ONE PRODUCT MODAL */}
      <Modal show={showConfirmModalDeleteItem.bool} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={() => deleteItem(showConfirmModalDeleteItem.index)}>
                <h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
                <h5 className="color-62 my-3"><b>{t('delete')}?</b></h5>
                <div className="d-flex">
                  <button type="button" className="btn btn-danger w-100 me-4" onClick={() => setShowConfirmModalDeleteItem({ ...showConfirmModalDeleteItem, 'bool': false })}>{t('cancel')}</button>
                  <button type="submit" id="confirmButton" className="btn btn-primary w-100">{t('ok')}</button>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* CONFIRM DELETE ONE PRODUCT MODAL */}

      {/* CONFIRM DELETE ALL PRODUCT MODAL */}
      <Modal show={showConfirmModalDeleteAllItems} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowConfirmModalDeleteAllItems(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowConfirmModalDeleteAllItems(false)}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={deleteAllItems}>
                <h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
                <h5 className="color-62 my-3"><b>{t('delete_all')}?</b></h5>
                <div className="d-flex">
                  <button type="button" className="btn btn-danger w-100 me-4" onClick={() => setShowConfirmModalDeleteAllItems(false)}>{t('cancel')}</button>
                  <button type="submit" id="confirmButton" className="btn btn-primary w-100">{t('ok')}</button>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* CONFIRM DELETE ALL PRODUCT MODAL */}

      {/* PRODUCT OUT OF STOCK MODAL */}
      <Modal show={showProductOutOfStock} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowProductOutOfStock(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button" onClick={() => setShowProductOutOfStock(false)}><CloseOutlined /></div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
              <h5 className="text-center color-62 my-3"><b>{t('product_out_of_stock')}</b></h5>
              <button type="button" className="btn btn-primary w-100" onClick={() => {
                setShowProductOutOfStock(false);
                setTimeout(() => {
                  searchRef.current.select()
                }, 100)
              }}>{t('ok')}</button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* PRODUCT OUT OF STOCK MODAL */}

      {/* SAVED CHEQUES MODAL */}
      <Modal show={showSavedChequesModal} animation={false} centered dialogClassName="saved-cheques-modal-width"
        onHide={() => {
          setShowSavedChequesModal(false);
          setSelectedChequeFromState([])
        }}>
        <Modal.Body>
          <div className="modal-custom-close-button"
            onClick={() => {
              setShowSavedChequesModal(false);
              setSelectedChequeFromState([])
            }}>
            <CloseOutlined />
          </div>
          <div className="w-100" style={{ 'height': '400px' }}>
            <div>
              <div className="row g-0">
                <div className="col-md-6 brr-eee" style={{ 'height': '350px', 'overflow': 'auto' }}>
                  <table className="table table-fixed">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th className="text-end">{t('date')}</th>
                        <th>{t('who')}</th>
                        <th>{t('type2')}</th>
                        <th className="text-end">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reduxSettings?.postponeOnline ?
                        onlineChequeList.map((item, index) => (
                          <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
                            key={index}
                            onClick={() => {
                              selectChequeFromSaved(index, 'online')
                              selectClient(index)
                            }}>
                            <td>{index + 1}.{item.cashierName}</td>
                            <td className="text-end">{item.createdDate}</td>
                            <td>
                              {!!item.agentLogin &&
                                <span>{item.agentName}</span>
                              }
                              {!!item.clientId &&
                                <span>{item.clientName}</span>
                              }
                              {!!item.organizationId &&
                                <span>{item.organizationName}</span>
                              }
                            </td>
                            <td>
                              {!!item.agentLogin &&
                                <span>{t('agent')}</span>
                              }
                              {!!item.clientId &&
                                <span>{t('client')}</span>
                              }
                              {!!item.organizationId &&
                                <span>{t('organization')}</span>
                              }
                            </td>
                            <td className="text-end text-nowrap">{formatMoney(item.totalPrice)}</td>
                          </tr>
                        ))
                        :
                        storageChequeList.map((item, index) => (
                          <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
                            key={index}
                            onClick={() => {
                              selectChequeFromSaved(index)
                              selectClient(index)
                            }}>
                            <td>{index + 1}.{item.cashierName}</td>
                            <td>
                              {!!item.agentLogin &&
                                <span>{item.agentName}</span>
                              }
                              {!!item.clientId &&
                                <span>{item.clientName}</span>
                              }
                              {!!item.organizationId &&
                                <span>{item.organizationName}</span>
                              }
                            </td>
                            <td>
                              {!!item.agentLogin &&
                                <span>{t('agent')}</span>
                              }
                              {!!item.clientId &&
                                <span>{t('client')}</span>
                              }
                              {!!item.organizationId &&
                                <span>{t('organization')}</span>
                              }
                            </td>
                            <td className="text-end text-nowrap">{item.createdDate}</td>
                            <td className="text-end text-nowrap">{formatMoney(item.totalPrice)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6" style={{ 'height': '350px', 'overflow': 'auto' }}>
                  <table className="table table-fixed fz14">
                    <thead>
                      <tr>
                        <th style={{ 'width': '50%' }}>№ {t('product_name')}</th>
                        <th style={{ 'width': '10%' }} className="text-end">{t('price')}</th>
                        <th style={{ 'width': '20%' }} className="text-end">{t('quantity')}</th>
                        <th style={{ 'width': '20%' }} className="text-end">{t('to_pay')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChequeFromState?.itemsList?.map((item, index) => (
                        <tr className="cashbox-table-bg-on-hover cursor" key={index}>
                          <td>{index + 1}. {item.productName}</td>
                          <td className="text-end text-nowrap">
                            {formatMoney(item.salePrice)}
                          </td>
                          <td className="text-end text-nowrap">{formatMoney(item.quantity)}</td>
                          <td className="text-end text-nowrap">
                            {formatMoney(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-danger"
                onClick={() => reduxSettings?.postponeOnline ? deleteCloudChequeDone() : deleteSavedChequeDone()}>
                <CloseOutlined />
              </button>
              <button className="btn btn-primary w-100 text-uppercase"
                onClick={() => selectSavedChequeDone()}>
                {t('choose')}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* SAVED CHEQUES MODAL */}

      {/* CLOUD CHEQUES MODAL */}
      <Modal show={showAgentChequesModal} animation={false} centered dialogClassName="saved-cheques-modal-width"
        onHide={() => {
          setShowAgentChequesModal(false);
          setSelectedChequeFromState([])
        }}>
        <Modal.Body>
          <div className="modal-custom-close-button"
            onClick={() => {
              setShowAgentChequesModal(false);
              setSelectedChequeFromState([])
            }}>
            <CloseOutlined />
          </div>
          <div className="w-100" style={{ 'height': '400px' }}>
            <div className="my-3">
              <div className="row g-0">
                <div className="col-md-6 brr-eee" style={{ 'height': '350px', 'overflow': 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th className="text-end">{t('date')}</th>
                        <th>{t('who')}</th>
                        <th>{t('type2')}</th>
                        <th className="text-end">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineChequeList?.map((item, index) => (
                        <tr className={"cashbox-table-bg-on-hover cursor " + (item.selected ? 'cashbox-table-active' : '')}
                          key={index}
                          onClick={() => {
                            selectClient(index)
                            selectChequeFromCloud(index)
                          }}>
                          <td>{index + 1}. {item.agentName}</td>
                          <td className="text-end text-nowrap">{item.createdDate}</td>
                          <td>
                            {!!item.agentLogin &&
                              <span>{item.agentName}</span>
                            }
                            {!!item.clientId &&
                              <span>{item.clientName}</span>
                            }
                            {!!item.organizationId &&
                              <span>{item.organizationName}</span>
                            }
                          </td>
                          <td>
                            {!!item.agentLogin &&
                              <span>{t('agent')}</span>
                            }
                            {!!item.clientId &&
                              <span>{t('client')}</span>
                            }
                            {!!item.organizationId &&
                              <span>{t('organization')}</span>
                            }
                          </td>
                          <td className="text-end text-nowrap">{formatMoney(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6" style={{ 'height': '350px', 'overflow': 'auto' }}>
                  <table className="table fz14">
                    <thead>
                      <tr>
                        <th style={{ 'width': '50%' }}>№ {t('product_name')}</th>
                        <th style={{ 'width': '10%' }} className="text-end">{t('price')}</th>
                        <th style={{ 'width': '20%' }} className="text-end">{t('quantity')}</th>
                        <th style={{ 'width': '20%' }} className="text-end">{t('to_pay')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChequeFromState?.itemsList?.map((item, index) => (
                        <tr className="cashbox-table-bg-on-hover cursor" key={index}>
                          <td>{index + 1}. {item.productName}</td>
                          <td className="text-end text-nowrap">
                            {formatMoney(item.salePrice)}
                          </td>
                          <td className="text-end text-nowrap">{formatMoney(item.quantity)}</td>
                          <td className="text-end text-nowrap">
                            {formatMoney(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-danger"
                onClick={() => deleteCloudChequeDone()}>
                <CloseOutlined />
              </button>
              <button className="btn btn-primary w-100 text-uppercase"
                onClick={() => selectCloudChequeDone()}>
                {t('choose')}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* CLOUD CHEQUES MODAL */}

      {/* MARKING PRODUCT MODAL */}
      <Modal show={showMarkingModal} animation={false} centered dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowMarkingModal(false)}>
        <Modal.Body>
          <div className="modal-custom-close-button"
            onClick={() => setShowMarkingModal(false)}>
            <CloseOutlined />
          </div>
          <form autoComplete="off">
            <div className="payment-tab-body">
              <div className="w-100 m0-auto">
                <div className="form-group mb-2">
                  <label>{t('marking')}<span className="required-mark">*</span></label>
                  <input type="text" className="form-control" name="markingNumber"
                    placeholder={t('marking_number')}
                    autoFocus
                    style={markingProduct?.markingNumber === 0 ? { borderColor: 'red' } : {}}
                    value={markingProduct.markingNumber ?? ''}
                    onChange={(e) => { setMarkingProduct({ ...markingProduct, 'markingNumber': e.target.value }) }} />
                </div>
                <button className="btn btn-primary w-100" type="submit"
                  disabled={!(markingProduct?.markingNumber?.length)}
                  onClick={() => addToList(markingProduct, 0)}>
                  {t('add')}
                </button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {/* MARKING PRODUCT MODAL */}

      {/* PROMOTION MODAL */}
      <Modal show={showPromotionModal.bool} animation={false}
        dialogClassName="payment-terminal-modal-width"
        backdrop="static" centered
      //onHide={() => setShowPromotionModal({ ...showPromotionModal, bool: false })}
      >
        <Modal.Body>
          {/* <div className="modal-custom-close-button"
						onClick={() => setShowPromotionModal({ ...showPromotionModal, bool: false })}>
						<CloseOutlined />
					</div> */}
          <form onSubmit={handlePromotionLogic} autoComplete="off">
            <div className="payment-tab-body">
              <div className="w-100 m0-auto">
                <h5>{showPromotionModal.promotionProductName}</h5>
                <h5>{t('scan')}: {showPromotionModal.quantity}</h5>
                <h5>{t('scaned')}: {showPromotionModal.inserted}</h5>
                <div className="form-group mt-3">
                  <label>{t('barcode')}<span className="required-mark">*</span></label>
                  <input type="text" className="form-control" name="barcode	"
                    ref={inputPromotionRef}
                    placeholder={t('barcode')}
                    style={showPromotionModal?.barcode === 0 ? { borderColor: 'red' } : {}}
                    value={showPromotionModal.barcode ?? ''}
                    onChange={(e) => setShowPromotionModal({ ...showPromotionModal, 'barcode': e.target.value })} />
                </div>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      {/* PROMOTION MODAL */}

      {/* PRINT */}
      <div className={`d-none ${returnPrinterWidth()}`} ref={printChequeRef2}>
        Do'konni avtomatizatsiya dasturi. <br />
        ID okon 24/7 bepul maslahat. <br />
        QR kodli chek. <br />
        Bizning do'konimizdan xarid qiling 1% cashback oling. <br />
        Xaridingiz uchun raxmat. <br />
        <div className="d-flex justify-content-center w-100 mt-3 mb-2">
          <div className="d-flex flex-column w-100">
            <div className="d-flex justify-content-center mb-2">
              <div className="d-flex">
                {reduxSettings?.logoPath ?
                  <img src={reduxSettings?.logoPath}
                    width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
                    height={reduxSettings?.chequeLogoHeight ? reduxSettings?.chequeLogoHeight : ''}
                    alt="logo"
                  />
                  :
                  <>
                    <img src={`${globalValue('url')}/logo.svg`}
                      width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
                      height={reduxSettings?.chequeLogoHeight ? reduxSettings?.chequeLogoHeight : ''}
                      alt="logo"
                    />
                  </>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`main d-none ${returnPrinterWidth()}`} ref={printChequeRef}>
        {(!reduxSettings?.ofd && !cashbox.ofd) &&
          <div className="d-flex justify-content-center w-100 mt-3 mb-2">
            <div className="d-flex flex-column w-100">
              <div className="d-flex justify-content-center mb-2">
                <div className="d-flex">
                  {reduxSettings?.logoPath ?
                    <img src={reduxSettings?.logoPath}
                      width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
                      height={reduxSettings?.chequeLogoHeight ? reduxSettings?.chequeLogoHeight : ''}
                      alt="logo"
                    />
                    :
                    <>
                      <img src={`${globalValue('url')}/logo.svg`}
                        width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
                        height={reduxSettings?.chequeLogoHeight ? reduxSettings?.chequeLogoHeight : ''}
                        alt="logo"
                      />
                    </>
                  }
                </div>
              </div>
            </div>
          </div>
        }
        <h3 className="text-center fw-700 mb-2">
          <span>{cashbox.posName}</span>
        </h3>
        <h5 className="text-center fw-600 mb-2">
          <span>{t('phone')}:</span>
          <span>{cashbox.posPhone}</span>
        </h5>
        <h5 className="text-center fw-500 mb-2">
          <span>{t('address')}:</span>
          <span>{cashbox.posAddress}</span>
        </h5>
        <div className="d-flex justify-content-between">
          <p>{t('inn')}</p>
          <p>{cashbox.tin}</p>
        </div>
        <div className="cheque-block-1 fz12">
          {!!data.pinPad0 &&
            <div className="d-flex justify-content-between">
              <p>{t('terminal_response_code')}</p>
              <p>{data.pinPad0}</p>
            </div>
          }
          {!!data.pinPad1 &&
            <div className="d-flex justify-content-between">
              <p>{t('card_number')}</p>
              <p>{data.pinPad1}</p>
            </div>
          }
          {!!data.pinPad2 &&
            <div className="d-flex justify-content-between">
              <p>{t('terminal_id')}</p>
              <p>{data.pinPad2}</p>
            </div>
          }
          {!!data.pinPad3 &&
            <div className="d-flex justify-content-between">
              <p>{t('auth_code')}</p>
              <p>{data.pinPad3}</p>
            </div>
          }
          {!!data.pinPad4 &&
            <div className="d-flex justify-content-between">
              <p>{t('card_type')}</p>
              <p>{data.pinPad4}</p>
            </div>
          }
          {!!data.pinPad7 &&
            <div className="d-flex justify-content-between">
              <p>{t('terminal_cheque_number')}</p>
              <p>{data.pinPad7}</p>
            </div>
          }
          {/* {data.uzumPaymentId &&
						<div className="d-flex justify-content-between">
							<p className="text-nowrap">Uzum ID</p>
							<p className="text-end">{data.uzumPaymentId}</p>
						</div>
					}
					{data.uzumClientPhone &&
						<div className="d-flex justify-content-between">
							<p>Uzum telefon</p>
							<p>{data.uzumClientPhone}</p>
						</div>
					} */}
          <div className="d-flex justify-content-between">
            <p>Chek raqami</p>
            <p>{parseInt(localStorage.getItem("check_count")) + 1}</p>
          </div>
          <div className="d-flex justify-content-between">
            <p>{t('card_type')}</p>
            <p>{account.firstName + " " + account.lastName}</p>
          </div>
          {data.pinPadCardNumber &&
            <div className="d-flex justify-content-between">
              <p>{t('cashier')}</p>
              <p>{data.pinPadCardNumber}</p>
            </div>
          }
          <div className="d-flex justify-content-between">
            <p>{t('cheque_id')}</p>
            <p>{data.chequeNumber}</p>
          </div>
          {data?.fiscalResult?.ReceiptSeq &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('cheque_number')}</p>
              <p>{data?.fiscalResult?.ReceiptSeq}</p>
            </div>
          }

          {data.chequeOfdType >= 0 &&
            <div className="d-flex justify-content-between">
              <p>{t('cheque_type')}</p>
              <p>
                {data.chequeOfdType === 0 &&
                  <span>{t('sales')}</span>
                }
                {data.chequeOfdType === 1 &&
                  <span>{t('avans')}</span>
                }
                {data.chequeOfdType === 2 &&
                  <span>{t('credit')}</span>
                }
              </p>
            </div>
          }
          <div className="d-flex justify-content-between">
            <p>{t('date')}</p>
            <p>
              {data.dateFormat1 ?
                <span>{data.dateFormat1}</span>
                :
                <span>{formatUnixTime(data.chequeDate)}</span>
              }
            </p>
          </div>
        </div>
        <div className="overflow-hidden">
          ****************************************************************************************************
        </div>
        <div className="cheque-block-2">
          <table className="custom-cheque-table w-100 fz12">
            <thead>
              <tr>
                <th className="text-start w-50">{t('product')}</th>
                <th className="text-end">{t('price')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(data).length !== 0 &&
                data.itemsList.map((item, index) => (
                  <Fragment key={index}>
                    <tr>
                      {/* column 1 */}
                      <td colSpan={3} className="d-flex text-break-spaces">
                        <b>{index + 1}. {item.productName}</b>
                      </td>
                      {/* column 1 */}
                    </tr>
                    <tr>
                      <td colSpan={3}>
                        <div className="ms-2">
                          <div className="d-flex justify-content-between">
                            <div>{t('price')}</div>
                            <div className="text-nowrap text-end">
                              {/* item.uomId === 7 */}
                              {false ?
                                <>
                                  {item?.quantity?.toString()?.split('.')[0] > 0 ? item?.quantity?.toString()?.split('.')[0] + ` ${item.uomName} ` : ''}
                                  {item?.quantity?.toString()?.split('.')[1] > 0 ? item?.quantity?.toString()?.split('.')[1] + ` ${item.secondUomName} ` : ''}
                                  {'*' + formatMoney(item.salePrice)}={formatMoney(item.quantity * item.salePrice)}
                                </>
                                :
                                <>
                                  {formatMoney(item.quantity)}
                                  {'*' + formatMoney(item.salePrice)}={formatMoney(item.quantity * item.salePrice)}
                                </>
                              }
                            </div>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div>{t('uom')}</div>
                            <div className="text-end">
                              {item.packageCode ?
                                <span>{item.packageName ?? ''}</span>
                                :
                                <span>{item.uomName ?? ''}</span>
                              }
                            </div>
                          </div>
                          {!!item.discountAmount &&
                            <div className="d-flex justify-content-between">
                              <div>{t('discount')}</div>
                              <div>{item.discountAmount}</div>
                            </div>
                          }
                          <div className="d-flex justify-content-between">
                            <div>{t('vat')} ({formatMoney(item.vat)}%)</div>
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
                                <div>{t('bar_code')}</div>
                                <div>{item.barcode}</div>
                              </div>
                              <div className="d-flex justify-content-between">
                                <div>{t('gtin')}</div>
                                <div>{item.gtin}</div>
                              </div>
                            </>
                          }
                          {item.markingNumber &&
                            <div className={`${returnPrinterWidth()}`}>
                              <div>MK</div>
                              <div style={{ overflowWrap: 'break-word', 'textAlign': 'end' }}>{item.markingNumber}</div>
                            </div>
                          }
                          {item.organizationTin &&
                            <div className="d-flex justify-content-between">
                              <div>
                                {t('komitent')}
                                {item.organizationTin.length === 9 &&
                                  <span>{t('stir')}</span>
                                }
                                {item.organizationTin.length === 14 &&
                                  <span>{t('PINFL')}</span>
                                }
                              </div>
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
          ****************************************************************************************************
        </div>
        <div className="cheque-block-3 fz12 mb-2">
          <div className="d-flex justify-content-between">
            <p>{t('sale_amount')}</p>
            {data.totalPrice ?
              <p>{formatMoney(data.totalPrice)}</p>
              :
              <p>{formatMoney(0)}</p>
            }
          </div>
          <div className="d-flex justify-content-between">
            <p>{t('vat_total')}</p>
            {data.totalVatAmount > 0 ?
              <p>{formatMoney(data.totalVatAmount)}</p>
              :
              <p>{formatMoney(0)}</p>
            }
          </div>
          <div className="d-flex justify-content-between">
            <p>{t('total_discount')}</p>
            <p>{formatMoney(data.discountAmount ? data.discountAmount : 0)}</p>
          </div>
          <div className="d-flex justify-content-between">
            <p className={'fw-700 ' + (reduxSettings?.checkPrintWidth === "80" ? 'fz20' : 'fz16')}>
              {t('to_pay')}
            </p>
            {data.totalPrice &&
              <p className={'fw-700 ' + (reduxSettings?.checkPrintWidth === "80" ? 'fz20' : 'fz16')}>
                <span>{formatMoney(Number(data.totalPrice) - Number(data.discountAmount ?? 0))}</span>
              </p>
            }
          </div>
          <div className="d-flex justify-content-between">
            <p>{t('paid')}</p>
            {data.paid ?
              <p>{formatMoney(data.paid)}</p>
              :
              <p>{formatMoney(0)}</p>
            }
          </div>
          {data.saleCurrencyId &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('currency')}</p>
              {data.saleCurrencyId === 1 &&
                <p className="text-capitalize">So'm</p>
              }
              {data.saleCurrencyId === 2 &&
                <p>USD</p>
              }
            </div>
          }
          {(Object.keys(data).length > 0 && data.transactionsList.length > 0) &&
            data.transactionsList.map((item, index) => (
              <div className="d-flex justify-content-between" key={index}>
                {item.paymentTypeId === 1 &&
                  <p>{t('cash')}</p>
                }
                {item.paymentTypeId === 2 &&
                  <p>{t('bank_card')}</p>
                }
                {item.paymentTypeId === 4 &&
                  <p>uGet</p>
                }
                {item.paymentTypeId === 5 &&
                  <p>Click</p>
                }
                {item.paymentTypeId === 6 &&
                  <p>Payme</p>
                }
                {item.paymentTypeId === 7 &&
                  <p>Uzum</p>
                }
                <p>{formatMoney(item.amountIn)}</p>
              </div>
            ))
          }
          {!!data.loyaltyClientName &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">Mijoz</p>
              <p>{data.loyaltyClientName}</p>
            </div>
          }
          {!!data.loyaltyBonus &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">Loyalty Bonus</p>
              <p>{data.loyaltyBonus}</p>
            </div>
          }
          <div className="d-flex justify-content-between">
            <p>{t('refund')}</p>
            {data.change ?
              <p>{formatMoney(data.change)}</p>
              :
              <p>{formatMoney(0)}</p>
            }
          </div>
          {data.clientBalance &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debt_was')}</p>
              {(data.clientBalance && data.clientAmount) &&
                <p>
                  {formatMoney(Number(data.clientAmount) + Number(data.clientBalance))}
                </p>
              }
            </div>
          }
          {Number(data.clientAmount) > 0 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debt_amount')}</p>
              {data.clientAmount &&
                <p>{formatMoney(data.clientAmount)}</p>
              }
            </div>
          }
          {data.clientBalance &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debt_total')}</p>
              {data.clientBalance &&
                <p>{formatMoney(data.clientBalance)}</p>
              }
            </div>
          }
          {data.clientPhone1 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('client_number')}</p>
              <p>{data.clientPhone1}</p>
            </div>
          }
          {data.clientPhone2 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('client_number')}</p>
              <p>{data.clientPhone2}</p>
            </div>
          }
          {data.clientAddress &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('address')}</p>
              <p className="text-end">{data.clientAddress}</p>
            </div>
          }
          {Number(data.clientAmount) > 0 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debtor')}</p>
              {data.clientName &&
                <p>{data.clientName}</p>
              }
            </div>
          }
          {(Number(data.clientAmount) === 0 && data.clientName) &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('client')}</p>
              {data.clientName &&
                <p>{data.clientName}</p>
              }
            </div>
          }
          {Number(data.organizationAmount) > 0 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debt_amount')}</p>
              {data.organizationAmount &&
                <p>{formatMoney(data.organizationAmount)}</p>
              }
            </div>
          }
          {Number(data.organizationAmount) > 0 &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('debtor')}</p>
              {data.organizationName &&
                <p>{data.organizationName}</p>
              }
            </div>
          }
          {(Number(data.organizationAmount) === 0 && data.organizationName) &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('organization')}</p>
              {data.organizationName &&
                <p>{data.organizationName}</p>
              }
            </div>
          }
          {!!data.agentName &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('agent')}</p>
              {data.agentName &&
                <p>{data.agentName}</p>
              }
            </div>
          }
          {!!data.clientReturnDate &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('return_date')}</p>
              <p>{formatDateWithTime(data.clientReturnDate, 'dd.MM.yyyy')}</p>
            </div>
          }
          {!!data.organizationReturnDate &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('return_date')}</p>
              <p>{formatDateWithTime(data.organizationReturnDate, 'dd.MM.yyyy')}</p>
            </div>
          }
          {/* FISCAL INFO */}
          {/* <div className="d-flex justify-content-between">
						<p className="fw-600">Serial raqam</p>
						<p>20220778</p>
					</div>
					{data?.fiscalResult?.AppletVersion &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Virtual kassa</p>
							<p>{globalValue('projectName')}</p>
						</div>
					} */}
          {data?.fiscalResult?.TerminalID &&
            <>
              <div className="overflow-hidden">
                ****************************************************************************************************
              </div>
              <div className="d-flex justify-content-between">
                <p className="fw-600">{t('fiscal_module')}</p>
                <p>{data?.fiscalResult?.TerminalID}</p>
              </div>
            </>
          }
          {data?.fiscalResult?.FiscalSign &&
            <div className="d-flex justify-content-between">
              <p className="fw-600">{t('fiscal_sign_number')}</p>
              <p>{data?.fiscalResult?.FiscalSign}</p>
            </div>
          }
          {/* FISCAL INFO */}
        </div>
        {(data?.fiscalResult?.QRCodeURL && reduxSettings?.showQrCode) &&
          <div className="d-flex justify-content-center">
            <br></br>
            <QRCode value={data?.fiscalResult?.QRCodeURL} size={160} />
          </div>
        }
        {(data.chequeNumber && reduxSettings?.showBarcode) &&
          <div className="d-flex justify-content-center">
            <Barcode value={data.chequeNumber} width={2} height={30} displayValue={false} background="transparent" />
          </div>
        }
        <div className="overflow-hidden">
          ****************************************************************************************************
        </div>
        {!reduxSettings?.additionalInformation &&
          <div className="d-flex justify-content-center mb-2">
            <p>{t('thanks_letter')}</p>
          </div>
        }
        {reduxSettings?.additionalInformation &&
          <div className="d-flex justify-content-center">
            <p>{reduxSettings?.additionalInformationText}!</p>
          </div>
        }
      </div>
      {/* PRINT */}
    </>
  )
}

export default Tab
