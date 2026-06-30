// be\src\modules\cmms\workOrders\controller\iotController.js
import eventBus from "../../infra/eventBus.js";

const ingestSensorData = async (req, res) => {
 try {
  const payload = req.body;

  // EMIT REALTIME DATA STREAM
  eventBus.emit("SENSOR_DATA", payload);

  return res.status(200).json({
   success: true,
   message: "Sensor data received",
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

export default {
 ingestSensorData,
};