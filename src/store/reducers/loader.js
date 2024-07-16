const loaderReducer = function (state = false, action) {
  switch (action.type) {
    case "SHOW_LOADER":
      return true;
    case "HIDE_LOADER":
      return false;
    default:
      return false;
  }
};

export default loaderReducer