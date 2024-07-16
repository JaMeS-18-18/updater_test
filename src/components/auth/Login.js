import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory } from "react-router-dom"
import { Dropdown, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify';

import { ComputerOutlined, DevicesOutlined } from '@material-ui/icons';

import { GUESS_POST, GET, globalValue } from 'api/api'
import { O_POST } from 'api/apiOfd'
import { clearTemporaryStorage } from 'helpers/helpers'

import { SET_POS_LIST } from 'store/actions/posList'
import { SET_CASHBOX } from 'store/actions/cashbox'
import { SET_ACCOUNT } from 'store/actions/account'
import { SET_SETTINGS } from 'store/actions/settings'
import { SET_SELECTED_PRODUCTS, SET_VERSION } from 'store/actions/backendHelpers'
import axios from 'axios'
import '../../assets/css/auth.css'
import ru from '../../assets/flags/ru.png'
import uzLatn from '../../assets/flags/uz-Latn-UZ.png'
import uzCyrl from '../../assets/flags/uz-Cyrl-UZ.png'

import Lottie from 'react-lottie-player'
import lottieJson from '../settings/loader.json'

function Login() {
	const { i18n, t } = useTranslation();
	const dispatch = useDispatch();
	const history = useHistory();

	const [drivers, setDrivers] = useState([]);
	const [factoryId, setFactoryId] = useState("");
	const [timer, setTimer] = useState(null);
	const [user, setUser] = useState({
		'username': '',
		'password': '',
		'random': '',
		'code': '',
		'incorrectAuthCount': 0,
		'countDown': 0,
	})
	const [version, setVersion] = useState("0")
	const [countDown, setCountDown] = useState(0);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [downloadStarted, setDownloadStarted] = useState(false);
	const [lottieConfig, setLottieConfig] = useState({ 'play': false });
	const [downloadDetail, setDownloadDetail] = useState({
		message: 'checking_update_and_connection',
		updateExist: null,
		speed: 0,
		percentage: 0,
		downloaded: 0,
		needDownload: 0,
		version: 0,
	});

	function changeLanguage(language = 'uz-Latn-UZ') {
		i18n.changeLanguage(language);

		if (language === 'ru') {
			localStorage.setItem('lang', 'ru');
		}
		if (language === 'uz-Latn-UZ') {
			localStorage.setItem('lang', 'uz-Latn-UZ');
		}
		if (language === 'uz-Cyrl-UZ') {
			localStorage.setItem('lang', 'uz-Cyrl-UZ');
		}
	};

	function getCurrentLocale() {
		const locale = i18n.language
		if (locale === 'ru') return { flag: ru, lang: 'russian' }
		else if (locale === 'uz-Latn-UZ') return { flag: uzLatn, lang: 'uzbek_latn' }
		else if (locale === 'uz-Cyrl-UZ') return { flag: uzCyrl, lang: 'uzbek_cyrl' }
	}

	async function signIn(e) {
		e.preventDefault()
		GUESS_POST("/auth/login", user, true).then(response => {
			localStorage.setItem("access_token", response.access_token);
			localStorage.setItem("username", user.username.toLowerCase());
			localStorage.setItem("password", user.password);
			localStorage.setItem("tokenTime", JSON.stringify(new Date().getTime()));
			GET("/services/uaa/api/account").then(response => {

				var checker = false
				for (let i = 0; i < response.authorities.length; i++) {
					if (response.authorities[i] === "ROLE_CASHIER" || response.authorities[i] === "ROLE_AGENT") {
						checker = true
					}
				}
				if (checker === true) {
					localStorage.setItem("user_roles", response.authorities);
					dispatch(SET_ACCOUNT(response))
					window.electron.dbApi.deleteCheques()
					window.electron.dbApi.deleteDeletedProducts()

					GET("/services/desktop/api/user-settings").then(responseSettings => {
						var parsedSettings = JSON.parse(responseSettings?.settings)
						if (factoryId) {
							parsedSettings.ofdFactoryId = factoryId
						}

						if (parsedSettings) {
							dispatch(SET_SETTINGS(parsedSettings))
							if (parsedSettings && parsedSettings.darkTheme) {
								document.body.classList.add('dark-theme');
							}
						}

						if (parsedSettings?.ofd) {
							O_POST({
								"method": "Api.GetInfo",
								"id": '',
								"params": {
									"FactoryID": factoryId
								},
								"jsonrpc": "2.0"
							}
							).then(responseOfd => {
								if (responseOfd?.error?.code === 65534) {
									toast.error(responseOfd?.error?.message)
								} else {
									getAccessPos()
								}
							})
						} else {
							getAccessPos()
						}
					})
				} else {
					toast.error(t('ERROR') + ': ' + t('YOU_DO_NOT_HAVE_ACCESS'))
					clearTemporaryStorage()
				}
			})
		}).catch(error => {
			var incorrectAuthCount = user?.incorrectAuthCount
			if (incorrectAuthCount >= 5) {
				startTimer()
			} else {
				setUser({ ...user, incorrectAuthCount: incorrectAuthCount + 1 })
				localStorage.setItem('account', JSON.stringify({ 'incorrectAuthCount': incorrectAuthCount + 1 }))
			}
		});
	}

	function startTimer(localUser) {
		var userCopy = { ...user }
		if (localUser?.countDown) {
			userCopy.countDown = localUser?.countDown
		} else {
			userCopy.countDown = 180
		}
		setCountDown(userCopy.countDown);
		let timerId = setInterval(() => {
			setCountDown((countDown) => countDown - 1);
		}, 1000);
		setTimer(timerId)
	}

	function getAccessPos() {
		GET("/services/desktop/api/get-access-pos").then(response => {
			dispatch(SET_POS_LIST(response.posList))
			if (response.openShift) {
				dispatch(SET_CASHBOX(response.shift))
				getBalanceProductList(response.shift.posId, response.shift.cashboxId, response.shift.defaultCurrency)
			} else {
				//return
				history.push("/auth/cashboxes");
			}
		})
	}

	async function getBalanceProductList(posId, cashboxId, defaultCurrency) {
		var response = await GET("/services/desktop/api/get-balance-product-list/" + posId + "/" + defaultCurrency)

		window.electron.dbApi.deleteProducts()
		window.electron.dbApi.insertProducts(response).catch(e => { toast.error(e) })
		var responseSettings = await GET("/services/desktop/api/user-settings")
		if (responseSettings.settings) {
			const parsedSettings = JSON.parse(responseSettings.settings)
			dispatch(SET_SETTINGS(parsedSettings))
			if (parsedSettings && parsedSettings.darkTheme) {
				document.body.classList.add('dark-theme');
			}
		}
		var selectedProducts = await GET("/services/desktop/api/selected-products-list/" + posId + "/" + cashboxId)
		dispatch(SET_SELECTED_PRODUCTS(selectedProducts))
		var clients = await GET("/services/desktop/api/clients-helper")
		window.electron.dbApi.deleteClients()
		window.electron.dbApi.insertClients(clients).catch(e => { toast.error(e) })

		var organizations = await GET("/services/desktop/api/organization-helper")
		window.electron.dbApi.deleteOrganizations()
		window.electron.dbApi.insertOrganizations(organizations).catch(e => { toast.error(e) })

		var agents = await GET("/services/desktop/api/agent-helper")
		window.electron.dbApi.deleteAgents()
		window.electron.dbApi.insertAgents(agents).catch(e => { toast.error(e) })
		history.push("/")
	}

	function checkUpdateExist() {
		if (!downloadStarted) {
			window.electron.appApi.checkUpdate()
			setDownloadStarted(true)
		}
		setShowUpdateModal(true)
	}

	function getAppVersion() {
		dispatch(SET_VERSION(window.electron.ipcRenderer.sendSync('app-version')))
		setVersion(window.electron.ipcRenderer.sendSync('app-version'))
	}

	async function getistFiscalDrives() {
		O_POST({
			"method": "Api.ListFiscalDrives",
			"id": '',
			"params": {
				"FactoryID": ""
			},
			"jsonrpc": "2.0"
		}
		).then(responseOfd => {
			setDrivers(responseOfd?.result?.FactoryID)
		})
	}

	function openRemoteAccess(type) {
		window.electron.appApi.openRemoteAccess(type)
	}

	useEffect(() => {
		if (user?.incorrectAuthCount >= 5) {
			setUser({ ...user, countDown: countDown - 1, 'incorrectAuthCount': user.incorrectAuthCount })
			localStorage.setItem('account', JSON.stringify({ countDown: countDown - 1, 'incorrectAuthCount': user.incorrectAuthCount }))
			if (countDown < 0) {
				clearInterval(timer)
				setTimer(null)
				setUser({ ...user, 'incorrectAuthCount': 0 })
				localStorage.setItem('account', JSON.stringify({ 'incorrectAuthCount': 0 }))
			}
		}
	}, [countDown]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		dispatch({ type: 'USER_LOGGED_OUT', payload: null })
		clearTemporaryStorage()
	}, [dispatch])

	useEffect(() => {
		var userCopy = JSON.parse(localStorage.getItem('account'))
		setUser({ ...user, ...userCopy })
		if (userCopy?.incorrectAuthCount >= 5) {
			startTimer(userCopy)
		}
		getAppVersion()
		var version = window.electron.ipcRenderer.sendSync('app-version')

		axios.get(`${globalValue('url')}/services/admin/api/get-version?name=${globalValue('projectId')}`, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
		}).then(response => {
			if (version < response.data.version && response.data.required) {
				checkUpdateExist()
			}
		})

		getistFiscalDrives()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

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

	const LanguageToggle = React.forwardRef(({ children, onClick }, ref) => (
		<span ref={ref} onClick={(e) => { e.preventDefault(); onClick(e); }}>
			{children}
		</span>
	));

	const seconds = String(countDown % 60).padStart(2, 0);
	const minutes = String(Math.floor(countDown / 60)).padStart(2, 0);

	return (
		<>
			<div className="authentication-bg">
				<div className="account-pages h-100 vertical-center">
					<div className="container auth-card">
						<div className="row align-items-center justify-content-center">
							<div className="col-md-8 col-lg-6 col-xl-4">
								<div className="text-center my-2">
									<h3 className="text-white">{t('LOGGING_IN')}</h3>
								</div>
								<div className="p-2">
									<form className="form-horizontal" autoComplete="off" onSubmit={(e) => signIn(e)}>

										<input className="login-input"
											autoFocus
											name="username"
											value={user.username}
											placeholder={t('LOGIN')}
											onChange={(e) => setUser({ ...user, 'username': e.target.value })} />

										<input className="login-input"
											type="password"
											name="password"
											placeholder={t('PASSWORD')}
											value={user.password}
											onChange={(e) => setUser({ ...user, 'password': e.target.value })} />

										<div className="text-center">
											<button type="submit" className="login-button" disabled={timer !== null}>
												{timer ?
													minutes + ':' + seconds
													:
													t('ENTER')
												}
											</button>
										</div>
									</form>
								</div>

								{drivers?.map((item, index) => (
									<div className="text-success text-center" key={index}
										onClick={() => {
											setFactoryId(item)
										}}>
										{item}
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="position-absolute lang-position">
						<Dropdown className="cursor-pointer d-flex cursor">
							<Dropdown.Toggle as={LanguageToggle}>
								<div className="d-flex">
									<div className="vertical-center">
										<img src={getCurrentLocale().flag} className="me-2" alt="ru" width="24" height="16" />
									</div>
									<span>{t(getCurrentLocale().lang)}</span>
								</div>
							</Dropdown.Toggle>

							<Dropdown.Menu>
								{i18n.language !== 'ru' &&
									<Dropdown.Item onClick={() => changeLanguage("ru")}>
										<div className="d-flex">
											<div className="vertical-center"><img src={ru} className="me-2" alt="ru" width="24" height="16" /></div>
											<span>{t('russian')}</span>
										</div>
									</Dropdown.Item>
								}
								{i18n.language !== 'uz-Latn-UZ' &&
									<Dropdown.Item onClick={() => changeLanguage("uz-Latn-UZ")}>
										<div className="d-flex">
											<div className="vertical-center"><img src={uzLatn} className="me-2" alt="uz-Latn-UZ" width="24" height="16" /></div>
											<span>{t('uzbek_latn')}</span>
										</div>
									</Dropdown.Item>
								}
								{i18n.language !== 'uz-Cyrl-UZ' &&
									<Dropdown.Item onClick={() => changeLanguage("uz-Cyrl-UZ")}>
										<div className="d-flex">
											<div className="vertical-center"><img src={uzCyrl} className="me-2" alt="uz-Cyrl-UZ" width="24" height="16" /></div>
											<span>{t('uzbek_cyrl')}</span>
										</div>
									</Dropdown.Item>
								}
							</Dropdown.Menu>
						</Dropdown>
					</div>

					<div className="about-idokon position-absolute">
						<span title={version}>{t('version')}: 1</span> <br />
						{t('serial_number')}: 20220778 <br />
						{t('contact_center')}: {globalValue('projectPhone')} <br />
						{t('legal_address')} <br />
						{t('made_by_as')} <br />
						{t('made_by_as2')}
					</div>
				</div>

				<div className="auth-settings" style={{ 'top': '80px', 'right': '10px' }}
					onClick={() => openRemoteAccess('anydesk')}>
					<div className="right-setting-button" title="AnyDesk">
						<ComputerOutlined></ComputerOutlined>
					</div>
				</div>
				<div className="auth-settings" style={{ 'top': '140px', 'right': '10px' }}
					onClick={() => openRemoteAccess('ammyadmin')}>
					<div className="right-setting-button" title="AmmyAdmin">
						<DevicesOutlined></DevicesOutlined>
					</div>
				</div>
			</div>

			{/* UPDATE MODAL */}
			<Modal show={showUpdateModal} animation={false} centered dialogClassName="update-modal-width"
				backdrop="static" onHide={() => setShowUpdateModal(false)}>
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
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('download_speed')}</p>
									<p>{downloadDetail.speed} мб/cек</p>
								</div>
								<div className="d-flex justify-content-between">
									<p className="fw-600">{t('file_size')}</p>
									<p>{downloadDetail.needDownload} MB</p>
								</div>
								<div className="d-flex justify-content-between">
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

export default Login