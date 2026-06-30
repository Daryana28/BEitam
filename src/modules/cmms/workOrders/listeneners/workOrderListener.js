// be\src\modules\cmms\workOrders\listeneners\workOrderListener.js
import eventBus from "../../../infra/eventBus.js";
import getAIPredictiveEngine from "../analytics/getAIPredictiveEngine.js";

eventBus.on("WORKORDER_CREATED", async (wo) => {
 const result = await getAIPredictiveEngine(wo.asset_id);

 console.log("AI ANALYSIS TRIGGERED:", result);

 // bisa lanjut:
 // - auto alert
 // - auto maintenance
 // - push notification
});