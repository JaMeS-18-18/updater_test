const initialState = {
	selectedProducts: [],
	wholesalePriceBoolean: false,
	updateProductsFromDB: 0,
	version: 0,
	tabCheque: {},
	chequesFilter: {},
	chequesSelected: {},
}

const accountReducer = function (state = initialState, action) {
	switch (action.type) {
		case "SET_SELECTED_PRODUCTS":
			return { ...state, 'selectedProducts': action.payload };
		case "SET_WHOLESALEPRICE_BOOLEAN":
			return { ...state, 'wholesalePriceBoolean': action.payload };
		case "SET_PRODUCTS_FROM_DB":
			return { ...state, 'updateProductsFromDB': action.payload };
		case "SET_VERSION":
			return { ...state, 'version': action.payload };
		case "SET_CHEQUES_FILTER":
			return { ...state, 'chequesFilter': action.payload };
		case "SET_CHEQUES_SELECTED":
			return { ...state, 'chequesSelected': action.payload };
		case "SET_TAB_CHEQUE":
			return { ...state, 'tabCheque': action.payload };
		default:
			return state;
	}
};

export default accountReducer