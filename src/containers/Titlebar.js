import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from "react-router-dom";
import { POST, GET, globalValue } from 'api/api'
import {
  CloseOutlined, RemoveOutlined, StopOutlined, AddOutlined,
  LockOpenOutlined, CachedOutlined, TimelineOutlined, CreditCardOutlined, MonetizationOnOutlined,
  WifiOutlined, WifiLockOutlined, AccountBoxOutlined, PhoneOutlined, ChatBubbleOutline, ComputerOutlined,
  Money,
  NotificationImportantOutlined,
  NotificationsActiveOutlined,
  Close

} from '@material-ui/icons';
import { Modal } from 'react-bootstrap';
import { DebounceInput } from 'react-debounce-input';
import { SET_INTERNET, SET_LOCK_SCREEN } from 'store/actions/settings'
import { SET_UNSYNC_PRODUCTS } from 'store/actions/countUnsyncProducts'
import { SET_PRODUCTS_FROM_DB } from 'store/actions/backendHelpers'
import { toast } from 'react-toastify';

import { clearTemporaryStorage, getUnixTime, formatDateWithTime, formatMoney, todayDate, todayYYYYMMDD, formatMoneyInput } from 'helpers/helpers'
import '../assets/css/titlebar.css'
import logo from '../assets/images/logo.svg'
import logo_white from '../assets/images/logo_white.svg'
import money from 'assets/icons/money.svg'
import creditCard from 'assets/icons/credit-card.svg'
import { O_POST } from 'api/apiOfd';

function Titlebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch()
  const history = useHistory();

  const contactSearchRef = useRef(null);
  const printChequeRef = useRef(null);
  const printDebtorChequeRef = useRef(null);

  const cashbox = useSelector(state => state.cashbox)
  const shift = useSelector(state => state.shift)
  const account = useSelector(state => state.account)
  const reduxSettings = useSelector(state => state.settings?.settings)
  const internetConnection = useSelector(state => state.settings.internetConnection)
  const lockScreen = useSelector(state => state.settings.lockScreen)

  const [data, setData] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [reportType, setReportType] = useState(true);
  const [debtorChequeData, setDebtorChequeData] = useState({ 'date': '', 'name': '', 'payed': 0, 'debt': 0 })
  const [debtors, setDebtors] = useState([])
  const [oldDebtors, setOldDebtors] = useState([])
  const [client, setClient] = useState({ "name": "", "phone1": "", "phone2": "", "comment": "" })
  const [debtorOut, setDebtorOut] = useState({
    "amountOut": "", "cashboxId": cashbox.cashboxId, "currencyId": cashbox.defaultCurrency,
    "note": "", "expenseId": 1, "posId": cashbox.posId, "shiftId": cashbox.id ? cashbox.id : shift.id
  })

  const [showXReportModal, setShowXReportModal] = useState(false);
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [OpenCashModal, setOpenCashModal] = useState(false);
  const [OpenNotifModal, setOpenNotifModal] = useState(false);
  const [CashAmount, setCashAmount] = useState(localStorage.getItem('cashAmount') ? localStorage.getItem('cashAmount') : '');
  const [RecievedMoney, setRecievedMoney] = useState('');
  const [RecievedMoneyStatus, setRecievedMoneyStatus] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showConfirmShiftCloseModal, setShowConfirmShiftCloseModal] = useState(false);

  const [contactSearchInput, setContactSearchInput] = useState("");

  const [debtorNote, setDebtorNote] = useState("");
  const [transactionsListCash, setTransactionsListCash] = useState({ "amountIn": "", "amountOut": "", "paymentTypeId": 1, "paymentPurposeId": 1 });
  const [transactionsListTerminal, setTransactionsListTerminal] = useState({ "amountIn": "", "amountOut": "", "paymentTypeId": 2, "paymentPurposeId": 1 });
  const [rotation, setRotation] = useState(0);
  const notificationSound = new Audio('/notif.mp3'); // Ovoz faylini chaqirish

  function windowMinimize() {
    window.electron.appApi.windowMinimize()
  }

  function windowMaximize() {
    window.electron.appApi.windowMaximize()
  }

  function windowClose() {
    if (window.navigator.onLine && internetConnection) {
      window.electron.dbApi.getUnsyncCheques().then(response => {
        if (response.length > 0) {
          for (let i = 0; i < response.length; i++) {
            response[i]['itemsList'] = JSON.parse(response[i]['itemsList'])
            response[i]['transactionsList'] = JSON.parse(response[i]['transactionsList'])
            response[i]['cashierLogin'] = response[i]['login']
          }

          POST("/services/desktop/api/cheque-create-list", response, false, false).then(response2 => {
            window.electron.dbApi.updateChequesListStatus(response2.transactionList)
            window.electron.appApi.windowClose()
          }).catch(e => {
            window.electron.appApi.windowClose()
          })

        } else {
          window.electron.appApi.windowClose()
        }
      })
    } else {
      window.electron.appApi.windowClose()
    }
    // Before was only this line below
    //window.electron.appApi.windowClose()
  }

  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async function closeMultikassaSession() {

    const url = "http://localhost:8080/api/v1/operations";

    const requestBody = {
      "module_operation_type": "2",
      "receipt_gnk_time": getCurrentDateTime()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Parse response to JSON
      toast.success(t('success_ofd_close_session'))
    } catch (error) {
      toast.error(t('fail_ofd_close_session'))
    }

  }

  async function closeShift(e) {
    setReportType(false)
    e.preventDefault()
    var sendData = {}
    sendData.actionDate = getUnixTime()
    sendData.cashboxId = cashbox.cashboxId
    if (shift.id) {
      sendData.id = shift.id
    } else {
      sendData.id = cashbox.id
    }

    sendData.offline = false
    sendData.posId = cashbox.posId

    var shiftId = cashbox.id ? cashbox.id : shift.id

    // SYNC CHEQUES THEN CLOSE SHIFT
    if (window.navigator.onLine && internetConnection) {
      window.electron.dbApi.getUnsyncDeletedProducts().then(response => {
        if (response.length > 0) {
          POST("/services/desktop/api/cheque-deleted-list", response, false, false).then(() => {
            window.electron.dbApi.updateDeletedProductsStatus(response)
          })
        }
      })

      var responseDate = {}
      try {
        if (window.navigator.onLine) {
          responseDate = await GET("/services/desktop/api/date-helper")
        }
      } catch (error) {
        console.log('here')
      }
      responseDate.ofdDate = responseDate?.ofdDate ? responseDate?.ofdDate : todayYYYYMMDD()
      var responseOfd;
      if (reduxSettings?.ofd) {
        responseOfd = await O_POST({
          "method": "Api.CloseZReport",
          "id": '',
          "params": {
            "FactoryID": reduxSettings?.ofdFactoryId,
            "Time": responseDate.ofdDate,
          },
          "jsonrpc": "2.0"
        })
      }

      const multikassaOfd = localStorage.getItem('multikassaOfd') === 'true'

      if (multikassaOfd) {
        closeMultikassaSession()
      }

      window.electron.dbApi.getUnsyncCheques().then(response => {
        if (response.length > 0) {
          for (let i = 0; i < response.length; i++) {
            response[i]['itemsList'] = JSON.parse(response[i]['itemsList'])
            response[i]['transactionsList'] = JSON.parse(response[i]['transactionsList'])
            response[i]['cashierLogin'] = response[i]['login']
          }

          POST("/services/desktop/api/cheque-create-list", response, false, false).then(response2 => {
            window.electron.dbApi.updateChequesListStatus(response2.transactionList).then(() => {
              GET("/services/desktop/api/shift-xreport/" + shiftId).then(xReportResponse => {
                setData(xReportResponse)
                if (!reduxSettings?.printerBroken) {
                  var domInString = printChequeRef.current.outerHTML
                  window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
                }

                POST("/services/desktop/api/close-shift", sendData, true).then(() => {
                  clearTemporaryStorage()
                  dispatch({ type: 'USER_LOGGED_OUT', payload: null })
                  history.push("/auth/login")
                });
              })
            })
          }).catch(e => {
            toast.error(t('synchronization_error'))
          })
        } else {
          GET("/services/desktop/api/shift-xreport/" + shiftId).then(response => {
            response.AppletVersion = responseOfd?.result?.AppletVersion
            response.UnsentZReportsCount = responseOfd?.result?.UnsentZReportsCount
            response.ErrorsCount = responseOfd?.result?.ErrorsCount
            response.AwaitingToSendZReportsCount = responseOfd?.result?.AwaitingToSendZReportsCount
            setData(response)
            //if (!reduxSettings?.printerBroken) {
            var domInString = printChequeRef.current.outerHTML
            window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
            //}

            POST("/services/desktop/api/close-shift", sendData, true).then(() => {
              clearTemporaryStorage()
              dispatch({ type: 'USER_LOGGED_OUT', payload: null })
              history.push("/auth/login")
            }).catch(err => {
              clearTemporaryStorage()
              dispatch({ type: 'USER_LOGGED_OUT', payload: null })
              history.push("/auth/login")
            });
          })
        }
      })
    } else {
      toast.error(t('no_internet_connection'))
    }
    // SYNC CHEQUES THEN CLOSE SHIFT

    return;
  }

  function toggleInternetListener() {
    var condition = navigator.onLine ? "online" : "offline";
    if (condition === "online" && internetConnection !== 2) {
      dispatch(SET_INTERNET(1))
    }
    if (condition === "offline" && internetConnection !== 2) {
      dispatch(SET_INTERNET(0))
    }
  }

  function toggleInternet(boolean) {
    var condition = navigator.onLine ? "online" : "offline";
    if (boolean === 1 && condition === "online")
      dispatch(SET_INTERNET(1))
    if (boolean === 1 && condition === "offline")
      dispatch(SET_INTERNET(0))
    if (boolean === 2)
      dispatch(SET_INTERNET(2))
  }

  function getXReport() {
    setReportType(true)
    var shiftId = cashbox.id ? cashbox.id : shift.id
    GET("/services/desktop/api/shift-xreport/" + shiftId).then(response => {
      setData(response)
      if (reduxSettings?.xReport) {
        setShowXReportModal(true)
      } else {
        if (!reduxSettings?.printerBroken) {
          var domInString = printChequeRef.current.outerHTML
          window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter)
        }
      }
    })
  }

  function openRemoteAccess(type) {
    window.electron.appApi.openRemoteAccess(type)
  }

  /* ВЗАИМО РАСЧЕТ */
  function getDebtorsShowModal() {
    GET("/services/desktop/api/client-debt-list/" + cashbox.posId).then(response => {
      for (let i = 0; i < response.length; i++) {
        response.selected = false
      }
      setDebtors(response)
      setOldDebtors(response)
      setShowDebtorsModal(true)
      setTimeout(() => {
        contactSearchRef.current.select()
      }, 100);
    })
  }

  function closeDebtorsModal() {
    setShowDebtorsModal(false)
    setContactSearchInput("")
    setTransactionsListCash({ ...transactionsListCash, "amountIn": "" })
    setTransactionsListTerminal({ ...transactionsListTerminal, "amountIn": "" })
    setDebtorNote("")
  }

  function closeKassaModal() {
    setOpenCashModal(false)
    setRecievedMoneyStatus(false);
  }

  function closeNotificationModal() {
    setOpenNotifModal(false)
  }


  function searchDebtor(search) {
    if (search.length === 0) {
      setDebtors(oldDebtors)
    } else {
      setContactSearchInput(search)
      var debtorsCopy = [...oldDebtors]
      var arr = []
      for (let i = 0; i < debtorsCopy.length; i++) {
        if (debtorsCopy[i]['clientName'].toLowerCase().includes(search.toLowerCase())) {
          arr.push(debtorsCopy[i])
        }
      }
      setDebtors(arr)
    }
  }

  function selectDebtorClient(clientId, currencyId) {
    var debtorsCopy = [...debtors]
    for (let i = 0; i < debtorsCopy.length; i++) {
      if (debtorsCopy[i]['clientId'] === clientId && debtorsCopy[i]['currencyId'] === currencyId) {
        debtorsCopy[i]['selected'] = true
      } else {
        debtorsCopy[i]['selected'] = false
      }
    }
    setDebtors(debtorsCopy)
  }

  function createClientDebt() {
    var debtorsCopy = [...debtors]
    var sendData = {
      "amountIn": 0,
      "amountOut": 0,
      "cashboxId": cashbox.cashboxId,
      "clientId": 0,
      "currencyId": 0,
      "posId": cashbox.posId,
      "shiftId": cashbox.id ? cashbox.id : shift.id,
      "transactionsList": []
    }

    for (let i = 0; i < debtorsCopy.length; i++) {
      if (debtorsCopy[i]['selected']) {
        sendData.clientId = debtorsCopy[i]['clientId']
        sendData.clientName = debtorsCopy[i]['clientName']
        sendData.balance = debtorsCopy[i]['balance']
        sendData.currencyId = debtorsCopy[i]['currencyId']
        sendData.currencyName = debtorsCopy[i]['currencyName']
        sendData.note = debtorNote
      }
    }

    if (sendData.clientId === 0) {
      toast.error(t('debtor_not_selected'))
      return;
    }

    if (transactionsListCash.amountIn || transactionsListTerminal.amountIn) {
      transactionsListCash.paymentPurposeId = 5
      sendData.amountIn += Number(transactionsListCash.amountIn)
      if (Number(transactionsListCash.amountIn) > 0 || Number(transactionsListCash.amountOut) > 0) {
        sendData.transactionsList.push(transactionsListCash)
      }
    }

    if (transactionsListTerminal.amountIn || transactionsListTerminal.amountIn) {
      transactionsListTerminal.paymentPurposeId = 5
      sendData.amountIn += Number(transactionsListTerminal.amountIn)
      if (Number(transactionsListTerminal.amountIn) > 0 || Number(transactionsListTerminal.amountOut) > 0) {
        sendData.transactionsList.push(transactionsListTerminal)
      }
    }

    setDebtorChequeData({
      'date': todayDate(),
      'name': sendData.clientName,
      'payed': sendData.amountIn,
      'currencyName': sendData.currencyName,
      'balance': sendData.balance + sendData.amountIn
    })

    POST("/services/desktop/api/client-debt-in", sendData).then(() => {
      setTransactionsListCash({ ...transactionsListCash, 'amountIn': "" })
      setTransactionsListTerminal({ ...transactionsListTerminal, 'amountIn': "" })
      setDebtorNote('')

      if (!reduxSettings?.printerBroken) {
        var domInString = printDebtorChequeRef.current.outerHTML;
        window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter);
        setTimeout(() => {
          window.electron.appApi.print(domInString, reduxSettings?.receiptPrinter);
        }, 500);
      }

      toast.success(t('success'))

      GET("/services/desktop/api/client-debt-list/" + cashbox.posId).then(response => {
        for (let i = 0; i < response.length; i++) {
          response.selected = false
        }
        setDebtors(response)
        setOldDebtors(response)
      })
    })
  }
  /* ВЗАИМО РАСЧЕТ */

  /* РАСХОДЫ */
  function createClient() {
    POST("/services/desktop/api/clients", client).then(() => {
      setClient({ "name": "", "phone1": "", "phone2": "", "comment": "" })
      setShowAddClientModal(false)
    })
  }

  function closeExpensesModal() {
    setShowExpensesModal(false)
    setDebtorOut({ ...debtorOut, "amountOut": "" })
  }

  function createDebtorOut(e) {
    e.preventDefault();
    POST("/services/desktop/api/expense-out", debtorOut).then(() => {
      setDebtorOut({ ...debtorOut, "expenseId": "", "amountOut": "", "note": "" })
      setShowExpensesModal(false)
    });
  }

  function createCashMoney(e) {
    e.preventDefault();
    console.log(CashAmount);
    localStorage.setItem('cashAmount', CashAmount);
    setRecievedMoneyStatus(false);
    setOpenCashModal(false)
  }


  function toggleExpenseModal(bool = false) {
    if (bool) {
      GET("/services/desktop/api/expense-helper").then(response => {
        setExpenses(response)
        var expenseId = 0
        if (response.length > 0) expenseId = response[0]['id']
        setDebtorOut({ ...debtorOut, "expenseId": expenseId, "amountOut": "", "note": "" })
        setShowExpensesModal(true)
      });
    } else {
      setShowExpensesModal(false)
    }
  }
  /* РАСХОДЫ */

  function setLockScreen() {
    dispatch(SET_LOCK_SCREEN())
  }

  function syncCheques() {
    if (window.navigator.onLine && internetConnection) {
      window.electron.dbApi.getUnsyncCheques().then(response => {

        if (response.length > 0) {
          for (let i = 0; i < response.length; i++) {
            response[i]['itemsList'] = JSON.parse(response[i]['itemsList'])
            response[i]['transactionsList'] = JSON.parse(response[i]['transactionsList'])
            response[i]['cashierLogin'] = response[i]['login']
          }

          POST("/services/desktop/api/cheque-create-list", response, false, false).then(response2 => {
            window.electron.dbApi.updateChequesListStatus(response2.transactionList).then(() => {
              window.electron.dbApi.getUnsyncCheques().then(response4 => {
                dispatch(SET_UNSYNC_PRODUCTS(response4.length))
                toast.success(t('synchronized'))

                GET("/services/desktop/api/get-balance-product-list/" + cashbox.posId + "/" + cashbox.defaultCurrency).then(response => {
                  window.electron.dbApi.deleteProducts()
                  window.electron.dbApi.insertProducts(response).catch(e => { toast.error(e) })
                  dispatch(SET_PRODUCTS_FROM_DB(Math.floor(Math.random() * 999999)))
                  setTimeout(() => {
                    toast.info(t('all_products_synchronized'))
                  }, 1000);
                })
              })
            })
          }).catch(e => {
            toast.error(t('synchronization_error'))
          })
        } else {
          GET("/services/desktop/api/get-balance-product-list/" + cashbox.posId + "/" + cashbox.defaultCurrency).then(response => {
            window.electron.dbApi.deleteProducts()
            window.electron.dbApi.insertProducts(response).catch(e => { toast.error(e) })
            dispatch(SET_PRODUCTS_FROM_DB(Math.floor(Math.random() * 999999)))
            toast.info(t('all_products_synchronized'))
          })
        }
      })
    } else {
      toast.error(t('no_internet_connection'))
    }
  }

  useEffect(() => {
    window.addEventListener('online', toggleInternetListener)
    window.addEventListener('offline', toggleInternetListener)

    return () => {
      window.removeEventListener('online', toggleInternetListener)
      window.removeEventListener('offline', toggleInternetListener)
    }
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const [notifications, setNotifications] = useState([]);

  //   const handleToggle = (title) => {
  //     setNotifications((prevNotifications) =>
  //         prevNotifications.map((item) => ({
  //             ...item,
  //             show: item.title === title ? !item.show : false // Faqat bosilgan title ochiladi
  //         }))
  //     );
  // };


  const getImportanceStyle = (priority) => {
    if (priority >= 1 && priority <= 2) {
      return { backgroundColor: "#FFB9C9", color: "black" }; // Och qizil (Critical)
    } else if (priority >= 3 && priority <= 4) {
      return { backgroundColor: "#FFD8A8", color: "black" }; // Och to'q sariq (High)
    } else if (priority >= 5 && priority <= 6) {
      return { backgroundColor: "#FFEE99", color: "black" }; // Och sariq (Medium)
    } else if (priority >= 7 && priority <= 8) {
      return { backgroundColor: "#B9F6CA", color: "black" }; // Och yashil (Low)
    } else if (priority >= 9 && priority <= 10) {
      return { backgroundColor: "#B3E5FC", color: "black" }; // Och moviy (Very Low)
    } else {
      return { backgroundColor: "#F0F0F0", color: "black" }; // Default (engil kulrang)
    }
  };




  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(20);
      setTimeout(() => setRotation(-20), 100);
      setTimeout(() => setRotation(0), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    //APIGA SO'ROV YUBORISH UCHUN HAR BELGILANGAN VAQT ORALIGIDA BORADI KELGAN OZGARISHNI LOCALGA SAQLAYDI 
    // AGAR LOCALDAGILAR BILAN APIDAN KELGAN LENGTH BIRXIL BOLMASA NOTIFICATION SOUND CHAQIRILADI 👇
    // notificationSound.play();
    let Notifies = JSON.parse(localStorage.getItem('notifications')) || []
    let readNotif = JSON.parse(localStorage.getItem('readNotifications'))
    if (readNotif) {
      setReadNotifications(readNotif)
    } else {
      localStorage.setItem('readNotifications', JSON.stringify([]));
    }
    GET("/services/desktop/api/notifications/").then(response => {
      if (response?.length > Notifies?.length) {
        notificationSound.play();
      }
      console.log(response);
      setNotifications(response);
      localStorage.setItem('notifications', JSON.stringify(response));
    })
  }, [])






  const handleNotificationClick = (priority) => {
    let readNotif = JSON.parse(localStorage.getItem('readNotifications')) || []
    if (readNotif) {
      if (!readNotif.includes(priority)) {
        localStorage.setItem('readNotifications', JSON.stringify([...readNotif, priority]));
        setReadNotifications([...readNotifications, priority]);
      }
    }
  };


  const [expDate, setExpDate] = useState('')

  useEffect(() => {
    GET("/services/desktop/api/exp-date/").then(response => {
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

  return (
    <div id="drag-region" className="titlebar  d-flex justify-content-between">
      <div className="h-100 ms-2 w-100">
        <div className="d-flex h-100 ">
          <div className="me-2 h-100 vertical-center">
            {reduxSettings?.darkTheme ? (
              <img
                src={logo_white}
                alt="logo"
                width={globalValue("projectLogoWidth")}
              />
            ) : (
              <img
                src={logo}
                alt="logo"
                width={globalValue("projectLogoWidth")}
              />
            )}
          </div>
          {Object.keys(account).length !== 0 && (
            <div className="d-flex">
              {Object.keys(cashbox).length !== 0 && (
                <div className="vertical-center titlebar-left titlebar-left-color me-2">
                  <div className="titlebar-left d-flex">
                    <div className="h-100 vertical-center">
                      ID: {cashbox.posId} ({cashbox.posName})
                    </div>
                  </div>
                  <div className="titlebar-left d-flex">
                    <div className="h-100 vertical-center">
                      {account.firstName} {account.lastName}
                    </div>
                  </div>
                </div>
              )}
              {Object.keys(cashbox).length !== 0 && (
                <div
                  id="no-drag-region"
                  className="vertical-center color-text"
                  onClick={() => setShowConfirmShiftCloseModal(true)}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-danger fz14"
                    style={{ padding: "1px 0.5rem" }}
                    tabIndex="-1"
                  >
                    {t("close_shift")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {(expDate > 0 && expDate < 8) &&
        <><style jsx>{`
          .fading-text {
            animation: fade 2s infinite;
          }

          @keyframes fade {
            0% { opacity: .50; }
            50% { opacity: 1; }
            100% { opacity: .50; }
          }
      `}</style>

          <marquee className='' behavior="" direction="" scrollamount="10">
            <p className="fs-5 ">
              
              {t('payment_date')} <span className='fading-text' style={{ color: expDate < 4 ? 'red' : "#0084ff" }}>{expDate} {t('days_away')}</span> 
            </p>
          </marquee>
        </>
      }

      

      <div id="no-drag-region" className="d-flex">
        {Object.keys(cashbox).length !== 0 && (
          <div className="vertical-center h-100">
            <div className="d-flex">
              <div>
                <div
                  className="titlebar-icon me-3 position-relative"
                  title="Notification"
                  onClick={() => setIsModalOpen(true)}
                >
                  <NotificationsActiveOutlined
                    style={{
                      width: "30px",
                      height: "30px",
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.1s ease-in-out",
                    }}
                  />
                  <span style={{ opacity: `${(notifications.length - readNotifications.length) === 0 ? '0' : '100'}` }} className="position-absolute bottom-0 start-100 translate-middle badge rounded-pill bg-danger w-75 h-75 d-flex align-items-center justify-content-center">
                    {notifications.length - readNotifications.length}
                    <span className="visually-hidden">unread messages</span>
                  </span>
                </div>

                {isModalOpen && (
                  <div
                    className="modal-overlays"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <div
                      className="modal-contents"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-headers p-4">
                        <h4>{t('notifications')}</h4>
                        <Close
                          onClick={() => setIsModalOpen(false)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                      <div className="modal-body">
                        {notifications.map((notif) => (
                          <div
                            key={notif.priority}
                            style={getImportanceStyle(notif.priority)}
                            className={`notification-item
                             ${readNotifications.includes(notif.priority)
                                ? "read"
                                : "unread"
                              }`}
                            onClick={() => handleNotificationClick(notif.priority)}
                          >
                            <h5>{notif.title}</h5>
                            <p>{notif.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <style jsx>
                  {`
                    .modal-overlays {
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      background: rgba(0, 0, 0, 0.5);
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    }
                    .modal-contents {
                      background: white;
                      padding: 5px;
                      border-radius: 10px;
                      width: 500px;
                      max-height: 400px;
                      overflow-y: auto;
                      width: 50%;
                    }
                    @media (min-width: 1024px) {
                      .modal-content {
                        width: 700px;
                      }
                    }
                    .modal-headers {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      border-bottom: 1px solid #ddd;
                      padding-bottom: 10px;
                    }
                    .notification-item {
                      padding: 10px;
                      margin-bottom: 10px;
                      border: 1px solid #ccc;
                      border-radius: 5px;
                      cursor: pointer;
                    }
                    .notification-item.important {
                      background-color: #ffe5e5;
                      border-color: #ff0000;
                    }
                    .notification-item.unread {
                      font-weight: bold;
                    }
                    .notification-item.read {
                      opacity: 0.6;
                    }
                  `}
                </style>
              </div>


              {internetConnection === 0 && (
                <div
                  className="titlebar-icon-wifi me-3"
                  title={t("internet_state")}
                  onClick={() => toggleInternet(2)}
                >
                  <WifiOutlined />
                </div>
              )}
              {internetConnection === 1 && (
                <div
                  className="titlebar-icon-wifi me-3"
                  title={t("internet_state")}
                  onClick={() => toggleInternet(2)}
                >
                  <WifiOutlined />
                </div>
              )}
              {internetConnection === 2 && (
                <div
                  className="titlebar-icon-danger me-3 text-danger"
                  title={t("internet_state")}
                  onClick={() => toggleInternet(1)}
                >
                  <WifiLockOutlined />
                </div>
              )}
              {reduxSettings?.CashRegMoney && (
                <div
                  className="titlebar-icon me-3"
                  title="Kassadagi pul"
                  onClick={() => setOpenCashModal(true)}
                >
                  <Money />
                </div>
              )}

              <div
                className="titlebar-icon me-3"
                title="AnyDesk"
                onClick={() => openRemoteAccess("anydesk")}
              >
                <ComputerOutlined />
              </div>
              <div
                className="titlebar-icon me-3"
                title={t("x_report")}
                onClick={getXReport}
              >
                <TimelineOutlined />
              </div>
              <div
                className="titlebar-icon me-3"
                title={t("settlement_with_debtors")}
                onClick={() => getDebtorsShowModal()}
              >
                <CreditCardOutlined />
              </div>
              <div
                className="titlebar-icon me-3"
                title={t("expenses")}
                onClick={() => toggleExpenseModal(true)}
              >
                <MonetizationOnOutlined />
              </div>
              <div
                className="titlebar-icon me-3"
                title={t("synchronization")}
                onClick={syncCheques}
              >
                <CachedOutlined />
              </div>
              {!lockScreen && (
                <div
                  className="titlebar-icon me-3"
                  title={t("block_cashbox")}
                  onClick={setLockScreen}
                >
                  <LockOpenOutlined />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="vertical-center h-100">
          <ul>
            <li className="vertical-center" onClick={windowMinimize}>
              <div className="text-center">
                <RemoveOutlined />
              </div>
            </li>
            <li className="vertical-center" onClick={windowMaximize}>
              <div className="text-center">
                <StopOutlined />
              </div>
            </li>
            <li className="vertical-center last-child" onClick={windowClose}>
              <div className="text-center">
                <CloseOutlined />
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* X REPORT MODAL */}
      <Modal
        dialogClassName="x-report-modal-width"
        show={showXReportModal}
        centered
        onHide={() => setShowXReportModal(false)}
      >
        <Modal.Body>
          <div className="d-flex justify-content-center">
            <div className="d-flex flex-column">
              <div className="d-flex justify-content-center">
                <img
                  src={logo}
                  width={
                    reduxSettings?.chequeLogoWidth
                      ? reduxSettings?.chequeLogoWidth
                      : 128
                  }
                  height={
                    reduxSettings?.chequeLogoHeight
                      ? reduxSettings?.chequeLogoHeight
                      : ""
                  }
                  alt="logo"
                />
              </div>
              <h6 className="text-center fw-500 text-uppercase">
                {t("x_report")}
              </h6>
              <h6 className="text-center fw-500">{data.posName}</h6>
              <h6 className="text-center fw-500">
                {t("phone")}: {cashbox.posPhone}
              </h6>
            </div>
          </div>
          <div className="mb-2 fz14">
            <div className="d-flex justify-content-between px-2">
              <p>{t("cashier")}</p>
              <p>{data.cashierName}</p>
            </div>
            <div className="d-flex justify-content-between px-2">
              <p>{t("cashbox")} №</p>
              <p>{data.shiftNumber}</p>
            </div>
            {cashbox.tin && (
              <div className="d-flex justify-content-between px-2">
                <p className="text-uppercase">{t("inn")}</p>
                <p>{cashbox.tin}</p>
              </div>
            )}
            <div className="d-flex justify-content-between px-2">
              <p>{t("date")}</p>
              <p>{formatDateWithTime(data.shiftOpenDate)}</p>
            </div>
            {data.saleAmountList?.length > 0 &&
              data.saleAmountList.map((item, index) => (
                <div className="px-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <span>{t("sales_amount")}</span>({item.currencyName})
                    </div>
                    <div className="text-nowrap">
                      {formatMoney(item.balance)}
                    </div>
                  </div>
                </div>
              ))}
            {data.xReportList?.length > 0 && (
              <div className="overflow-hidden px-2">
                *****************************************************************************
              </div>
            )}
            {data.xReportList?.length > 0 &&
              data.xReportList.map((item, index) => (
                <div className="px-2" key={index}>
                  {item.amountIn !== 0 && (
                    <div className="d-flex justify-content-between">
                      <div>
                        {item.paymentTypeName} {item.paymentPurposeName}
                        <span> {t("income")} </span>({item.currencyName})
                      </div>
                      <div className="text-nowrap">
                        {formatMoney(item.amountIn)}
                      </div>
                    </div>
                  )}

                  {item.amountOut !== 0 && (
                    <div className="d-flex justify-content-between">
                      <div>
                        {item.paymentTypeName} {item.paymentPurposeName}
                        <span> {t("expense")} </span>({item.currencyName})
                      </div>
                      <div className="text-nowrap">
                        {formatMoney(item.amountOut)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            <div className="overflow-hidden px-2">
              *****************************************************************************
            </div>
            {data.debtList?.length > 0 &&
              data.debtList.map((item, index) => (
                <div className="px-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <span>{t("sold_on_credit")}</span>({item.currencyName})
                    </div>
                    <div className="text-nowrap">
                      {formatMoney(item.balance)}
                    </div>
                  </div>
                </div>
              ))}
            {data.discountList?.length > 0 &&
              data.discountList.map((item, index) => (
                <div className="px-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <span>{t("discount_amount")}</span>({item.currencyName})
                    </div>
                    <div className="text-nowrap">
                      {formatMoney(item.balance)}
                    </div>
                  </div>
                </div>
              ))}
            <div className="overflow-hidden px-2">
              *****************************************************************************
            </div>
            {data.balanceList?.length > 0 &&
              data.balanceList.map((item, index) => (
                <div className="px-2" key={index}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <span>{t("cashbox_balance")}</span>({item.currencyName})
                    </div>
                    <div className="text-nowrap">
                      {formatMoney(item.balance)}
                    </div>
                  </div>
                </div>
              ))}
            <div className="overflow-hidden px-2">
              *****************************************************************************
            </div>
            <div className="d-flex justify-content-between px-2">
              <p className="text-uppercase">{t("number_of_x_reports")}</p>
              <p>{data.countRequest}</p>
            </div>
          </div>

          <div className="w-100 d-flex justify-content-center">
            <button
              className="btn btn-primary w-100"
              onClick={() => setShowXReportModal(false)}
            >
              {t("ok")}
            </button>
          </div>
        </Modal.Body>
      </Modal>
      {/* X REPORT MODAL */}

      {/* DEBTOR MODAL */}
      <Modal
        show={showDebtorsModal}
        animation={false}
        centered
        dialogClassName="payment-modal-width"
        onHide={() => closeDebtorsModal()}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => closeDebtorsModal()}
          >
            <CloseOutlined />
          </div>
          <div className="payment-tab-body">
            <div className="form-group position-relative">
              <DebounceInput
                className="custom-input mb-3"
                placeholder={t("search_by_contacts")}
                debounceTimeout={300}
                value={contactSearchInput}
                inputRef={contactSearchRef}
                onChange={(e) => {
                  searchDebtor(e.target.value);
                }}
              />
              <div className="table-action-button table-action-primary-button input-add-icon">
                <span onClick={() => setShowAddClientModal(true)}>
                  <AddOutlined />
                </span>
              </div>
            </div>
            <div className="debtor-table-height">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("contact")}</th>
                    <th className="text-center">{t("currency")}</th>
                    <th className="text-end">{t("debt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map((item, index) => (
                    <tr
                      className={
                        "cashbox-table-bg-on-hover cursor " +
                        (item.selected === true ? "cashbox-table-active" : "")
                      }
                      key={index}
                      onClick={() =>
                        selectDebtorClient(item.clientId, item.currencyId)
                      }
                    >
                      <td>{item.clientName}</td>
                      <td className="text-center">{item.currencyName}</td>
                      <td className="text-end">{formatMoney(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-100">
              <div className="form-group position-relative">
                <label className="color-a2">{t("cash")}</label>
                <input
                  type="text"
                  placeholder={
                    formatMoney(0) +
                    " " +
                    (cashbox.defaultCurrency === 2 ? "USD" : t("sum"))
                  }
                  className="custom-input"
                  value={
                    transactionsListCash.amountIn
                      ? formatMoneyInput(transactionsListCash.amountIn)
                      : ""
                  }
                  onChange={(e) =>
                    setTransactionsListCash({
                      ...transactionsListCash,
                      amountIn: e.target.value.replace(/[^0-9.]/g, ""),
                    })
                  }
                />
                <span className="input-inner-icon">
                  <img src={money} width={25} alt="money" />
                </span>
              </div>
              <div className="form-group position-relative">
                <label className="color-a2">{t("bank_card")}</label>
                <input
                  type="text"
                  placeholder={
                    formatMoney(0) +
                    " " +
                    (cashbox.defaultCurrency === 2 ? "USD" : t("sum"))
                  }
                  className="custom-input"
                  value={
                    transactionsListTerminal.amountIn
                      ? formatMoneyInput(transactionsListTerminal.amountIn)
                      : ""
                  }
                  onChange={(e) =>
                    setTransactionsListTerminal({
                      ...transactionsListTerminal,
                      amountIn: e.target.value.replace(/[^0-9.]/g, ""),
                    })
                  }
                />
                <span className="input-inner-icon">
                  <img src={creditCard} width={25} alt="credit-card" />
                </span>
              </div>
              <div className="form-group">
                <label className="color-a2">{t("note")}</label>
                <input
                  type="text"
                  className="custom-input"
                  value={debtorNote}
                  onChange={(e) => setDebtorNote(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary w-100 text-uppercase"
                onClick={() => createClientDebt("in")}
                disabled={
                  transactionsListCash.amountIn.length === 0 &&
                  transactionsListTerminal.amountIn.length === 0
                }
              >
                {t("to_accept")}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* DEBTOR MODAL */}

      {/* CASH REGISTER MONEY MODAL */}
      <Modal
        show={OpenCashModal}
        animation={false}
        centered
        dialogClassName="modal-width"
        onHide={() => closeKassaModal()}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => closeKassaModal()}
          >
            <CloseOutlined />
          </div>
          <form onSubmit={(e) => createCashMoney(e)} className="w-100">
            <div className="form-group position-relative">
              <label className="color-a2">{"Kassaga qaytim qo'shish"}</label>
              <input
                type="text"
                placeholder={
                  formatMoney(0) +
                  " " +
                  (cashbox.defaultCurrencyName === "USD" ? "USD" : t("sum"))
                }
                className="custom-input"
                // value={debtorOut.amountOut ? formatMoneyInput(debtorOut.amountOut) : ''}
                value={formatMoneyInput(CashAmount)}
                onChange={(e) =>
                  setCashAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
              />
              <span className="input-inner-icon">
                <img src={money} width={25} alt="money" />
              </span>
            </div>
            <div className="d-flex  my-3 justify-content-between w-100px ">
              <label className="color-a2 ">{"Kassadan pul olish"}</label>
              <input
                type="checkbox"
                className="ios-switch light"
                checked={RecievedMoneyStatus}
                onChange={(e) => setRecievedMoneyStatus(e.target.checked)}
              />
            </div>

            {RecievedMoneyStatus && (
              <>
                <div className="form-group position-relative">
                  <label className="color-a2">{"Olingan pul"}</label>
                  <input
                    type="text"
                    placeholder={
                      formatMoney(0) +
                      " " +
                      (cashbox.defaultCurrencyName === "USD" ? "USD" : t("sum"))
                    }
                    className="custom-input"
                    value={formatMoneyInput(RecievedMoney)}
                    onChange={(e) =>
                      setRecievedMoney(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                  />
                  <span className="input-inner-icon">
                    <img src={money} width={25} alt="money" />
                  </span>
                </div>
                <div className="form-group">
                  <label className="color-a2 text-uppercase">{t("note")}</label>
                  <textarea
                    className="custom-input "
                    placeholder={t("note")}
                    rows={2}
                    onChange={(e) =>
                      setDebtorOut({ ...debtorOut, note: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={CashAmount.length === 0}
            >
              {t("save")}
            </button>
          </form>
        </Modal.Body>
      </Modal>
      {/* CASH REGISTER MONEY MODAL */}

      {/* NOTIFICAION MODAL */}
      {/* <Modal
        show={OpenNotifModal}
        animation={false}
        centered
        dialogClassName="payment-modal-width"
        onHide={() => closeNotificationModal()}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => closeNotificationModal()}
          >
            <CloseOutlined />
          </div>
          <div className="accordion" id="accordionExample">
            {notifications.map((item) => (
              <div className="accordion-item" key={item.id}>
                <h2 className="accordion-header" id={`heading${item.id}`}>
                  <button
                    className={`accordion-button ${getImportanceClass(
                      item.importance
                    )} custom-button`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${item.id}`}
                    aria-expanded={item.show}
                    aria-controls={`collapse${item.id}`}
                    // onClick={() => handleToggle(item.id)}
                  >
                    <strong className="custom-text">{item.title}</strong>
                  </button>
                </h2>
                <div
                  id={`collapse${item.priority}`}
                  className={`accordion-collapse collapse ${
                    item.show ? "show" : ""
                  }`}
                  aria-labelledby={`heading${item.priority}`}
                  data-bs-parent="#accordionExample"
                >
                  <div className="accordion-body custom-body">
                    {item.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal> */}
      {/* NOTIFICAION MODAL */}

      {/* EXPENSES MODAL */}
      <Modal
        show={showExpensesModal}
        animation={false}
        centered
        dialogClassName="payment-modal-width"
        onHide={() => closeExpensesModal()}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => closeExpensesModal()}
          >
            <CloseOutlined />
          </div>
          <form onSubmit={(e) => createDebtorOut(e)} className="w-100">
            <div className="form-group">
              <label className="color-a2">{t("expense_type")}</label>
              <select
                className="form-select"
                onChange={(e) =>
                  setDebtorOut({ ...debtorOut, expenseId: e.target.value })
                }
              >
                {expenses.map((item, index) => (
                  <option value={item.id} key={index}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">
                {t("cash")} ({cashbox.defaultCurrency === 2 ? "USD" : t("sum")})
              </label>
              <input
                type="text"
                placeholder={
                  formatMoney(0) +
                  " " +
                  (cashbox.defaultCurrency === 2 ? "USD" : t("sum"))
                }
                className="custom-input"
                value={
                  debtorOut.amountOut
                    ? formatMoneyInput(debtorOut.amountOut)
                    : ""
                }
                onChange={(e) =>
                  setDebtorOut({
                    ...debtorOut,
                    amountOut: e.target.value.replace(/[^0-9.]/g, ""),
                  })
                }
              />
              <span className="input-inner-icon">
                <img src={money} width={25} alt="money" />
              </span>
            </div>
            <div className="form-group">
              <label className="color-a2 text-uppercase">{t("note")}</label>
              <textarea
                className="custom-input "
                placeholder={t("note")}
                rows={2}
                onChange={(e) =>
                  setDebtorOut({ ...debtorOut, note: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={debtorOut.amountOut.length === 0}
            >
              {t("to_accept")}
            </button>
          </form>
        </Modal.Body>
      </Modal>
      {/* EXPENSES MODAL */}

      <Modal
        show={showAddClientModal}
        animation={false}
        centered
        dialogClassName="debtors-modal-width"
        onHide={() => setShowAddClientModal(false)}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => setShowAddClientModal(false)}
          >
            <CloseOutlined />
          </div>
          <div className="w-100">
            <div className="form-group position-relative">
              <label className="color-a2">{t("name2")}</label>
              <input
                className="custom-input "
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
              />
              <span className="input-inner-icon">
                <AccountBoxOutlined style={{ color: "a2a2a2" }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t("phone")}</label>
              <input
                type="number"
                className="custom-input "
                value={client.phone1}
                onChange={(e) =>
                  setClient({ ...client, phone1: e.target.value })
                }
              />
              <span className="input-inner-icon">
                <PhoneOutlined style={{ color: "a2a2a2" }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t("phone")}</label>
              <input
                type="number"
                className="custom-input "
                value={client.phone2}
                onChange={(e) =>
                  setClient({ ...client, phone2: e.target.value })
                }
              />
              <span className="input-inner-icon">
                <PhoneOutlined style={{ color: "a2a2a2" }} />
              </span>
            </div>
            <div className="form-group position-relative">
              <label className="color-a2">{t("comment")}</label>
              <input
                className="custom-input "
                value={client.comment}
                onChange={(e) =>
                  setClient({ ...client, comment: e.target.value })
                }
              />
              <span className="input-inner-icon">
                <ChatBubbleOutline style={{ color: "a2a2a2" }} />
              </span>
            </div>
            <button className="btn btn-primary w-100" onClick={createClient}>
              {t("save")}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* CONFIRM CLOSE SHIFT MODAL */}
      <Modal
        show={showConfirmShiftCloseModal}
        animation={false}
        centered
        dialogClassName="payment-terminal-modal-width"
        onHide={() => setShowConfirmShiftCloseModal(false)}
      >
        <Modal.Body>
          <div
            className="modal-custom-close-button"
            onClick={() => setShowConfirmShiftCloseModal(false)}
          >
            <CloseOutlined />
          </div>
          <div className="payment-tab-body">
            <div className="w-75 m0-auto">
              <form onSubmit={(e) => closeShift(e)}>
                <h2 className="color-62 text-center">
                  <b>{t("attention")}</b>
                </h2>
                <h5 className="color-62 my-3">
                  <b>{t("close_shift")}?</b>
                </h5>
                <div className="d-flex">
                  <button
                    type="button"
                    className="btn btn-danger w-100 me-4"
                    onClick={() => setShowConfirmShiftCloseModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    id="confirmButton"
                    className="btn btn-primary w-100"
                  >
                    {t("ok")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* CONFIRM CLOSE SHIFT MODAL */}

      {/* PRINT X Z REPORT */}
      <div
        className={
          "main d-none " +
          (reduxSettings?.checkPrintWidth === "58" ? "w58mm" : "w80mm")
        }
        ref={printChequeRef}
      >
        <div className="d-flex justify-content-center w-100 mt-3 mb-2">
          <div className="d-flex flex-column w-100">
            <div className="d-flex justify-content-center mb-1">
              <div className="d-flex">
                {reduxSettings?.logoPath ? (
                  <img
                    src={reduxSettings?.logoPath}
                    width={
                      reduxSettings?.chequeLogoWidth
                        ? reduxSettings?.chequeLogoWidth
                        : 128
                    }
                    height={
                      reduxSettings?.chequeLogoHeight
                        ? reduxSettings?.chequeLogoHeight
                        : ""
                    }
                    alt="logo"
                  />
                ) : (
                  <>
                    <img
                      src={logo}
                      width={
                        reduxSettings?.chequeLogoWidth
                          ? reduxSettings?.chequeLogoWidth
                          : 128
                      }
                      height={
                        reduxSettings?.chequeLogoHeight
                          ? reduxSettings?.chequeLogoHeight
                          : ""
                      }
                      alt="logo"
                    />
                  </>
                )}
              </div>
            </div>
            <h4 className="text-center text-uppercase">
              {reportType ? (
                <span>X {t("report")}</span>
              ) : (
                <span>Z {t("report")}</span>
              )}
            </h4>
            <h4 className="text-center">{cashbox.posName}</h4>
            <h4 className="text-center">
              {t("phone")}: {cashbox.posPhone}
            </h4>
          </div>
        </div>
        <div className="mb-2 fz12">
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("cashier")}</p>
            <p>{data.cashierName}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("cashbox")} №</p>
            <p>{data.shiftNumber}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("inn")}</p>
            <p>{cashbox.tin}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("date")}</p>
            <p>{formatDateWithTime(data.shiftOpenDate)}</p>
          </div>
          {data.xReportList?.length > 0 && (
            <div className="overflow-hidden">
              ****************************************************************************************************
            </div>
          )}
          {data.xReportList?.length > 0 &&
            data.xReportList.map((item, index) => (
              <div className=" px-2" key={index}>
                {item.amountIn !== 0 && (
                  <>
                    <div className="d-flex justify-content-between">
                      <div>
                        {item.paymentTypeName} {item.paymentPurposeName}
                        <span> {t("income")} </span>({item.currencyName})
                      </div>
                      <div className="text-nowrap">
                        {formatMoney(item.amountIn)}
                      </div>
                    </div>
                  </>
                )}
                {item.amountOut !== 0 && (
                  <>
                    <div className="d-flex justify-content-between">
                      <div>
                        {item.paymentTypeName} {item.paymentPurposeName}
                        <span> {t("expense")} </span>({item.currencyName})
                      </div>
                      <div className="text-nowrap">
                        {formatMoney(item.amountOut)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          <div className="overflow-hidden">
            ****************************************************************************************************
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("sold_on_credit")}</p>
            <p>{formatMoney(data.debt)}</p>
          </div>
          {/* <div className="d-flex justify-content-between px-2">
						<p>{t('number_of_checks')} Loyalty</p>
						<p>{data.countLoyalty}</p>
					</div> */}
          <div className="d-flex justify-content-between px-2">
            <p>{t("discount_amount")}</p>
            <p>{data.discountAmount}</p>
          </div>
          <div className="overflow-hidden">
            ****************************************************************************************************
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("cashbox_balance")}</p>
            <p>{data.cashboxTotalAmount}</p>
          </div>
          {
            reduxSettings?.CashRegMoney && <>
              <div className="d-flex justify-content-between px-2">
                <p>{'Kassadagi qaytim'}</p>
                <p>{formatMoney(localStorage.getItem('cashAmount'))}</p>
              </div>
              <div className="d-flex justify-content-between px-2">
                <p>{'Kassadan olingan pul'}</p>
                <p>{formatMoney(0)}</p>
              </div>
            </>
          }
          <div className="overflow-hidden">
            ****************************************************************************************************
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p className="text-uppercase">{t("number_of_x_reports")}</p>
            <p>{data.countRequest}</p>
          </div>
          <div className="overflow-hidden">
            ****************************************************************************************************
          </div>
          {reduxSettings?.ofd && (
            <>
              <div className="d-flex justify-content-between px-2 mb-1">
                <p className="text-nowrap">{t("applet_version")}</p>
                <p className="text-end">{data.AppletVersion}</p>
              </div>
              <div className="d-flex justify-content-between px-2 mb-1">
                <p className="text-nowrap">{t("unsent_report_count")}</p>
                <p className="text-end">{data.UnsentZReportsCount}</p>
              </div>
              <div className="d-flex justify-content-between px-2 mb-1">
                <p className="text-nowrap">{t("errors")}</p>
                <p className="text-end">{data.ErrorsCount}</p>
              </div>
              <div className="d-flex justify-content-between px-2 mb-1">
                <p className="text-nowrap">{t("await_send_report")}</p>
                <p className="text-end">{data.AwaitingToSendZReportsCount}</p>
              </div>
            </>
          )}
        </div>
      </div>
      {/* PRINT X Z REPORT */}

      {/* PRINT DEBTOR CHEQUE */}
      <div
        className={
          "main d-none " +
          (reduxSettings?.checkPrintWidth === "58" ? "w58mm" : "w80mm")
        }
        ref={printDebtorChequeRef}
      >
        <div className="overflow-hidden">
          ****************************************************************************************************
        </div>
        <div className="mt-3 mb-3 fz12">
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("date")}</p>
            <p>{debtorChequeData.date}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("debtor")}</p>
            <p>{debtorChequeData.name}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>
              {t("payed")} ({debtorChequeData.currencyName})
            </p>
            <p>{formatMoney(debtorChequeData.payed)}</p>
          </div>
          <div className="d-flex justify-content-between px-2 mb-1">
            <p>{t("balance")}</p>
            <p>{formatMoney(debtorChequeData.balance)}</p>
          </div>
        </div>
        <div className="overflow-hidden">
          ****************************************************************************************************
        </div>
      </div>
      {/* PRINT DEBTOR CHEQUE */}
    </div>
  );
}

export default Titlebar
