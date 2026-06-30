// be/src/modules/itam/inventory/inventoryRoute.js
import {
 Router,
} from "express";

import authMiddleware from "../../../middlewares/authMiddleware.js";
import read from "./controller/inventoryReadController.js";
import write from "./controller/inventoryWriteController.js";

const router =
 Router();

router.get(
 "/stock",
 authMiddleware,
 read.getStockList
);

router.get(
 "/history",
 authMiddleware,
 read.getTransactionHistory
);

router.post(
 "/stock-in",
 authMiddleware,
 write.stockIn
);

router.post(
 "/stock-out",
 authMiddleware,
 write.stockOut
);

router.post(
 "/adjustment",
 authMiddleware,
 write.adjustment
);

export default router;