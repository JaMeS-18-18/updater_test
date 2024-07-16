import Cashbox from '../../components/cashbox/Cashbox'
import PriceTags from '../../components/priceTags/PriceTags'
import Return from '../../components/return/Return'
import Cheques from '../../components/cheques/Cheques'
import Settings from '../../components/settings/Settings'
import Report from '../../components/report/Report'
import Ofd from '../../components/ofd/Index'
import Statistics from '../../components/statistics/Statistics'
import SelectedProducts from '../../components/selectedProducts/SelectedProducts'
import Admin from '../../components/admin/Admin'
import Test from '../../components/Test'

const routes = [
	{
		path: "/",
		component: Cashbox,
		private: true,
		exact: true,
	},
	{
		path: "/price-tags",
		component: PriceTags,
		private: true,
		exact: true,
	},
	{
		path: "/return/:id?",
		component: Return,
		private: true,
		exact: true,
	},
	{
		path: "/cheques",
		component: Cheques,
		private: true,
		exact: true,
	},
	{
		path: "/report",
		component: Report,
		private: true,
		exact: true,
	},
	{
		path: "/statistics",
		component: Statistics,
		private: true,
		exact: true,
	},
	{
		path: "/selected-products",
		component: SelectedProducts,
		private: true,
		exact: true,
	},
	{
		path: "/ofd",
		component: Ofd,
		private: true,
		exact: true,
	},
	{
		path: "/settings",
		component: Settings,
		private: true,
		exact: true,
	},
	{
		path: "/admin",
		component: Admin,
		private: true,
		exact: true,
	},
	{
		path: "/test",
		component: Test,
		private: true,
		exact: true,
	},
];

export default routes;