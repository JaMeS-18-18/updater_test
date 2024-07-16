import React from 'react';

export const ErrorMessage = ({ error }) => {
	if (error === undefined) {
		return null;
	} else {
		return <div className="error-text fz14">{error.message}</div>;
	}
};