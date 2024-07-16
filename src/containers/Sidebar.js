import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import '../assets/css/sidebar.css'
import {
	Computer, Settings, ListAlt, Reply,
	LocalOffer, HeadsetMicOutlined, BarChartOutlined,
	ArchiveOutlined, KeyboardOutlined, VerifiedUserOutlined
} from '@material-ui/icons';
import { globalValue } from 'api/api';

function Sidebar() {
	const { t } = useTranslation();
	const [version, setVersion] = useState("0")

	const getAppVersion = () => {
		setVersion(window.electron.ipcRenderer.sendSync('app-version'))
	}

	useEffect(() => {
		getAppVersion()
	}, []);

	return (
		<div className="nav-sidebar">
			<div className="nav-sidebar-inner-scroll position-relative" style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
				<ul className="sidebar-top-level-items">
					<ul className="sidebar-sub-level-items">
						<li>
							<NavLink to="/" exact title={t('cashbox')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<Computer className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/cheques" title={t('checks')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<ListAlt className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/return" title={t('return')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<Reply className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/selected-products" title={t('quick_selection')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<KeyboardOutlined className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/price-tags" title={t('price_tag')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<LocalOffer className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/report" title={t('balance')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<ArchiveOutlined className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/statistics" title={t('statistics')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<BarChartOutlined className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/ofd" title={t('ofd')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<VerifiedUserOutlined className="sidebar-icon" />
							</NavLink>
						</li>
						<li>
							<NavLink to="/settings" title={t('settings')} className="router-link" activeClassName="router-link-active" tabIndex="-1">
								<Settings className="sidebar-icon" />
							</NavLink>
						</li>
					</ul>
				</ul>
				<div className="contact-center">
					<div className="vertical-center me-2">
						<HeadsetMicOutlined />
					</div>
					<div className="d-flex flex-column">
						<b>{globalValue('projectPhone')}</b>
						<b>{t('contact_center')}</b>
					</div>
				</div>
				<div className="cashbox-version">
					<p className="text-center mb-2" title={version}>
						<b>{t('version')}</b> <br />
						<b>1</b>
					</p>
				</div>
			</div>
		</div>
	)
}

export default Sidebar
