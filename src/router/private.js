import React from 'react'
import { Redirect, Route } from 'react-router-dom'
const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
	if(token) {
		return true;
	} else {
		return false;
	}
}

export default function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/auth/login",
            }}
          />
        )
      }
    />
  );
}
