// be\src\modules\cmms\workOrders\controller\sensorListener.js
import eventBus from "../../../infra/eventBus.js";
import getAIPredictiveEngine from "../analytics/getAIPredictiveEngine.js";

eventBus.on("SENSOR_DATA", async (data) => {
 const { asset_id, vibration, temperature } = data;

 console.log("📡 SENSOR STREAM:", data);

 // SIMPLE ANOMALY RULE ENGINE
 if (temperature > 80 || vibration > 7) {
  console.log("🚨 ANOMALY DETECTED");

  const prediction = await getAIPredictiveEngine(asset_id);

  eventBus.emit("ASSET_ALERT", {
   asset_id,
   prediction,
   severity: "HIGH",
  });
 }
});