import React, { useState, useEffect, useRef, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom';
import { CloseOutlined } from '@material-ui/icons';
import { Modal } from 'react-bootstrap'
import Barcode from 'react-barcode';
import QRCode from "react-qr-code";
import { toast } from 'react-toastify'
import { DebounceInput } from 'react-debounce-input';
import { ChevronLeftOutlined, DoubleArrowOutlined, KeyboardArrowDownOutlined, KeyboardArrowUpOutlined } from '@material-ui/icons';

import { GET, POST, globalValue } from 'api/api'
import { formatMoney, getUnixTime, generateTransactionId, formatUnixTime } from 'helpers/helpers'
import { O_POST } from 'api/apiOfd';

function Return() {
	const { t } = useTranslation();
	const printChequeRef = useRef(null);
	const scrollToBottomRef = useRef(null)

	//chequeDate
	let { id } = useParams();
	const cashbox = useSelector(state => state.cashbox)
	const shift = useSelector(state => state.shift)
	const reduxSettings = useSelector(state => state.settings.settings)

	const [search, setSearch] = useState("");
	const [searchProductName, setSearchProductName] = useState("");
	const [searchProducts, setSearchProducts] = useState([]);
	const [searchIndex, setSearchIndex] = useState(0);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [data, setData] = useState({ itemsList: [], transactionsList: [] });
	const [sendData, setSendData] = useState({
		actionDate: 0,
		cashboxId: cashbox.cashboxId,
		chequeId: 0,
		clientAmount: 0,
		clientId: 0,
		currencyId: "",
		saleCurrencyId: "",
		itemsList: [],
		note: "",
		offline: false,
		posId: cashbox.posId,
		shiftId: cashbox.id ? cashbox.id : shift.id,
		totalAmount: 0,
		transactionId: "",
		transactionsList: [{ "amountIn": 0, "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 3 }]
	});

	const multikassaOfd = reduxSettings?.multikassaOfd;
	var formattedMessage = ''

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
			module_operation_type: "4",
			receipt_sum: input.totalAmount * 100,
			receipt_cashier_name: localStorage.getItem("cashierName"),
			receipt_gnk_receivedcash: input.totalAmount * 100,
			receipt_gnk_receivedcard: 0,
			receipt_gnk_time: currentDateTime,
			items: items,
			RefundInfo: {
        		TerminalID: input.terminalID,
				ReceiptSeq: input.receiptSeq,
				DateTime: input.dateTime,
				FiscalSign: input.fiscalSign 
			},													
			location: {
				latitude: parseFloat(localStorage.getItem("lat")),
				longitude: parseFloat(localStorage.getItem("lon")) //"tradepoint_coordinates": "(41.2969055300243,69.25275371796873)",
			}
		}));
	}

	async function returnCheque(e) {
		if (e) e.preventDefault()

		var errorExist = false
		for (let i = 0; i < sendData.itemsList.length; i++) {
			if (sendData.itemsList[i]['quantity'] > sendData.itemsList[i]['oldQuantity'] || sendData.itemsList[i]['quantity'] <= 0) {
				errorExist = true
				toast.error(t('check_quantity'))
				break
			}
		}
		if (errorExist) {
			setShowConfirmModal(false)
			return;
		}

		var sendDataCopy = { ...sendData }
		sendDataCopy.terminalID = data.terminalID
		sendDataCopy.receiptSeq = data.receiptSeq
		sendDataCopy.dateTime = data.dateTime
		sendDataCopy.fiscalSign = data.fiscalSign
		sendDataCopy.chequeOfdType = data.chequeOfdType

		sendDataCopy.actionDate = getUnixTime()
		sendDataCopy.chequeId = data.id
		sendDataCopy.clientAmount = data.clientAmount

		sendDataCopy.clientId = data.clientId
		sendDataCopy.currencyId = data.currencyId
		sendDataCopy.saleCurrencyId = data.saleCurrencyId
		sendDataCopy.clientCurrencyId = data.clientCurrencyId
		sendDataCopy.clientCurrencyRate = data.clientCurrencyRate
		sendDataCopy.transactionId = generateTransactionId(cashbox.posId, cashbox.cashboxId, cashbox.id ? cashbox.id : shift.id)
		sendDataCopy.transactionsList[0]['amountOut'] = sendDataCopy.totalAmount
		sendDataCopy.chequeNumber = data.chequeNumber
		//console.log(sendDataCopy)

		if (reduxSettings.ofd && cashbox.ofd) {
			var responseDate = {}
			try {
				if (window.navigator.onLine) {
					responseDate = await GET("/services/desktop/api/date-helper")
				}
			} catch (error) {
				console.log('here')
			}
			sendDataCopy.dateFormat1 = responseDate?.dateFormat1

			var responseOfd = await createOfdCheque(sendDataCopy)
			sendDataCopy.fiscalResult = responseOfd?.result
			sendDataCopy.appletVersion = sendDataCopy?.fiscalResult?.AppletVersion
			sendDataCopy.dateTime = sendDataCopy?.fiscalResult?.DateTime
			sendDataCopy.fiscalSign = sendDataCopy?.fiscalResult?.FiscalSign
			sendDataCopy.receiptSeq = sendDataCopy?.fiscalResult?.ReceiptSeq
			sendDataCopy.qRCodeURL = sendDataCopy?.fiscalResult?.QRCodeURL
			sendDataCopy.terminalID = sendDataCopy?.fiscalResult?.TerminalID
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

			setSendData(sendDataCopy)
		}

		mapToMultikassa(sendDataCopy).then(mappedData => {
            if (multikassaOfd) {
                sendDataCopy.requestOfd = JSON.stringify(mappedData);

                // Step 2: Send requestOfd to the external API to get responseOfd
                return POST("http://localhost:8080/api/v1/operations",  sendDataCopy.requestOfd, false, false);

            } else {
                // Skip if multikassaOfd is false
                return null;
            }
			
        })
        .then(responseOfd => {
            if (multikassaOfd && responseOfd) {
                sendDataCopy.responseOfd = JSON.stringify(responseOfd);
				
				if(responseOfd?.success){
					sendDataCopy.chequeDate = getUnixTime()
					sendDataCopy.chequeTimeEnd = getUnixTime()
					// dataCopy.fiscalResult = responseOfd?.result
					sendDataCopy.appletVersion = responseOfd?.data?.receipt_gnk_appletversion
					sendDataCopy.dateTime = responseOfd?.data?.receipt_gnk_datetime
					sendDataCopy.fiscalSign = responseOfd?.data?.receipt_gnk_fiscalsign
					sendDataCopy.receiptSeq = responseOfd?.data?.receipt_gnk_receiptseq
					sendDataCopy.qRCodeURL = responseOfd?.data?.receipt_gnk_qrcodeurl
					sendDataCopy.terminalID = responseOfd?.data?.module_gnk_id
				}else{
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
			}

            POST("/services/desktop/api/cheque-returned", sendDataCopy).then(() => {
				if (reduxSettings?.printReturnCheque) {
					var domInString = printChequeRef.current.outerHTML
					window.electron.appApi.print(domInString, reduxSettings.receiptPrinter)
				}
	
				setData({ 'itemsList': [], 'transactionsList': [], 'cashierName': "", 'chequeNumber': "", 'chequeDate': "" })
				setSendData({
					...sendData, "actionDate": 0, "chequeId": 0, "clientAmount": 0, "clientId": 0, "currencyId": 0,
					"saleCurrencyId": 0, "totalAmount": 0, "totalAmountInfo": 0, "transactionId": 0, "itemsList": [],
					"transactionsList": [{ "amountIn": 0, "amountOut": data.totalPrice, "paymentTypeId": 1, "paymentPurposeId": 3 }]
				})
				setShowConfirmModal(false)
				toast.success(t('success'))
			})
        })

		
	}

	async function createOfdCheque(dataCopy) {
		var method = ""
		var ofdData = {}

		var responseDate
		try {
			responseDate = await GET("/services/desktop/api/date-helper")
		} catch (error) {
			return
		}

		if (Number(dataCopy.chequeOfdType) === 0) {
			method = "Api.SendRefundReceipt"

			ofdData = {
				"method": method,
				"id": 14821,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Receipt": {
						"IsRefund": 1,
						"ReceivedCash": 0,
						"ReceivedCard": 0,
						"Time": responseDate.ofdDate,
						"ReceiptType": 0,
						"RefundInfo": {
							"DateTime": dataCopy.dateTime,
							"TerminalID": dataCopy.terminalID,
							"ReceiptSeq": dataCopy.receiptSeq,
							"FiscalSign": dataCopy.fiscalSign,
						},
						"Location": {
							"Latitude": 0, //cashbox.gpsPointY,
							"Longitude": 0, //cashbox.gpsPointX,
						},
						"ExtraInfo": {
							"TIN": "",
							"PINFL": "",
							"CarNumber": "",
							"PhoneNumber": "",
						},
						"Items": [],
					},
				},
				"jsonrpc": "2.0"
			}
		}

		if (Number(dataCopy.chequeOfdType) === 1) {
			method = "Api.SendAdvanceReceipt"
			ofdData = {
				"method": method,
				"id": 14821,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Receipt": {
						"IsRefund": 1,
						"ReceivedCash": 0,
						"ReceivedCard": 0,
						"Time": responseDate.ofdDate,
						"ReceiptType": 1,
						"Location": {
							"Latitude": 0, //cashbox.gpsPointY,
							"Longitude": 0, //cashbox.gpsPointX,
						},
						"ExtraInfo": {
							"TIN": "",
							"PINFL": "",
							"CarNumber": "",
							"PhoneNumber": "",
						},
						"Items": [],
					},
				},
				"jsonrpc": "2.0"
			}
		}

		if (Number(dataCopy.chequeOfdType) === 2) {
			method = "Api.SendCreditReceipt"
			ofdData = {
				"method": method,
				"id": 14821,
				"params": {
					"FactoryID": reduxSettings.ofdFactoryId,
					"Receipt": {
						"IsRefund": 1,
						"ReceivedCash": 0,
						"ReceivedCard": 0,
						"Time": responseDate.ofdDate,
						"ReceiptType": 2,
						"Location": {
							"Latitude": 0, //cashbox.gpsPointY,
							"Longitude": 0, //cashbox.gpsPointX,
						},
						"ExtraInfo": {
							"TIN": "",
							"PINFL": "",
							"CarNumber": "",
							"PhoneNumber": "",
						},
						"Items": [],
					},
				},
				"jsonrpc": "2.0"
			}
		}

		var cash = 0
		var terminal = 0
		for (let i = 0; i < dataCopy.itemsList.length; i++) {
			var vat = 0;
			var discountAmount = 0;
			cash += (dataCopy.itemsList[i]['quantity'] * dataCopy.itemsList[i]['salePrice'])

			if (dataCopy.itemsList[i]['discountAmount']) {
				vat = Number(dataCopy.itemsList[i]['totalPrice'] - dataCopy.itemsList[i]['discountAmount']) /
					(100 + Number(dataCopy.itemsList[i]['vat'])) *
					Number(dataCopy.itemsList[i]['vat'])
			} else {
				vat = Number(dataCopy.itemsList[i]['totalPrice']) /
					(100 + Number(dataCopy.itemsList[i]['vat'])) *
					Number(dataCopy.itemsList[i]['vat'])
			}

			ofdData.params.Receipt.Items.push(
				{
					"SPIC": dataCopy.itemsList[i]['gtin'], // Уникальный номер в едином каталоге
					"VAT": Number(vat.toFixed(0) * 100) ?? 0,
					"VATPercent": Number(dataCopy.itemsList[i]['vat']) ?? 0,
					"Discount": Number(discountAmount.toFixed(0)) * 100,
					"Price": Number(dataCopy.itemsList[i]['salePrice']) * 100,
					"Barcode": dataCopy.itemsList[i]['barcode'],
					"Amount": dataCopy.itemsList[i]['quantity'] * 1000,
					"Label": dataCopy.itemsList[i]['markingNumber'] ?? "", // маркированные товары сигареты
					"Units": dataCopy.itemsList[i]['ofdUomId'],
					"PackageCode": dataCopy.itemsList[i]['packageCode'],
					"Name": dataCopy.itemsList[i]['productName'],
					"Other": 0,
					"CommissionInfo": { "PINFL": "" },
					"ExtraInfo": { "QRPaymentID": "", "QRPaymentProvider": "", "PhoneNumber": "" },
				},
			)
		}

		ofdData.params.Receipt.ReceivedCash = cash * 100
		ofdData.params.Receipt.ReceivedCard = terminal * 100

		const response = await O_POST(ofdData)
		return response
	}

	function searchChequeByNumber(e, id) {
		if (e)
			e.preventDefault();

		var url = `/services/desktop/api/cheque-byNumber/${search}/${cashbox.posId}`
		if (id) {
			url = `/services/desktop/api/cheque-byNumber/${id}/${cashbox.posId}`
		}
		GET(url).then(response => {
			if (response.id) {
				setData(response)
				setSendData({
					actionDate: 0,
					cashboxId: cashbox.cashboxId,
					chequeId: 0,
					clientAmount: 0,
					clientId: 0,
					currencyId: "",
					saleCurrencyId: "",
					itemsList: [],
					note: "",
					offline: false,
					posId: cashbox.posId,
					shiftId: cashbox.id ? cashbox.id : shift.id,
					totalAmount: 0,
					transactionId: "",
					transactionsList: [{ "amountIn": 0, "amountOut": 0, "paymentTypeId": 1, "paymentPurposeId": 3 }]
				})
				setSearch("")
			} else {
				toast.error(t('check_not_found'))
			}
		})
	}

	function addToList(index) {
		var dataCopy = { ...data }

		var productIdForFocus = dataCopy.itemsList[index]['productId'].toString()

		if (dataCopy.itemsList[index]['returned'] === 0) {
			dataCopy.itemsList[index]['initialQuantity'] = dataCopy.itemsList[index]['quantity']
			dataCopy.itemsList[index]['oldQuantity'] = dataCopy.itemsList[index]['quantity']
		}
		if (dataCopy.itemsList[index]['returned'] === 1) {
			dataCopy.itemsList[index]['initialQuantity'] = dataCopy.itemsList[index]['quantity']
			dataCopy.itemsList[index]['oldQuantity'] = dataCopy.itemsList[index]['quantity'] - dataCopy.itemsList[index]['returnedQuantity']
			dataCopy.itemsList[index]['quantity'] = dataCopy.itemsList[index]['quantity'] - dataCopy.itemsList[index]['returnedQuantity']
		}

		dataCopy.itemsList[index]['error'] = false

		var sendDataCopy = { ...sendData }
		sendDataCopy.totalAmountInfo = 0
		sendDataCopy.totalAmount = 0
		sendDataCopy.totalVatAmount = 0

		sendDataCopy.itemsList.push(dataCopy.itemsList[index])
		dataCopy.itemsList.splice(index, 1);

		for (let i = 0; i < sendDataCopy['itemsList'].length; i++) {
			sendDataCopy.totalAmountInfo += Number(sendDataCopy.itemsList[i]['quantity']) * sendDataCopy.itemsList[i]['salePrice']

			sendDataCopy.totalAmount +=
				((sendDataCopy.itemsList[i]['quantity'] * sendDataCopy.itemsList[i]['salePrice']) - (sendDataCopy.itemsList[i]['quantity'] * Number(sendDataCopy.itemsList[i]['discountOne']))) -
				(sendDataCopy.itemsList[i]['quantity'] * sendDataCopy.itemsList[i]['clientDebtItemAmount'])

			sendDataCopy.totalVatAmount +=
				Number(sendDataCopy.itemsList[i]['totalPrice']) /
				(100 + Number(sendDataCopy.itemsList[i]['vat'])) *
				Number(sendDataCopy.itemsList[i]['vat'])
		}

		setData(dataCopy)
		setSendData(sendDataCopy)

		setTimeout(() => {
			var input = document.getElementById(productIdForFocus)
			input.select()
		}, 100);
	}

	function returnItem(index) {
		var dataCopy = { ...data }
		var sendDataCopy = { ...sendData }

		sendDataCopy.itemsList[index]['quantity'] = sendDataCopy.itemsList[index]['initialQuantity']
		sendDataCopy.itemsList[index]['totalPrice'] = (sendDataCopy['itemsList'][index]['salePrice'] -
			sendDataCopy['itemsList'][index]['discountOne']) * sendDataCopy['itemsList'][index]['initialQuantity']
		dataCopy.itemsList.push(sendDataCopy.itemsList[index])
		sendDataCopy.itemsList.splice(index, 1);

		sendDataCopy.totalAmount = 0
		sendDataCopy.totalAmountInfo = 0
		for (let i = 0; i < sendDataCopy.itemsList.length; i++) {
			sendDataCopy.totalAmountInfo +=
				(sendDataCopy['itemsList'][i]['initialQuantity'] * sendDataCopy['itemsList'][i]['salePrice'])

			sendDataCopy.totalAmount +=
				(sendDataCopy['itemsList'][i]['initialQuantity'] * sendDataCopy['itemsList'][i]['salePrice'] -
					(sendDataCopy['itemsList'][i]['initialQuantity'] * sendDataCopy['itemsList'][i]['discountOne'])) -
				(sendDataCopy['itemsList'][i]['initialQuantity'] * sendDataCopy['itemsList'][i]['clientDebtItemAmount'])
		}

		setData(dataCopy)
		setSendData(sendDataCopy)
	}

	function setQuantity(e, index) {
		var sendDataCopy = { ...sendData }

		if (sendDataCopy.itemsList[index]['uomId'] === 1 && isFloat(Number(e.target.value.replace(/,/g, '.')))) {
			toast.error(t('invalid_amount'))
			return;
		}
		///[^0-9\.]/g,''
		sendDataCopy.itemsList[index]['quantity'] = e.target.value.replace(/,/g, '.')
		sendDataCopy.itemsList[index]['totalPrice'] = (sendDataCopy['itemsList'][index]['salePrice'] - (sendDataCopy['itemsList'][index]['discountOne'])) * e.target.value

		sendDataCopy.totalAmount = 0
		sendDataCopy.totalAmountInfo = 0
		for (let i = 0; i < sendDataCopy.itemsList.length; i++) {
			sendDataCopy.totalAmountInfo +=
				(sendDataCopy['itemsList'][i]['quantity'] * sendDataCopy['itemsList'][i]['salePrice'])

			sendDataCopy.totalAmount +=
				(sendDataCopy['itemsList'][i]['quantity'] * sendDataCopy['itemsList'][i]['salePrice'] - (sendDataCopy['itemsList'][i]['quantity'] * sendDataCopy['itemsList'][i]['discountOne'])) -
				(sendDataCopy.itemsList[i]['quantity'] * sendDataCopy.itemsList[i]['clientDebtItemAmount'])
		}

		setSendData(sendDataCopy)
	}

	function addAllToList() {
		var dataCopy = { ...data }

		for (let i = 0; i < dataCopy.itemsList.length; i++) {
			if (dataCopy.itemsList[i]['returned'] === 0) {
				dataCopy.itemsList[i]['initialQuantity'] = dataCopy.itemsList[i]['quantity']
				dataCopy.itemsList[i]['oldQuantity'] = dataCopy.itemsList[i]['quantity']
			}
			if (dataCopy.itemsList[i]['returned'] === 1) {
				dataCopy.itemsList[i]['initialQuantity'] = dataCopy.itemsList[i]['quantity']
				dataCopy.itemsList[i]['oldQuantity'] = dataCopy.itemsList[i]['quantity'] - dataCopy.itemsList[i]['returnedQuantity']
				dataCopy.itemsList[i]['quantity'] = dataCopy.itemsList[i]['quantity'] - dataCopy.itemsList[i]['returnedQuantity']
			}
			dataCopy.itemsList[i]['error'] = false
		}

		var sendDataCopy = { ...sendData }
		sendDataCopy.totalAmount = 0
		sendDataCopy.totalAmountInfo = 0

		sendDataCopy.itemsList = dataCopy.itemsList.filter(e => e.returned !== 2)
		dataCopy.itemsList = dataCopy.itemsList.filter(e => e.returned === 2)

		for (let i = 0; i < sendDataCopy['itemsList'].length; i++) {
			sendDataCopy.totalAmountInfo += (Number(sendDataCopy.itemsList[i]['quantity'] * sendDataCopy.itemsList[i]['salePrice']))

			sendDataCopy.totalAmount +=
				((sendDataCopy['itemsList'][i]['quantity'] * sendDataCopy['itemsList'][i]['salePrice']) -
					(sendDataCopy.itemsList[i]['quantity'] * sendDataCopy['itemsList'][i]['discountOne'])) -
				(sendDataCopy.itemsList[i]['quantity'] * sendDataCopy.itemsList[i]['clientDebtItemAmount'])
		}

		setData(dataCopy)
		setSendData(sendDataCopy)
	}

	function toggleConfirmModal() {
		setShowConfirmModal(true)
		setTimeout(() => {
			document.getElementById("confirmButton").focus();
		}, 100);
	}

	function changeSearchIndex(type) {
		var searchIndexCopy = searchIndex
		if (type === 'down') {
			if (searchIndexCopy === searchProducts.length - 1) {
				searchIndexCopy = 0
			} else {
				searchIndexCopy += 1
			}
		}
		if (type === 'up') {
			if (searchIndexCopy === 0) {
				searchIndexCopy = searchProducts.length - 1
			} else {
				searchIndexCopy -= 1
			}
		}
		console.log(searchIndexCopy);
		var index = data.itemsList.findIndex(item => item.productName === searchProducts[searchIndexCopy]?.productName)
		if (index > 0) {
			scrollToBottomRef.current.scrollTop = (index * 25)
		} else {
			scrollToBottomRef.current.scrollTop = 0
		}
		setSearchIndex(searchIndexCopy)
	}

	function isFloat(n) {
		return Number(n) === n && n % 1 !== 0;
	}

	function calculateVat(i) {
		var vat = 0;
		if (sendData.itemsList[i]?.discountAmount) {
			vat = Number(sendData.itemsList[i]['totalPrice'] - sendData.itemsList[i]['discountAmount']) /
				(100 + Number(sendData.itemsList[i]['vat'])) *
				Number(sendData.itemsList[i]['vat'])
		} else {
			vat = Number(sendData.itemsList[i]['totalPrice']) /
				(100 + Number(sendData.itemsList[i]['vat'])) *
				Number(sendData.itemsList[i]['vat'])
		}
		return formatMoney(vat)
	}

	function highlight(text) {
		const regex = new RegExp(searchProductName, 'g');
		return text.replace(regex, '<b class="highlighted">$&</b>');
	}

	function returnPrinterWidth() {
		var name = ""
		switch (reduxSettings.checkPrintWidth) {
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

	useEffect(() => {
		if (id) {
			searchChequeByNumber(0, id)
		}
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (searchProductName) {
			var copyArr = [...data?.itemsList]
			var searchArr = []
			for (let i = 0; i < copyArr.length; i++) {
				if (copyArr[i].productName.includes(searchProductName)) {
					copyArr[i].index = i;
					searchArr.push(copyArr[i])
				}
			}
			setSearchProducts(searchArr)
			if (searchProducts.length === 1) {
				changeSearchIndex('down')
			}
		}
	}, [searchProductName]) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="pt-40">
				<div className="card-background pt-2">
					<form className="px-2 d-flex" onSubmit={(e) => searchChequeByNumber(e)}>
						<input type="number" className="form-control me-2" placeholder={t('search')} autoFocus
							value={search} onChange={(e) => setSearch(e.target.value)} />
						<button type="submit" className="btn btn-primary" disabled={!search}>{t('search')}</button>
					</form>
					<div className="d-flex justify-content-between p-2">
						<div className="w-50 me-3 return-block-border">
							<div className="p-2 return-header-height">
								<h5>{t('cashbox_cheque')} №: {data.chequeNumber ? data.chequeNumber : '000000'}</h5>
								<div className="d-flex">
									<div className="d-flex">
										<span className="me-4"><b>{t('date')}</b>: {data.chequeDate ? formatUnixTime(data.chequeDate) : '00.00.0000 - 00:00'}</span>
										<span><b>{t('cashier')}</b>: {data.cashierName ? data.cashierName : t('fio')}</span>
									</div>
								</div>
							</div>
							<div className="d-flex flex-column justify-content-between h-table-return">
								{/* TABLE */}
								<div className="table-responsive rightbar-table no-scroll" ref={scrollToBottomRef}>
									<table className="table fz14">
										<thead className="thead-sticky">
											<tr>
												<th className="text-nowrap">
													<div className="position-relative">
														<DebounceInput
															id="productSearchByName"
															type="text"
															placeholder={t('search') + '...'}
															className="product-search-table-input left-product-search"
															debounceTimeout={1000}
															onChange={(e) => setSearchProductName(e.target.value.toLocaleLowerCase())}
															onKeyUp={(e) => {
																if (e.key === 'Enter') {
																	setSearchProductName(e.target.value)
																}
															}}
														/>
														{searchProducts?.length ?
															<div className="return-arrows">
																<div className="">
																	{searchIndex + 1} / {searchProducts.length}
																</div>
																<div className="return-arrow" onClick={() => changeSearchIndex('up')}><KeyboardArrowUpOutlined /></div>
																<div className="return-arrow" onClick={() => changeSearchIndex('down')}><KeyboardArrowDownOutlined /></div>
															</div>
															:
															''
														}
													</div>
												</th>
												<th className="text-center text-nowrap">{t('discount_price')}</th>
												<th className="text-center text-nowrap">{t('quantity')}</th>
												<th className="text-end text-nowrap">{t('payment_amount')}</th>
											</tr>
										</thead>
										<tbody>
											{data.itemsList.length > 0 &&
												data.itemsList.map((item, index) => (
													<tr key={index}
														className={"cursor " + (item.returned !== 2 ? 'cashbox-table-bg-on-hover ' : 'table-bg-danger-on-hover ') +
															(searchProducts[searchIndex]?.productName === item.productName ? 'active' : '')}
														onDoubleClick={() => item.returned !== 2 ? addToList(index) : ''}
														title={item.returned === 2 ? t('item_returned') : ''}>
														<td>
															{index + 1}. <span dangerouslySetInnerHTML={{ __html: highlight(item.productName.toLowerCase()) }}></span>
														</td>
														<td className="text-center text-nowrap">
															{item.discountOne ?
																formatMoney(item.salePrice - (item.discountOne ?? 0))
																:
																formatMoney(item.salePrice)
															}
														</td>
														<td className="text-center text-nowrap">
															{formatMoney(item.quantity)} / {formatMoney(item.returnedQuantity)}
														</td>
														<td className="text-end text-nowrap">{formatMoney(item.totalPrice)}</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</div>
								{/* TABLE */}
								<div>
									{sendData.itemsList.length === 0 &&
										<div className="return-all-button p-2" onClick={() => {
											if (data.itemsList.length > 0) {
												addAllToList()
											}
										}}>
											<span>{t('return_all_items')}</span>
											<DoubleArrowOutlined />
										</div>
									}
									<div className="return-all-footer p-2">
										<div className="d-flex justify-content-between">
											<span><b>{t('payment_amount')}</b></span>
											<span>
												{data.paid ? formatMoney(data.paid) : formatMoney(0)}
												{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}
											</span>
										</div>
										{data.transactionsList.length > 0 &&
											data.transactionsList.map((item, index) => (
												<div className="d-flex justify-content-between" key={index}>
													<span>{item.paymentTypeName ? item.paymentTypeName : formatMoney(0)}</span>
													<span>{item.amountIn ? formatMoney(item.amountIn) + ' Сум' : formatMoney(0)}</span>
												</div>
											))
										}
									</div>
								</div>
							</div>
						</div>
						<div className="w-50 return-block-border">
							<div className="p-2 return-header-height d-flex justify-content-between">
								<h5>{t('return_check')}</h5>
							</div>
							<div className="d-flex flex-column justify-content-between h-table-return">
								{/* TABLE */}
								<div className="table-responsive rightbar-table no-scroll">
									<table className="table fz14">
										<thead>
											<tr>
												<th>{t('product_name')}</th>
												<th className="text-center text-nowrap">{t('discount_price')}</th>
												<th className="text-center text-nowrap">{t('number_of_returns')}</th>
												<th className="text-center text-nowrap">{t('payment_amount')}</th>
											</tr>
										</thead>
										<tbody>
											{sendData.itemsList.length > 0 &&
												sendData.itemsList.map((item, index) => (
													<tr key={index + 1000}>
														<td>
															<span className="cursor" onClick={() => returnItem(index)}>
																<ChevronLeftOutlined />
															</span>
															{item.productName}
														</td>
														<td className="text-center">
															{item.discountOne ?
																formatMoney(item.salePrice - (item.discountOne ?? 0))
																:
																formatMoney(item.salePrice)
															}
														</td>
														<td className="text-center">
															<input id={item.productId} type="number" className="auto-width-input"
																value={item.quantity}
																onChange={(e) => setQuantity(e, index)} />
															{item.quantity > item.oldQuantity &&
																<div className="error-text fz14">{t('no_more')} {item.oldQuantity}</div>
															}
															{item.quantity <= 0 &&
																<div className="error-text fz14">{t('invalid_amount')}</div>
															}
														</td>
														<td className="text-center">{formatMoney(item.totalPrice)}</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</div>
								{/* TABLE */}
								<div className="pt-2 px-2">
									<div className="d-flex justify-content-between">
										<div className="d-flex flex-column">
											<span className="text-uppercase text-start"><b>{t('sale_amount')}:</b></span>
											<div className="d-flex justify-content-start">
												<h1 className="text-primary">{formatMoney(sendData.totalAmountInfo)}</h1>
												<div className="fz20 ms-1 text-primary">
													{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}
												</div>
											</div>
										</div>

										<div className="d-flex flex-column">
											<span className="text-uppercase text-end"><b>{t('to_payoff')}:</b></span>
											<div className="d-flex justify-content-end">
												<h1 className="text-primary">{formatMoney(sendData.totalAmount)}</h1>
												<div className="fz20 ms-1 text-primary">
													{cashbox.defaultCurrency === 2 ? 'USD' : t('sum')}
												</div>
											</div>
										</div>
									</div>
									<div className="d-flex">
										<button className="btn btn-danger btn-lg text-uppercase w-100" disabled={!sendData.itemsList.length}
											onClick={() => toggleConfirmModal()}><b>{t('make_return')}</b></button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* CONFIRM MODAL */}
			<Modal show={showConfirmModal} animation={false} centered dialogClassName="payment-terminal-modal-width" onHide={() => setShowConfirmModal(false)}>
				<Modal.Body>
					<div className="modal-custom-close-button" onClick={() => setShowConfirmModal(false)}><CloseOutlined /></div>
					<div className="payment-tab-body">
						<div className="w-75 m0-auto">
							<form onSubmit={(e) => returnCheque(e)}>
								<h2 className="color-62 text-center"><b>{t('attention')}</b></h2>
								<h5 className="color-62 my-3"><b>{t('make_return')}?</b></h5>
								<div className="d-flex">
									<button type="button" className="btn btn-danger w-100 me-4" onClick={() => setShowConfirmModal(false)}>{t('cancel')}</button>
									<button id="confirmButton" type="submit" className="btn btn-primary w-100">{t('ok')}</button>
								</div>
							</form>
						</div>
					</div>
				</Modal.Body>
			</Modal>
			{/* CONFIRM MODAL */}

			<div className={`main d-none ${returnPrinterWidth()}`} ref={printChequeRef}>
				<div className="d-flex justify-content-center w-100 mt-3 mb-2">
					<div className="d-flex flex-column w-100">
						<div className="d-flex justify-content-center mb-2">
							<div className="d-flex">
								{reduxSettings.logoPath ?
									<img src={reduxSettings.logoPath}
										width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
										height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
										alt="logo"
									/>
									:
									<>
										<img src={`${globalValue('url')}/logo.svg`}
											width={reduxSettings?.chequeLogoWidth ? reduxSettings?.chequeLogoWidth : 128}
											height={reduxSettings.chequeLogoHeight ? reduxSettings.chequeLogoHeight : ''}
											alt="logo"
										/>
									</>
								}
							</div>
						</div>
						<h5 className="text-center fw-700">Qaytish</h5>
						<h3 className="text-center fw-700 mb-2">
							{cashbox.posName}
						</h3>
						<h5 className="text-center fw-600 mb-2">
							<span className="me-1">Telefon:</span>
							{cashbox.posPhone}
						</h5>
						<h5 className="text-center fw-500 mb-2">
							<span className="me-1">Manzil:</span>
							{cashbox.posAddress}
						</h5>
					</div>
				</div>

				<div className="cheque-block-1 fz12">
					<div className="d-flex justify-content-between">
						<p className="fw-600">Kassir</p>
						<p>{data.cashierName}</p>
					</div>
					{data.uzumPaymentId &&
						<div className="d-flex justify-content-between">
							<p>Uzum ID</p>
							<p>{data.uzumPaymentId}</p>
						</div>
					}
					{data.uzumClientPhone &&
						<div className="d-flex justify-content-between">
							<p>Uzum telefon</p>
							<p>{data.uzumClientPhone}</p>
						</div>
					}
					<div className="d-flex justify-content-between">
						<p className="fw-600">ID chek</p>
						<p>{data.chequeNumber}</p>
					</div>
					{sendData?.receiptSeq &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">№ chek</p>
							<p>{sendData?.receiptSeq}</p>
						</div>
					}
					{data.chequeOfdType >= 0 &&
						<div className="d-flex justify-content-between">
							<p>Chek turi</p>
							<p>
								{data.chequeOfdType === 0 &&
									<span>Savdo</span>
								}
								{data.chequeOfdType === 2 &&
									<span>Kredit</span>
								}
								{data.chequeOfdType === 1 &&
									<span>Avans</span>
								}
							</p>
						</div>
					}
					<div className="d-flex justify-content-between">
						<p className="fw-600">Chek sanasi</p>
						{data?.dateFormat1 ?
							<p>{formatUnixTime(data.dateFormat1)}</p>
							:
							<p>{formatUnixTime(data.chequeDate)}</p>
						}
					</div>
				</div>
				<div className="overflow-hidden">
					*****************************************************************************************
				</div>
				<div className="cheque-block-2">
					<table className="custom-cheque-table w-100 fz12">
						<thead>
							<tr>
								<th className="text-start w-50">Mahsulot</th>
								<th className="text-end"></th>
							</tr>
						</thead>
						<tbody>
							{Object.keys(sendData).length !== 0 &&
								sendData.itemsList.map((item, index) => (
									<Fragment key={index}>
										<tr>
											{/* column 1 */}
											<td className="d-flex text-break-spaces">
												<b>{item.productName}</b>
											</td>
											{/* column 1 */}
										</tr>
										<tr>
											<td colSpan={3}>
												<div className="ms-2">
													<div className="text-end align-top text-nowrap">
														{(item.actualQuantity === item.quantity) &&
															<>
																<div className="text-nowrap">
																	{formatMoney(item.actualQuantity)}
																	{'*' + formatMoney(item.salePrice)}={formatMoney(item.totalPrice)}
																</div>
															</>
														}
														{(item.actualQuantity !== item.quantity) &&
															<>
																<span className="text-nowrap">
																	{formatMoney(item.actualQuantity)}
																	{'*' + formatMoney(item.salePrice)}={formatMoney(item.totalPrice)}
																</span>
																<br />
																<div className="text-nowrap">
																	{formatMoney(item.quantity)}
																	{'*' + formatMoney(item.salePrice)}={formatMoney(item.totalPrice)}
																</div>
															</>
														}
													</div>
													<div className="d-flex justify-content-between">
														<div>O'lchov birligi</div>
														<div className="text-end">
															{item.packageCode ?
																<span>{item.packageName}</span>
																:
																<span>{item.uomName}</span>
															}
														</div>
													</div>
													{!!item.discountAmount &&
														<div className="d-flex justify-content-between">
															<div>Chegirma</div>
															<div>
																{formatMoney(((item.salePrice * item.actualQuantity) - item.discountAmount))}
															</div>
														</div>
													}
													<div className="d-flex justify-content-between">
														<div>QQS ({formatMoney(item.vat)}%)</div>
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
																<div>Sh.k</div>
																<div>{item.barcode}</div>
															</div>
															<div className="d-flex justify-content-between">
																<div>MXIK</div>
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
															<div>Komintant STIR</div>
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
					*****************************************************************************************
				</div>
				<div className="cheque-block-3 fz12 mb-2">
					<div className="d-flex justify-content-between">
						<p>Savdo summasi</p>
						{data.totalPrice ?
							<p>{formatMoney(data.totalPrice)}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>
					<div className="d-flex justify-content-between">
						<p>QQS Jami</p>
						{sendData.totalVatAmount > 0 ?
							<p>{formatMoney(sendData.totalVatAmount)}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>
					<div className="d-flex justify-content-between">
						<p>Chegirma Jami</p>
						{data.discountAmount ?
							<>
								{data.discountType === 3 &&
									<p>{formatMoney(data.discountAmount)}</p>
								}
								{!data.discountType &&
									<p>{formatMoney(data.totalPrice - data.discountAmount)}</p>
								}
							</>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>

					<div className="cheque-block-3 fz12">
						<div className="d-flex justify-content-between">
							<p className="fw-600">To'lovga</p>
							{data.totalPrice &&
								<p>{formatMoney(data.totalPrice - data.discountAmount)}</p>
							}
						</div>
					</div>
					<div className="d-flex justify-content-between">
						<p>To'landi</p>
						{data.paid ?
							<p>{formatMoney(data.paid)}</p>
							:
							<p>{formatMoney(0)}</p>
						}
					</div>

					<div className="cheque-block-3 fz12">
						<div className="d-flex justify-content-between">
							<p className="fw-600 fz20">Qaytarildi</p>
							<p className="fw-600 fz20">{formatMoney(sendData.totalAmount)}</p>
						</div>
					</div>
					{data.saleCurrencyId &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Valyuta</p>
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
									<p>Naqd</p>
								}
								{item.paymentTypeId === 2 &&
									<p>Bank kartasi</p>
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
					{/* FISCAL INFO */}
					<div className="d-flex justify-content-between">
						<p className="fw-600">Serial raqam</p>
						<p>20220778</p>
					</div>
					{sendData?.fiscalResult?.AppletVersion &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Virtual kassa</p>
							<p>{globalValue('projectName')}</p>
						</div>
					}
					{sendData?.fiscalResult?.TerminalID &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">Fiskal raqam</p>
							<p>{sendData?.fiscalResult?.TerminalID}</p>
						</div>
					}
					{sendData?.fiscalResult?.FiscalSign &&
						<div className="d-flex justify-content-between">
							<p className="fw-600">№ Fiskal belgi</p>
							<p>{sendData?.fiscalResult?.FiscalSign}</p>
						</div>
					}
					{/* FISCAL INFO */}
				</div>
				{(sendData?.fiscalResult?.QRCodeURL && reduxSettings.showQrCode) &&
					<div className="d-flex justify-content-center">
						<QRCode value={sendData?.fiscalResult?.QRCodeURL} size={120} />
					</div>
				}
				{(sendData.chequeNumber && reduxSettings.showBarcode) &&
					<div className="d-flex justify-content-center">
						<Barcode value={sendData.chequeNumber} width={2} height={30} displayValue={false} background="transparent" />
					</div>
				}
			</div>
		</>
	)
}

export default Return
