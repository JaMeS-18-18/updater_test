import React from 'react'
import Titlebar from './Titlebar'

function AuthLayout({ children }) {
	return (
		<>
			<Titlebar />
			<div className="position-relative">
				{children}
			</div>
		</>
	)
}

export default AuthLayout
