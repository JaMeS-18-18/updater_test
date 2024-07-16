const posesReducer = function (state = [], action) {
  switch (action.type) {
    case "SET_POS_LIST":
			return state = action.payload;
    default:
      return state;
  }
};

export default posesReducer