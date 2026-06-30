// be\src\modules\cmms\workOrders\controller\workOrderController.js
import workOrderService from "../services/workOrderService.js";
import getPredictiveHealthService from "../analytics/getPredictiveHealth.js";
import getAssetHealthStatus from "../analytics/getAssetHealthStatus.js";
import getMaintenanceRecommendation from "../analytics/getMaintenanceRecommendation.js";
import workOrderAutoService from "../services/workOrderAutoService.js";
import getAutonomousMaintenanceEngine from "../analytics/getAutonomousMaintenanceEngine.js";

/* =========================
   CRUD
========================= */

const getAll = async (req, res) => {
 try {
  const data = await workOrderService.getAll(req.query);

  return res.status(200).json({
   success: true,
   message: "Success",
   data,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getById = async (req, res) => {
 try {
  const data = await workOrderService.getById(req.params.id);

  if (!data) {
   return res.status(404).json({
    success: false,
    message: "Data not found",
   });
  }

  return res.status(200).json({
   success: true,
   message: "Success",
   data,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const create = async (req, res) => {
 try {
  const data = await workOrderService.create(req.body, req.user);

  return res.status(201).json({
   success: true,
   message: "Created",
   data,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const update = async (req, res) => {
 try {
  const data = await workOrderService.update(
   req.params.id,
   req.body,
   req.user
  );

  return res.status(200).json({
   success: true,
   message: "Updated",
   data,
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

const remove = async (req, res) => {
 try {
  await workOrderService.remove(req.params.id);

  return res.status(200).json({
   success: true,
   message: "Deleted",
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: error.message,
  });
 }
};

/* =========================
   ANALYTICS
========================= */

const getPredictiveHealth = async (req, res) => {
 try {
  const result = await getPredictiveHealthService(
   req.params.assetId
  );

  return res.status(200).json({
   success: true,
   message: "Success",
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const getAssetHealth = async (req, res) => {
 try {
  const result = await getAssetHealthStatus(req.params.assetId);

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const autoMaintenanceCheck = async (req, res) => {
 try {
  const result = await getMaintenanceRecommendation(
   req.params.assetId
  );

  if (result.recommendation === "CREATE_WORK_ORDER") {
   await workOrderAutoService.createAutoWorkOrder(
    req.params.assetId,
    "PREDICTIVE FAILURE"
   );
  }

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const dashboard = async (req, res) => {
 try {
  const result = await getDashboardSummary();

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const aiPredictive = async (req, res) => {
 try {
  const result = await getAIPredictiveEngine(
   req.params.assetId
  );

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const autonomousMaintenance = async (req, res) => {
 try {
  const result = await getAutonomousMaintenanceEngine(
   req.params.assetId
  );

  if (result.action === "AUTO_CREATE_WORK_ORDER") {
   await autoService.createAutoWorkOrder(
    req.params.assetId,
    "AUTONOMOUS FAILURE DETECTED"
   );
  }

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const optimization = async (req, res) => {
 try {
  const result = await getCMMSOptimizationEngine();

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};

const orchestrator = async (req, res) => {
 try {
  const result = await getCMMSOrchestrator(
   req.params.assetId
  );

  return res.status(200).json({
   success: true,
   data: result,
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: error.message,
  });
 }
};


export default {
 getAll,
 getById,
 getPredictiveHealth,
 getAssetHealth,
 autoMaintenanceCheck,
 aiPredictive, 
 autonomousMaintenance,
 dashboard,
 optimization,
 orchestrator,
 create,
 update,
 remove,
};