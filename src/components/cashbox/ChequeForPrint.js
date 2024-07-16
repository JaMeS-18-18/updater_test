import React, { useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print';
import useDidMountEffect from './useDidMountEffect'

function ChequeForPrint({ data }) {
	const componentRef = useRef();
	const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

	useDidMountEffect(() => {
	}, [data])

	return (
		<div ref={componentRef}>
			I am cheque
		</div>
	)
}

export default ChequeForPrint
