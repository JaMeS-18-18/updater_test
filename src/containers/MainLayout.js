import React from 'react'
import Sidebar from './Sidebar'
import Titlebar from './Titlebar'

function MainLayout({ children }) {
	return (
		<>
			<Titlebar />
			<Sidebar />
			<div className="pl-60 pr-10">
				{children}
			</div>
		</>
	)
}

export default MainLayout