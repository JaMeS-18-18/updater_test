import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from 'react-toastify';
import { SET_UNLOCK_SCREEN } from 'store/actions/settings'
import Routers from "./router"
import { toast } from 'react-toastify';
/* CSS */
import 'react-toastify/dist/ReactToastify.css';
import './assets/css/bootstrap.css'
import './assets/css/styles.css'
import './assets/css/sidebar.css'
import './assets/css/theme.css'
import './assets/css/theme-dark.css'

function App() {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	const loader = useSelector(state => state.loader)
	const lockScreen = useSelector(state => state.settings.lockScreen)
	const reduxSettings = useSelector(state => state.settings.settings)

	const [password, setPassword] = useState("")

	function unlockScreen(e) {
		e.preventDefault();
		
		if(localStorage.getItem('password') === password){
			dispatch(SET_UNLOCK_SCREEN())
			setPassword("")
		} else {
			toast.error(t('invalid_password'))
		}
	}

	useEffect(() => {
		document.addEventListener("wheel", function (event) {
			if (document.activeElement.type === "number") {
				document.activeElement.blur();
			}
		});

		if (reduxSettings && reduxSettings.darkTheme) {
			document.body.classList.add('dark-theme');
		}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
		<>
			{ lockScreen &&
				<div className="auth-overlay-wrapper">
					<div className="auth-overlay-wrapper2">
						<div className="auth-overlay-wrapper3">
							<div className="card">
								<div className="card-body">
									<form onSubmit={(e) => unlockScreen(e)} autoComplete="off">
										<div className=" text-center">
											<div className="d-flex mb-2 justify-content-center">
												<h3>{t('loging_in')}</h3>
											</div>
										</div>
										<div className="form-group mb-2">
											<label>{t('password')}<span className="required-mark">*</span></label>
											<input type="password" className="form-control" placeholder="Введите пароль" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
										</div>
										<button button="submit" className="btn btn-primary w-100">{t('enter')}</button>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			}
			
			<ToastContainer
				position="bottom-left"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick={false}
			/>
			
			{	loader && 
				<div id="loading-bg">
					<div className="loading">
						<div className="effect-1 effects"></div>
						<div className="effect-2 effects"></div>
						<div className="effect-3 effects"></div>
					</div>
				</div>
			}
			<Routers />
		</>
  );
}

export default App;