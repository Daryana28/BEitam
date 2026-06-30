// be/src/modules/itam/assets/assetRoute.js
import {
 Router,
} from "express";

import read from "./controller/assetReadController.js";
import write from "./controller/assetWriteController.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router =
 Router();

router.get(
 "/next-code",
 authMiddleware,
 read.getNextCode
);

router.get(
 "/",
 authMiddleware,
 read.getAll
);

router.get(
 "/:id",
 authMiddleware,
 read.getById
);

router.get(
 "/:id/history",
 authMiddleware,
 read.getHistory
);

router.get(
 "/:id/lifecycle",
 authMiddleware,
 read.getLifecycle
);

router.post(
 "/bulk-import",
 authMiddleware,
 write.bulkImport
);

router.post(
 "/bulk-delete",
 authMiddleware,
 write.bulkDelete
);

router.post(
 "/:id/replace",
 authMiddleware,
 write.replace
);

router.post(
 "/:id/renew",
 authMiddleware,
 write.renewSoftware
);

router.post(
 "/",
 authMiddleware,
 write.create
);

router.put(
 "/:id",
 authMiddleware,
 write.update
);

router.patch(
 "/:id",
 authMiddleware,
 write.update
);

router.delete(
 "/:id",
 authMiddleware,
 write.remove
);

router.post(
 "/:id/change-user",
 authMiddleware,
 write.changeAssignedUser
);

router.post(
 "/:id/transfer-owner",
 authMiddleware,
 write.transferOwner
);

router.post(
 "/:id/transfer-department",
 authMiddleware,
 write.transferDepartment
);

router.post(
 "/:id/move-location",
 authMiddleware,
 write.moveLocation
);

router.post(
 "/:id/generate-qr",
 authMiddleware,
 write.generateQr
);

router.get(
 "/:id/qr",
 authMiddleware,
 write.generateQr
);

export default router;
