// be\src\modules\cmms\workOrders\listeneners\failureListener.js
import eventBus from "../../../infra/eventBus.js";

eventBus.on("WORKORDER_UPDATED", (wo) => {
 if (wo.status === "FAILED") {
  console.log("🚨 FAILURE DETECTED REALTIME:", wo.asset_id);

  eventBus.emit("ASSET_RISK_UPDATED", {
   asset_id: wo.asset_id,
   severity: "HIGH",
  });
 }
});