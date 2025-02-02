import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { CancelOutlined } from '@material-ui/icons'
import { Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import axios from 'axios'
//import Barcode from 'react-barcode';
//import QRCode from "react-qr-code";

import { SET_SETTINGS } from 'store/actions/settings'
import { POST, globalValue } from 'api/api'

import Lottie from 'react-lottie-player'
import lottieJson from './loader.json'

function Settings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reduxSettings = useSelector(state => state.settings.settings)

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  //const [downloadStarted, setDownloadStarted] = useState(false);
  const [lottieConfig, setLottieConfig] = useState({ 'play': false });
  const [downloadDetail, setDownloadDetail] = useState({
    message: t('checking_update_and_connection'),
    updateExist: null,
    speed: 0,
    percentage: 0,
    downloaded: 0,
    needDownload: 0,
  });
  const [printersList, setPrintersList] = useState([])
  const [settings, setSettings] = useState({
    'logoPath': "",
    'autoSync': true,
    //'hidePriceInCheque': false, изза офд чек структура поменялось хочу удалить
    'chooseClient': false,
    'showCashPaymentF1': true,
    'showTerminalPaymentF2': true,
    'showConfirmModalDeleteItem': true,
    'showConfirmModalDeleteAllItems': true,
    'xReport': false,
    'decimalPoint': 2,
    'barcodeFormat': 5,
    'weightPrefix': 20,
    'piecePrefix': 21,
    'finalPrefix': 25,
    'printerBroken': false,
    'printTo': false,
    'receiptPrinter': false,
    'priceTagPrinter': false,
    'checkPrintWidth': "80",
    'showRecommendation': false,
    'additionalInformation': false,
    'additionalInformationText': "",
    'showNumberOfProducts': false,
    'productGrouping': false,
    'print2cheques': false,
    'darkTheme': false,
    'openExcelFile': false,
    'showLastScannedProduct': false,
    'showProductOutOfStock': false,
    'chequeLogoWidth': 128,
    'chequeLogoHeight': "",
    'selectClientOnSale': false,
    'selectOrganizationOnSale': false,
    'selectAgentOnSale': false,
    'advancedSearchMode': false,
    'amountExceedsLimit': false,
    'showQrCode': false,
    'showBarcode': true,
    'showFullProductName': false,
    'printReturnCheque': false,
    'humoTerminal': false,
    'ofd': false,
    'ofdFactoryId': '',
    'showFastPayButtons': false,
    'organizationDebtButton': false,
    'selectBottomSearch': false,
    'postponeOnline': false,
    'postponeOffline': false,
    'chequeCopy': false,
    'chequeCopyExcel': false,
    'searchExact': false,
    'leaveBottomSearchText': false,
    'CashRegMoney': false,
  })

  const checkUpdateExist = () => {
    var version = window.electron.ipcRenderer.sendSync('app-version')

    axios.get(`${globalValue('url')}/services/admin/api/get-version?name=${globalValue('projectId')}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => {
      if (version < response.data.version) {
        window.electron.appApi.checkUpdate()
        setShowUpdateModal(true)
      } else {
        toast.info(t('latest_version'))
      }
    })
  }

  function saveSettings() {
    var sendData = {
      'settings': JSON.stringify(settings)
    }
    POST("/services/desktop/api/user-settings", sendData).then(() => {
      dispatch(SET_SETTINGS(settings))
      toast.success(t('saved_successfully'))
    })
  }

  function getPrintersList() {
    setPrintersList(window.electron.ipcRenderer.sendSync('getPrintersList'))
  }

  const uploadImage = (e) => {
    var file = e.target.files[0]
    var reader = new FileReader();
    reader.onloadend = function () {
      window.electron.appApi.uploadImageToLocalDisk(reader.result, settings.logoPath).then(response => {
        var str = response
        if (str) {
          setSettings({ ...settings, 'logoPath': str })
        } else {
          console.log('error');
        }
      })
    }
    reader.readAsDataURL(file)
  }

  function themeController(value) {
    if (value) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  useEffect(() => {
    getPrintersList()
    var reduxSettingsCopy = { ...reduxSettings }
    setSettings(reduxSettingsCopy)
  }, [reduxSettings])

  useEffect(() => {
    window.electron.receive("fromMain", (data) => {
      if (data.updateExist) {
        setLottieConfig({ ...lottieConfig, 'play': true })
      }
      if (data.updateExist === 5) { // if download finished
        setShowUpdateModal(false)
      }
      setDownloadDetail(data)
    });
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="pt-40 relative">
        <div className="h-table-settings pr-2 mb-1">
          <div className="py-1">
            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('updating')}</h6>
                  </div>
                  <div className="vertical-center" onClick={checkUpdateExist}>
                    <div className="btn btn-primary">
                      {t('update')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('logo')}</h6>
                    <span className="fz14 ms-3">{t('setting_text1')}</span>
                  </div>
                  <div className="vertical-center">
                    {settings.logoPath ?
                      <div className="d-flex">
                        <p>{settings.logoPath}</p>
                        <CancelOutlined className="cursor" style={{ 'color': '#dc3545' }} onClick={(e) => setSettings({ ...settings, 'logoPath': '' })} />
                      </div>
                      :
                      <div className="upload-btn-wrapper">
                        <button type="button" className="btn btn-primary">{t('upload_photo')}</button>
                        <input type="file" title={t('upload_photo')} onChange={(e) => uploadImage(e)} />
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="settings-title">1 {t('cashbox')}</h5>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.1 {t('auto_sync')}</h6>
                    <span className="fz14 ms-3">{t('setting_text2')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.autoSync}
                      onChange={(e) => setSettings({ ...settings, 'autoSync': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.2 {t('show_number_of_products')}</h6>
                    <span className="fz14 ms-3">{t('show_number_of_products_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showNumberOfProducts}
                      onChange={(e) => setSettings({ ...settings, 'showNumberOfProducts': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.3 {t('show_cash_payment_window')}</h6>
                    <span className="fz14 ms-3">{t('setting_text4')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showCashPaymentF1}
                      onChange={(e) => setSettings({ ...settings, 'showCashPaymentF1': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.4 {t('show_terminal_payment_window')}</h6>
                    <span className="fz14 ms-3">{t('setting_text14')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showTerminalPaymentF2}
                      onChange={(e) => setSettings({ ...settings, 'showTerminalPaymentF2': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.5 {t('show_confirmation_modal')}</h6>
                    <span className="fz14 ms-3">{t('setting_text15')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showConfirmModalDeleteItem}
                      onChange={(e) => setSettings({ ...settings, 'showConfirmModalDeleteItem': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.6{t('show_confirmation_modal')}</h6>
                    <span className="fz14 ms-3">{t('setting_text16')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showConfirmModalDeleteAllItems}
                      onChange={(e) => setSettings({ ...settings, 'showConfirmModalDeleteAllItems': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.7 {t('show_last_scanned_product')}</h6>
                    <span className="fz14 ms-3">{t('setting_text18')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showLastScannedProduct}
                      onChange={(e) => setSettings({ ...settings, 'showLastScannedProduct': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.8 {t('SHOW_WINDOW_BLOCKER')}</h6>
                    <span className="fz14 ms-3">{t('setting_text19')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showProductOutOfStock}
                      onChange={(e) => setSettings({ ...settings, 'showProductOutOfStock': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.9 {t('product_grouping')}</h6>
                    <span className="fz14 ms-3">{t('product_grouping_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.productGrouping}
                      onChange={(e) => setSettings({ ...settings, 'productGrouping': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.10 {t('select_client_on_sale')}</h6>
                    <span className="fz14 ms-3">{t('select_client_on_sale')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.selectClientOnSale}
                      onChange={(e) => setSettings({ ...settings, 'selectClientOnSale': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.11 {t('select_organization_on_sale')}</h6>
                    <span className="fz14 ms-3">{t('select_organization_on_sale')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.selectOrganizationOnSale}
                      onChange={(e) => setSettings({ ...settings, 'selectOrganizationOnSale': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.11.1 {t('select_agent_on_sale')}</h6>
                    <span className="fz14 ms-3">{t('select_agent_on_sale')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.selectAgentOnSale}
                      onChange={(e) => setSettings({ ...settings, 'selectAgentOnSale': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.12 {t('organization_debt_button')}</h6>
                    <span className="fz14 ms-3">{t('organization_debt_button')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.organizationDebtButton}
                      onChange={(e) => setSettings({ ...settings, 'organizationDebtButton': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.13 {t('advanced_search_mode')}</h6>
                    <span className="fz14 ms-3">{t('advanced_search_mode')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.advancedSearchMode}
                      onChange={(e) => setSettings({ ...settings, 'advancedSearchMode': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.14 {t('amount_exceeds_limit')}</h6>
                    <span className="fz14 ms-3">{t('setting_text21')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.amountExceedsLimit}
                      onChange={(e) => setSettings({ ...settings, 'amountExceedsLimit': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.15 {t('show_x_report')}</h6>
                    <span className="fz14 ms-3">{t('show_x_report')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.xReport}
                      onChange={(e) => setSettings({ ...settings, 'xReport': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.16 {t('show_fast_pay_buttons')}</h6>
                    <span className="fz14 ms-3">{t('show_fast_pay_buttons')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showFastPayButtons}
                      onChange={(e) => setSettings({ ...settings, 'showFastPayButtons': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.17 {t('select_text_search_by_name')}</h6>
                    <span className="fz14 ms-3">{t('select_text_search_by_name')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.selectBottomSearch}
                      onChange={(e) => setSettings({ ...settings, 'selectBottomSearch': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.18 {t('show_full_product_name')}</h6>
                    <span className="fz14 ms-3">{t('setting_text24')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showFullProductName}
                      onChange={(e) => setSettings({ ...settings, 'showFullProductName': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.19 {t('postpone_online')}</h6>
                    <span className="fz14 ms-3">{t('postpone_online')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.postponeOnline}
                      onChange={(e) => setSettings({
                        ...settings,
                        'postponeOnline': e.target.checked,
                        'postponeOffline': e.target.checked ? false : true,
                      })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.20 {t('postpone_offline')}</h6>
                    <span className="fz14 ms-3">{t('postpone_offline')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.postponeOffline}
                      onChange={(e) => setSettings({
                        ...settings,
                        'postponeOffline': e.target.checked,
                        'postponeOnline': e.target.checked ? false : true,
                      })} />
                  </div>
                </div>

                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.21 {t('cheque_copy')}</h6>
                    <span className="fz14 ms-3">{t('show_cheque_copy')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.chequeCopy}
                      onChange={(e) => setSettings({ ...settings, 'chequeCopy': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.22 {t('cheque_excel')}</h6>
                    <span className="fz14 ms-3">{t('show_cheque_excel')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.chequeCopyExcel}
                      onChange={(e) => setSettings({ ...settings, 'chequeCopyExcel': e.target.checked })} />
                  </div>
                </div>

                <div className="setting-block">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.23 {t('number_after_decimal_point')}</h6>
                    <span className="fz14 ms-3">{t('setting_text5')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <div className="form-group d-flex">
                      <input type="range" className="form-control-range w-100" max="3" min="0" value={settings.decimalPoint}
                        onChange={(e) => setSettings({ ...settings, 'decimalPoint': e.target.value })} />
                    </div>
                    <div className="setting-block">
                      <div>{t('example')}:</div>
                      <div>
                        {Number(settings.decimalPoint) === 0 &&
                          <>560</>
                        }
                        {Number(settings.decimalPoint) === 1 &&
                          <>560.4</>
                        }
                        {Number(settings.decimalPoint) === 2 &&
                          <>560.41</>
                        }
                        {Number(settings.decimalPoint) === 3 &&
                          <>560.416</>
                        }
                        <span className="ms-1">{t('sum')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.24 {t('exact_search')}</h6>
                    <span className="fz14 ms-3">{t('exact_search')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.searchExact}
                      onChange={(e) => setSettings({ ...settings, 'searchExact': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.25 {t('leave_select_text_search_by_name')}</h6>
                    <span className="fz14 ms-3">{t('leave_select_text_search_by_name')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.leaveBottomSearchText}
                      onChange={(e) => setSettings({ ...settings, 'leaveBottomSearchText': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">1.26 {'Kassadagi qaytimni ko\'rsatish'}</h6>
                    <span className="fz14 ms-3">{'Kassadagi qaytimni ko\'rsatish'}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.CashRegMoney}
                      onChange={(e) => setSettings({ ...settings, 'CashRegMoney': e.target.checked })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="settings-title">2 {t('libra')}</h5>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('print_on')}</h6>
                    <span className="fz14 ms-3">{t('setting_text6')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <select className="form-select" value={settings.barcodeFormat} onChange={(e) => setSettings({ ...settings, 'barcodeFormat': e.target.value })}>
                      <option value="5">Формат 7 / Format 7</option>
                      <option value="6">Формат 6 / Format 6</option>
                    </select>
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">2.1 {t('weight_prefix')}</h6>
                    <span className="fz14 ms-3">{t('setting_text7')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <input type="number" className="form-control" value={settings.weightPrefix}
                      onChange={(e) => setSettings({ ...settings, 'weightPrefix': e.target.value })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">2.2 {t('piece_prefix')}</h6>
                    <span className="fz14 ms-3">{t('setting_text8')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <input type="number" className="form-control" value={settings.piecePrefix}
                      onChange={(e) => setSettings({ ...settings, 'piecePrefix': e.target.value })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">2.3 {t('final_prefix')}</h6>
                    <span className="fz14 ms-3">{t('setting_text9')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <input type="number" className="form-control" value={settings.finalPrefix}
                      onChange={(e) => setSettings({ ...settings, 'finalPrefix': e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="settings-title">3 {t('printing')}</h5>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.1 {t('print_on')}</h6>
                    <span className="fz14 ms-3">{t('setting_text10')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <select className="form-select" value={settings.printTo} onChange={(e) => setSettings({ ...settings, 'printTo': e.target.value })}>
                      <option value="0">Принтер / Printer</option>
                      <option value="1">Microsoft Excel</option>
                    </select>
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.2 {t('receipt_printer')}</h6>
                    <span className="fz14 ms-3">{t('setting_text11')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <select className="form-select" value={settings.receiptPrinter} onChange={(e) => setSettings({ ...settings, 'receiptPrinter': e.target.value })}>
                      <option value="" disabled>Выберите</option>
                      {printersList.map((item, index) => (
                        <option value={item.name} key={index}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.3 {t('price_tag_printer')}</h6>
                    <span className="fz14 ms-3">{t('setting_text11')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <select className="form-select" value={settings.priceTagPrinter} onChange={(e) => setSettings({ ...settings, 'priceTagPrinter': e.target.value })}>
                      {printersList.map((item, index) => (
                        <option value={item.name} key={index}>{item.name}</option>
                      ))
                      }
                    </select>
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.4 {t('check_print_width')}</h6>
                    <span className="fz14 ms-3">{t('setting_text12')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <select className="form-select" value={settings.checkPrintWidth} onChange={(e) => setSettings({ ...settings, 'checkPrintWidth': e.target.value })}>
                      <option value="58" defaultValue={settings.checkPrintWidth === "60"}>58 mm</option>
                      <option value="65" defaultValue={settings.checkPrintWidth === "65"}>65 mm</option>
                      <option value="70" defaultValue={settings.checkPrintWidth === "70"}>70 mm</option>
                      <option value="75" defaultValue={settings.checkPrintWidth === "75"}>75 mm</option>
                      <option value="80" defaultValue={settings.checkPrintWidth === "80"}>80 mm</option>
                    </select>
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.5 {t('open_excel')}</h6>
                    <span className="fz14 ms-3">{t('setting_text17')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.openExcelFile}
                      disabled={!(Number(settings.printTo) === 1)}
                      onChange={(e) => setSettings({ ...settings, 'openExcelFile': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.6 {t('print_2_cheques')}</h6>
                    <span className="fz14 ms-3">{t('print_2_cheques_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.print2cheques}
                      onChange={(e) => setSettings({ ...settings, 'print2cheques': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.7 {t('printer_problems')}</h6>
                    <span className="fz14 ms-3">{t('setting_text13')}!</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.printerBroken}
                      onChange={(e) => setSettings({ ...settings, 'printerBroken': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3 d-none">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.8 {t('hide_price')}</h6>
                    <span className="fz14 ms-3">{t('setting_text3')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.hidePriceInCheque}
                      onChange={(e) => setSettings({ ...settings, 'hidePriceInCheque': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.9 {t('show_barcode')}</h6>
                    <span className="fz14 ms-3">{t('setting_text22')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showBarcode}
                      onChange={(e) => setSettings({ ...settings, 'showBarcode': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.10 {t('show_qr')}</h6>
                    <span className="fz14 ms-3">{t('setting_text23')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.showQrCode}
                      onChange={(e) => setSettings({ ...settings, 'showQrCode': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.11 {t('additional_information_in_check')}</h6>
                    <span className="fz14 ms-3">{t('additional_information_in_check')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.additionalInformation}
                      onChange={(e) => setSettings({ ...settings, 'additionalInformation': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">3.12 {t('print_return_cheque')}</h6>
                    <span className="fz14 ms-3">{t('print_2_cheques_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.printReturnCheque}
                      onChange={(e) => setSettings({ ...settings, 'printReturnCheque': e.target.checked })} />
                  </div>
                </div>
                <textarea className="w-100 form-control mb-3" rows="2" placeholder={t('enter_text')}
                  disabled={!settings.additionalInformation} value={settings.additionalInformationText}
                  onChange={(e) => setSettings({ ...settings, 'additionalInformationText': e.target.value })}>
                </textarea>
                <div className="setting-block mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('logo')}</h6>
                    <span className="fz14 ms-3">{t('setting_text20')}</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <div className="d-flex">
                      <input type="number" className="form-control me-2" value={settings.chequeLogoWidth}
                        onChange={(e) => setSettings({ ...settings, 'chequeLogoWidth': e.target.value })} />
                      <input type="number" className="form-control" value={settings.chequeLogoHeight}
                        onChange={(e) => setSettings({ ...settings, 'chequeLogoHeight': e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <h5 className="settings-title">4 {t('integration')}</h5>
                <div className="d-flex justify-content-between mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('humo_terminal')}</h6>
                    <span className="fz14 ms-3">{t('humo_terminal_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.humoTerminal}
                      onChange={(e) => setSettings({ ...settings, 'humoTerminal': e.target.checked })} />
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-3 d-non">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('ofd')}</h6>
                    <span className="fz14 ms-3">{t('ofd_text')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.ofd}
                      onChange={(e) => setSettings({ ...settings, 'ofd': e.target.checked })} />
                  </div>
                </div>
                <div className="setting-block mb-3 d-non">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">2.3 {t('ofd')}</h6>
                    <span className="fz14 ms-3">FactoryID</span>
                  </div>
                  <div className="vertical-center w-250px">
                    <input type="text" className="form-control" value={settings.ofdFactoryId}
                      onChange={(e) => setSettings({ ...settings, 'ofdFactoryId': e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <div className="vertical-center">
                    <h6 className="m-0 fw-500">{t('theme')}</h6>
                    <span className="fz14 ms-3">{t('dark_theme')}</span>
                  </div>
                  <div className="vertical-center">
                    <input type="checkbox" className="ios-switch light" checked={settings.darkTheme}
                      onChange={(e) => { setSettings({ ...settings, 'darkTheme': e.target.checked }); themeController(e.target.checked) }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <button button="submit" className="btn btn-primary text-uppercase" onClick={saveSettings}>{t('save')}</button>
        </div>
      </div>

      {/* UPDATE MODAL */}
      <Modal show={showUpdateModal} animation={false} centered dialogClassName="update-modal-width" backdrop="static" onHide={() => setShowUpdateModal(false)}>
        <Modal.Body>
          <div className="d-flex mb-3">
            <div>
              <Lottie
                loop
                play={lottieConfig.play}
                animationData={lottieJson}
                style={{ width: 200, height: 200 }}
              />
            </div>
            <div className="w-100 d-flex flex-column justify-content-between">
              <div>
                <h3 className={'text-center ' + (lottieConfig.play ? 'update-title' : '')}>{t('download')}</h3>
                <p className="text-center pre-line">
                  {t(downloadDetail.message)}
                  {downloadDetail.version &&
                    <span> {downloadDetail.version}</span>
                  }
                </p>
              </div>
              <div>
                <div className="setting-block">
                  <p className="fw-600">{t('download_speed')}</p>
                  <p>{downloadDetail.speed} мб/cек</p>
                </div>
                <div className="setting-block">
                  <p className="fw-600">{t('file_size')}</p>
                  <p>{downloadDetail.needDownload} MB</p>
                </div>
                <div className="setting-block">
                  <p className="fw-600">{t('downloaded')}</p>
                  <p>{downloadDetail.downloaded} MB</p>
                </div>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: downloadDetail.percentage + '%' }}>{downloadDetail.percentage}%</div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* UPDATE MODAL */}
    </>
  )
}

export default Settings
