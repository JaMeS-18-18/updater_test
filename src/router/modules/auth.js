import Login from '../../components/auth/Login'
import Cashboxes from '../../components/auth/Cashboxes'

const auth = [
	{
		path: "/login",
		component: Login,
		exact: true,
		layout: 'auth'
	},
	{
		path: "/cashboxes",
		component: Cashboxes,
		exact: true,
		layout: 'auth'
	},
]

export default auth;