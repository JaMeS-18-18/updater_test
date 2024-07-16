import React, { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { GET, POST } from 'api/api'
import XLSX from 'xlsx';

function Test() {
	const [updateAvailable] = useState(false)
	const [version, setVersion] = useState("0")
	const [products, setProducts] = useState([])
	const componentRef = useRef();
	const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

	const quitApp = () => {
		window.electron.appApi.quitApp()
	}
	
	const excel = () => {

		var data = {"id":21,"login":"united_","cashboxId":859,"change":"0","chequeDate":"1632464135459",
		"chequeNumber":"976661","clientId":0,"clientAmount":"0","clientComment":"","saleCurrencyId":"So`m","currencyId":"So`m","currencyRate":"1","discount":"0",
		"itemsList":[{"id":1596,"productName":"Vlaj. salf. sunlight jemchujina vostoka 72sht.","productNameLower":"vlaj. salf. sunlight jemchujina vostoka 72sht.","balance":"15",
		"balanceId":1570978,"barcode":"4780030030777","barcodeScales":null,"wholesalePrice":"1000","salePrice":"2000","currencyId":"So`m","label":0,
		"modificationList":[{"party":"","serial":"","expDate":"","quantity":15}],"price":"1000","productClassCode":null,"productId":"675326","productImageUrl":null,
		"unitList":[],"vat":0,"uomId":1008,"productGroupId":"0","wholesale":false,"discount":0,"outType":false,"quantity":1,"selected":true,"totalPrice":2000}],"note":"",
		"ofdTransactions":null,"offline":1,"outType":0,"paid":"2000","posId":857,"shiftId":43129,"totalPrice":"2000","transactionId":"857859431291632464135459",
		"transactionsList":[{"amountIn":2000,"amountOut":0,"paymentTypeId":2,"paymentPurposeId":1}],"systemId":null,"chequeId":null,"status":0,"cashboxVersion":"1.2.5","cashierLogin":"united_"}

		var dataC = [
			{"A": 'Кассир', "B": data.cashierLogin},
			{"A": '№ чека', "B": data.chequeNumber},
			{"A": 'Дата', "B": data.chequeDate}, //formatUnixTime(data.chequeDate)
			{"A": '№ Товар', "B": 'Количество', "C": 'Цена'},
			{"A": 'ASD', "B": '1', "C": '200'},
			{"A": 'Сумма продажи', "B": data.totalPrice},
			{"A": 'Скидка', "B": data.discount}, //formatMoney((data.totalPrice * data.discount ) / 100)
			{"A": 'К оплате', "B": data.paid}, //formatMoney(selectedItem.totalPrice - ((selectedItem.totalPrice * selectedItem.discount ) / 100))
			{"A": 'Оплачено', "B": data.paid},
			{"A": 'НДС 15%', "B": data.totalVatAmount},
			{"A": 'Клиент', "B": data.loyaltyClientName}, // if
			{"A": 'Loyalty', "B": data.loyaltyBonus}, // if
			{"A": 'Наличка', "B": 2},
			{"A": 'Сдача', "B": data.change},
			{"A": 'Сумма долга', "B": data.clientAmount},
			{"A": 'Должник', "B": data.clientName},
		];

		const ws = XLSX.utils.json_to_sheet(dataC, {skipHeader:true});
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
		XLSX.writeFile(wb, "test.xlsx");
	}
	
	const getUnsyncProducts = () => {
		window.electron.dbApi.getUnsyncProducts().then(response => {
			console.log(response);
			for (let i = 0; i < response.length; i++) {
				response[i]['itemsList'] = JSON.parse(response[i]['itemsList'])
				response[i]['transactionsList'] = JSON.parse(response[i]['transactionsList'])
			}
			
			for (let i = 0; i < response.length; i++) {
				POST("/services/desktop/api/cheque", response[i]).then(response => {
					console.log(response);
				})
			}
		})
	}

	const getClients = () => {
		GET("/services/desktop/api/clients-helper").then(response => {
			console.log(response);
		})
	}

	const getUserBalance = () => {
		var sendData = {
			'clientCode': '123456',
			'key': process.env.TEST_KEY
		}
		POST("/services/loyaltyapi/api/get-user-balance", sendData).then(response => {
			console.log(response);
		})
	}

	const getAppVersion = () => {
		setVersion(window.electron.ipcRenderer.sendSync('app-version'))
	}	
	
	const handlePrintElectron = () => {
		window.electron.ipcRenderer.send('print')
	}

	const toastify = () => {
		toast.success("Wow so easy!")
	}

	const openFile = () => {
		window.electron.ipcRenderer.send('open-file')
	}
	
	const getImage = () => {
		var str = window.electron.ipcRenderer.sendSync('getImage')
		console.log(str);
	}

	const uploadImage = (e) => {
		var file = e.target.files[0]
		var reader = new FileReader();
		reader.onloadend = function() {
			window.electron.appApi.uploadImage(reader.result)
		}
		reader.readAsDataURL(file)
	}
	
	const checkUpdateExist = () => {
		window.electron.appApi.checkUpdate()
	}
	
	const updateOnlineStatus = () => {
		if (window.navigator.onLine) {
			console.log('Connection available')
		} else {
			console.log('Connection not available')
		}
	}

	const restartApp = () => {
		window.electron.ipcRenderer.send('restart-app')
	}

	const getProducts = () => {
		window.electron.dbApi.getProducts().then(response => {
			console.log(response);
			setProducts(response)
		})
	}

	useEffect(() => {
		getAppVersion()
  }, []);

  return (
    <div className="App">
      <header className="cashbox-tabs">
				<button onClick={excel}>EXCEL</button>
				<button onClick={getUnsyncProducts}>getUnsyncProducts</button>
				<button onClick={getUserBalance}>getUserBalance</button>
				<button onClick={getClients}>getClients</button>
				<button onClick={getProducts}>getProducts</button>
				<button onClick={checkUpdateExist}>checkUpdateExist</button>
				<button onClick={toastify}>Toastify</button>
				<table ref={componentRef}>
					<thead>
						<tr>
							<th>column 1</th>
							<th>column 2</th>
							<th>column 3</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>data 1</td>
							<td>data 2</td>
							<td>data 3</td>
						</tr>
					</tbody>
				</table>
				<button onClick={handlePrint}>Print this out!</button>
				<button onClick={handlePrintElectron}>PhandlePrintElectron</button>
				<button onClick={quitApp}>Quit App</button>
				<button onClick={updateOnlineStatus}>Online status to console</button>
				<button onClick={openFile}>Open file</button>
				<button onClick={getImage}>GET FILE</button>

				VERSION: {version}
      </header>
			
			IMAGE
			<input type="file" onChange={(e) => uploadImage(e)} />
			<img src="C:/Users/Admin/AppData/Roaming/idokon_cashbox/image.png" alt="test" width="100" />

			{
				products.map((item, index) => (
					<div key={index}>
						{item.productName}
					</div>
				))
			}

			{ updateAvailable &&
				<div id="notification" >
					<p id="message" />
					<button id="restart-button" onClick={restartApp}>
						Restart
					</button>
				</div>
			}

    </div>
  );
}

export default Test;
