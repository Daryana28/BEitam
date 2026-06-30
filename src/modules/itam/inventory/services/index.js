// be/src/modules/itam/inventory/services/index.js
import stockIn from "./stockIn.js";
import stockOut from "./stockOut.js";
import adjustment from "./adjustment.js";
import getStockList from "./getStockList.js";
import getTransactionHistory from "./getTransactionHistory.js";

export default {
 stockIn,
 stockOut,
 adjustment,
 getStockList,
 getTransactionHistory,
};