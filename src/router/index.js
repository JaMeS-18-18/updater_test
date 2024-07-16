import React, { Suspense } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
import MainLayout from '../containers/MainLayout'
import AuthLayout from '../containers/AuthLayout'
import Login from '../components/auth/Login'
import Cashboxes from '../components/auth/Cashboxes'

import routes from './modules/main'
import PrivateRoute from './private'

/* ПАСДА ИШЛАВОТГАН ВАРИАНТ */
function CreateRoutes() {
  return routes.map((item, key) => {
    if (item.private) {
      return (
				<PrivateRoute
					key={key}
					path={item.path}
					exact={item.exact}
					component={item.component}
				/>
      );
    }
    return (
			<Route key={key} path={item.path} exact={item.exact} component={item.component} />
		);
  });
}

function index() {
  return (
		<HashRouter>
			<Switch>
				
				<Route path='/auth/:path?' exact>
					<AuthLayout>
						<Switch>
							<Suspense fallback={<div>Loading... </div>}>
								<Route path='/auth/login' exact component={Login} />
								<Route path='/auth/cashboxes' exact component={Cashboxes} />
							</Suspense>
						</Switch>
					</AuthLayout>
				</Route>
				
				<Route>
					<MainLayout>
						<Switch>
							<Suspense fallback={<div>Loading... </div>}>
								{CreateRoutes()}
							</Suspense>
						</Switch>
					</MainLayout>
				</Route>
				
			</Switch>
		</HashRouter>
  )
}

export default index