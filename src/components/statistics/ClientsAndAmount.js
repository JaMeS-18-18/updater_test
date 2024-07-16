import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import Chart from 'react-apexcharts'
import DatePicker from "react-datepicker";
import { formatBackendDate } from 'helpers/helpers'
import { GET } from 'api/api'

function ClientsAndAmount() {
	const { t } = useTranslation();
	const cashbox = useSelector(state => state.cashbox)
	const reduxSettings = useSelector(state => state.settings.settings)

	var date = new Date();
	const [filterData, setFilterData] = useState({
		'startDate': new Date(date.setDate(date.getDate() - 1)),
		'endDate': new Date(),
	});
	const [show, setShow] = useState(false)

	const [data, setData] = useState({
		series: [{
			name: t('number_of_clients'),
			type: 'column',
			data: []
		}, 
		{
			name: t('sales_amount'),
			type: 'line',
			data: []
		}],
		options: {
			chart: {
				height: 350,
				type: 'line',
				foreColor: reduxSettings.darkTheme ? '#ffffff': '#7b8190'
			},
			stroke: {
				width: [0, 4]
			},
			dataLabels: {
				enabled: false,
			},
			legend: {
				show: false
			},
			xaxis: {
				categories: [],
			},
			yaxis: [{
				title: {
					text: t('number_of_clients'),
				},
			},
			{
				opposite: true,
				title: {
					text: t('sales_amount')
				}
			}]
		},
	})

	function getData() {
		setShow(false)
		var sendData = {
			'chequeDate': formatBackendDate(new Date(filterData.startDate)),
		}
		var prepare = {
			'series0': [],
			'series1': [],
			'categories': [],
		}
		GET("/services/desktop/api/report-cheque-hour/" + cashbox.posId + "/" + cashbox.cashboxId, sendData, false, false).then(response => {
			for (let i = 0; i < response.length; i++) {
				prepare.series0.push(response[i]['countCheque'])
				prepare.series1.push(response[i]['totalPrice'])
				prepare.categories.push(response[i]['chequeHour'])
			}
			var dataCopy = {...data}
			dataCopy.series[0]['data'] = prepare.series0
			dataCopy.series[1]['data'] = prepare.series1
			dataCopy.options.xaxis.categories = prepare.categories

			setData(dataCopy)
			setShow(true)
		})
	}

	useEffect(() => {
		getData()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps
	
	return (
		<div className="min-height320">
			<div className="d-flex mb-2">
				<div className="me-2">
					<DatePicker className="form-control"
					selected={filterData.startDate}
					dateFormat="dd-MM-yyyy"
					onChange={(date) => setFilterData({...filterData, 'startDate': date})} />
				</div>
				<div>
					<button className="btn btn-primary" onClick={getData}>
						{t('filter')}
					</button>
				</div>
			</div>
			{ show ?
				<Chart options={data.options} series={data.series} type="line" height={320} />
				:
				<h2 className="text-center">
					{t('loading')}...
				</h2>
			}
		</div>
	)
}

export default ClientsAndAmount
