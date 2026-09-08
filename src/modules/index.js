// be/src/modules/index.js
import express from "express";

import authRoutes from "./auth/authRoute.js";

import ticketRoutes from "./itsm/tickets/ticketRoute.js";
import incidentRoutes from "./itsm/incidents/incidentRoute.js";
import serviceRequestRoutes from "./itsm/serviceRequests/serviceRequestRoute.js";

import workOrderRoutes from "./cmms/workOrders/route/workOrderRoute.js";
import standardMaintenanceRoutes from "./cmms/standardMaintenance/standardMaintenanceRoute.js";
import maintenanceScheduleRoutes from "./cmms/maintenanceSchedule/maintenanceScheduleRoute.js";
import maintenanceLogSheetRoutes from "./cmms/maintenanceLogSheet/maintenanceLogSheetRoute.js";
import maintenanceActualRoutes from "./cmms/maintenanceActual/maintenanceActualRoute.js";
import maintenanceAbnormalLogRoutes from "./cmms/maintenanceAbnormalLog/maintenanceAbnormalLogRoute.js";

import assetRoutes from "./itam/assets/assetRoute.js";
import assetFileRoutes from "./itam/assetFiles/assetFileRoute.js";
import assetCategoryRoutes from "./itam/assetCategories/assetCategoryRoute.js";
import assetBudgetRoutes from "./itam/assetBudget/assetBudgetRoute.js";
import assetBudgetScheduleRoutes from "./itam/assetBudgetSchedule/assetBudgetScheduleRoute.js";
import operationalBudgetRoutes from "./itam/operationalBudget/operationalBudgetRoute.js";
import operationalBudgetScheduleRoutes from "./itam/operationalBudgetSchedule/operationalBudgetScheduleRoute.js";
import assetLifecycleRoutes from "./itam/assetLifecycle/assetLifecycleRoute.js";
import phishingMonitoringRoutes from "./itam/phishingMonitoring/phishingMonitoringRoute.js";
import vulnerabilityRoutes from "./itam/vulnerability/vulnerabilityRoute.js";

import userRoutes from "./user/userRoute.js";

import inventoryRoutes from "./itam/inventory/inventoryRoute.js";
import holidayRoutes from "./cmms/holiday/holidayRoutes.js";
import dashboardRoutes from "./dashboard/dashboardRoute.js";
import guideImageRoutes from "./shared/guideImages/guideImageRoute.js";
import databaseMonitoringRoutes from "./databaseMonitoring/databaseMonitoringRoute.js";

const router =
    express.Router();

router.use(
    "/auth",
    authRoutes
);

router.use(
    "/tickets",
    ticketRoutes
);

router.use(
    "/incidents",
    incidentRoutes
);

router.use(
    "/service-requests",
    serviceRequestRoutes
);

router.use(
    "/work-orders",
    workOrderRoutes
);

router.use(
    "/standard-maintenance",
    standardMaintenanceRoutes
);

router.use(
    "/maintenance-schedule",
    maintenanceScheduleRoutes
);

router.use(
    "/maintenance-log-sheets",
    maintenanceLogSheetRoutes
);

router.use(
    "/maintenance-actual",
    maintenanceActualRoutes
);

router.use(
    "/maintenance-abnormal-logs",
    maintenanceAbnormalLogRoutes
);

router.use(
    "/assets",
    assetRoutes
);

router.use(
    "/assets",
    assetFileRoutes
);

router.use(
    "/asset-categories",
    assetCategoryRoutes
);

router.use(
    "/asset-budgets",
    assetBudgetRoutes
);

router.use(
    "/asset-budget-schedules",
    assetBudgetScheduleRoutes
);

router.use(
    "/operational-budgets",
    operationalBudgetRoutes
);

router.use(
    "/operational-budget-schedules",
    operationalBudgetScheduleRoutes
);

router.use(
    "/",
    assetLifecycleRoutes
);

router.use(
    "/users",
    userRoutes
);

router.use(
    "/inventory",
    inventoryRoutes
);

router.use(
    "/holidays",
    holidayRoutes
);

router.use(
    "/dashboard",
    dashboardRoutes
);

router.use(
    "/phishing-monitoring",
    phishingMonitoringRoutes
);

router.use(
    "/vulnerability",
    vulnerabilityRoutes
);

router.use(
    "/guide-images",
    guideImageRoutes
);

router.use(
    "/database-monitoring",
    databaseMonitoringRoutes
);

export default router;
