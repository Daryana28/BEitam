// be/src/models/index.js
import sequelize from "../config/db/db.js";

import CompanyModel from "./shared/companyModel.js";
import DepartmentModel from "./shared/departmentModel.js";
import JobLevelModel from "./shared/jobLevelModel.js";
import UserModel from "./auth/userModel.js";
import RoleModel from "./auth/roleModel.js";
import PermissionModel from "./auth/permissionModel.js";
import UserRoleModel from "./auth/userRoleModel.js";
import RolePermissionModel from "./auth/rolePermissionModel.js";

import AssetCategoryModel from "./itam/assetCategoryModel.js";
import AssetLocationModel from "./itam/assetLocationModel.js";
import AssetModel from "./itam/assetModel.js";
import AssetFileModel from "./itam/assetFileModel.js";
import PartModel from "./itam/partModel.js";
import WarehouseStockModel from "./itam/warehouseStockModel.js";
import InventoryTransactionModel from "./itam/inventoryTransactionModel.js";
import AssetBudgetModel from "./itam/assetBudgetModel.js";

import TicketModel from "./itsm/ticketModel.js";

import WorkOrderModel from "./cmms/workOrderModel.js";
import YearlyStandardMaintenanceModel from "./cmms/yearlyStandardMaintenanceModel.js";
import StandardMaintenanceModel from "./cmms/standardMaintenanceModel.js";
import StandardMaintenanceDetailModel from "./cmms/standardMaintenanceDetailModel.js";
import StandardMaintenanceCheckModel from "./cmms/standardMaintenanceCheckModel.js";
import MaintenanceScheduleModel from "./cmms/maintenanceScheduleModel.js";
import MaintenanceLogSheetModel from "./cmms/maintenanceLogSheetModel.js";
import MaintenanceActualModel from "./cmms/maintenanceActualModel.js";
import MaintenanceAbnormalLogModel from "./cmms/maintenanceAbnormalLogModel.js";

import AuditLogModel from "./shared/auditLogModel.js";
import AssetLifecycleModel from "./legacy/assetLifecycleModel.js";
import HolidayModel from "./shared/holidayModel.js";

const Company = CompanyModel(sequelize);
const Department = DepartmentModel(sequelize);
const JobLevel = JobLevelModel(sequelize);
const User = UserModel(sequelize);
const Role = RoleModel(sequelize);
const Permission = PermissionModel(sequelize);
const UserRole = UserRoleModel(sequelize);
const RolePermission = RolePermissionModel(sequelize);

const AssetCategory = AssetCategoryModel(sequelize);
const AssetLocation = AssetLocationModel(sequelize);
const Asset = AssetModel(sequelize);
const AssetFile = AssetFileModel(sequelize);

const Part = PartModel(sequelize);
const WarehouseStock = WarehouseStockModel(sequelize);
const InventoryTransaction =
 InventoryTransactionModel(sequelize);
const AssetBudget = AssetBudgetModel(sequelize);

const Ticket = TicketModel(sequelize);
const WorkOrder = WorkOrderModel(sequelize);
const YearlyStandardMaintenance = YearlyStandardMaintenanceModel(sequelize);
const StandardMaintenance = StandardMaintenanceModel(sequelize);
const StandardMaintenanceDetail = StandardMaintenanceDetailModel(sequelize);
const StandardMaintenanceCheck = StandardMaintenanceCheckModel(sequelize);
const MaintenanceSchedule = MaintenanceScheduleModel(sequelize);
const MaintenanceLogSheet = MaintenanceLogSheetModel(sequelize);
const MaintenanceActual = MaintenanceActualModel(sequelize);
const MaintenanceAbnormalLog = MaintenanceAbnormalLogModel(sequelize);

const AuditLog = AuditLogModel(sequelize);
const AssetLifecycle = AssetLifecycleModel(sequelize);
const Holiday = HolidayModel(sequelize);

/* RELATION */

Company.hasMany(Department, {
 foreignKey: "company_id",
});

Department.belongsTo(Company, {
 foreignKey: "company_id",
});

Company.hasMany(User, {
 foreignKey: "company_id",
});

User.belongsTo(Company, {
 foreignKey: "company_id",
});

Department.hasMany(User, {
 foreignKey: "department_id",
});

User.belongsTo(Department, {
 foreignKey: "department_id",
});

JobLevel.hasMany(User, {
 foreignKey: "job_level_id",
});

User.belongsTo(JobLevel, {
 foreignKey: "job_level_id",
 as: "jobLevel",
});

User.hasMany(User, {
 foreignKey: "supervisor_id",
 as: "subordinates",
});

User.belongsTo(User, {
 foreignKey: "supervisor_id",
 as: "supervisor",
});


User.belongsToMany(Role, {
 through: UserRole,
 foreignKey: "user_id",
 otherKey: "role_id",
 as: "roles",
});

Role.belongsToMany(User, {
 through: UserRole,
 foreignKey: "role_id",
 otherKey: "user_id",
 as: "users",
});

Role.belongsToMany(Permission, {
 through: RolePermission,
 foreignKey: "role_id",
 otherKey:
  "permission_id",
 as: "permissions",
});

Permission.belongsToMany(Role, {
 through: RolePermission,
 foreignKey:
  "permission_id",
 otherKey: "role_id",
 as: "roles",
});

AssetCategory.hasMany(Asset, {
 foreignKey: "category_id",
});

Asset.belongsTo(
 AssetCategory,
 {
  foreignKey:
   "category_id",
  as: "category",
 }
);

// Self-referential: parent category
AssetCategory.belongsTo(AssetCategory, {
 foreignKey: "parent_id",
 as: "parent",
});
AssetCategory.hasMany(AssetCategory, {
 foreignKey: "parent_id",
 as: "children",
});

AssetLocation.hasMany(Asset, {
 foreignKey: "location_id",
});

Asset.belongsTo(
 AssetLocation,
 {
  foreignKey:
   "location_id",
  as: "location",
 }
);

Asset.hasMany(AssetFile, {
 foreignKey: "asset_id",
 as: "files",
});

AssetFile.belongsTo(Asset, {
 foreignKey: "asset_id",
 as: "asset",
});

Asset.hasMany(
 AssetLifecycle,
 {
  foreignKey:
   "asset_id",
  as: "lifecycles",
 }
);

AssetLifecycle.belongsTo(
 Asset,
 {
  foreignKey:
   "asset_id",
  as: "asset",
 }
);

User.hasMany(
 AssetLifecycle,
 {
  foreignKey:
   "created_by",
  as:
   "assetLifecycleCreated",
 }
);

AssetLifecycle.belongsTo(
 User,
 {
  foreignKey:
   "created_by",
  as: "creator",
 }
);

User.hasMany(Ticket, {
 foreignKey:
  "requester_id",
 as:
  "requestedTickets",
});

Ticket.belongsTo(User, {
 foreignKey:
  "requester_id",
 as: "requester",
});

User.hasMany(Ticket, {
 foreignKey:
  "assigned_to",
 as:
  "assignedTickets",
});

Ticket.belongsTo(User, {
 foreignKey:
  "assigned_to",
 as: "assignee",
});

Ticket.hasMany(
 WorkOrder,
 {
  foreignKey:
   "ticket_id",
 }
);

WorkOrder.belongsTo(
 Ticket,
 {
  foreignKey:
   "ticket_id",
 }
);

Asset.hasMany(
 WorkOrder,
 {
  foreignKey:
   "asset_id",
 }
);

WorkOrder.belongsTo(
 Asset,
 {
  foreignKey:
   "asset_id",
 }
);

User.hasMany(
 WorkOrder,
 {
  foreignKey:
   "request_by",
  as:
   "requestedWO",
 }
);

WorkOrder.belongsTo(
 User,
 {
  foreignKey:
   "request_by",
  as: "requester",
 }
);

User.hasMany(
 WorkOrder,
 {
  foreignKey:
   "assigned_to",
  as:
   "assignedWO",
 }
);

WorkOrder.belongsTo(
 User,
 {
  foreignKey:
   "assigned_to",
  as: "assignee",
 }
);

Part.hasMany(
 WarehouseStock,
 {
  foreignKey:
   "part_id",
 }
);

WarehouseStock.belongsTo(
 Part,
 {
  foreignKey:
   "part_id",
 }
);

Part.hasMany(
 InventoryTransaction,
 {
  foreignKey:
   "part_id",
 }
);

InventoryTransaction.belongsTo(
 Part,
 {
  foreignKey:
   "part_id",
 }
);

WorkOrder.hasMany(
 InventoryTransaction,
 {
  foreignKey:
   "wo_id",
 }
);

InventoryTransaction.belongsTo(
 WorkOrder,
 {
  foreignKey:
   "wo_id",
 }
);

User.hasMany(AuditLog, {
 foreignKey: "user_id",
});

AuditLog.belongsTo(User, {
 foreignKey: "user_id",
});

YearlyStandardMaintenance.hasMany(StandardMaintenance, {
  foreignKey: "yearly_standard_id",
  as: "perangkatList",
});
StandardMaintenance.belongsTo(YearlyStandardMaintenance, {
  foreignKey: "yearly_standard_id",
});

StandardMaintenance.hasMany(StandardMaintenanceDetail, {
  foreignKey: "standard_maintenance_id",
  as: "details",
});
StandardMaintenanceDetail.belongsTo(StandardMaintenance, {
  foreignKey: "standard_maintenance_id",
  as: "standard_maintenance",
});

StandardMaintenanceDetail.hasMany(StandardMaintenanceCheck, {
  foreignKey: "standard_maintenance_detail_id",
  as: "pengecekanList",
});
StandardMaintenanceCheck.belongsTo(StandardMaintenanceDetail, {
  foreignKey: "standard_maintenance_detail_id",
  as: "standard_maintenance_detail",
});

Asset.hasMany(MaintenanceSchedule, { foreignKey: "asset_id", as: "schedules" });
MaintenanceSchedule.belongsTo(Asset, { foreignKey: "asset_id", as: "asset" });

YearlyStandardMaintenance.hasMany(MaintenanceSchedule, { foreignKey: "yearly_standard_id" });
MaintenanceSchedule.belongsTo(YearlyStandardMaintenance, { foreignKey: "yearly_standard_id" });

StandardMaintenance.hasMany(MaintenanceSchedule, { foreignKey: "standard_maintenance_id" });
MaintenanceSchedule.belongsTo(StandardMaintenance, { foreignKey: "standard_maintenance_id" });

MaintenanceSchedule.hasMany(MaintenanceLogSheet, { foreignKey: "schedule_id", as: "logSheets" });
MaintenanceLogSheet.belongsTo(MaintenanceSchedule, { foreignKey: "schedule_id", as: "schedule" });

User.hasMany(MaintenanceLogSheet, { foreignKey: "created_by", as: "logSheetsCreated" });
MaintenanceLogSheet.belongsTo(User, { foreignKey: "created_by", as: "creator" });

MaintenanceSchedule.hasMany(MaintenanceActual, { foreignKey: "schedule_id", as: "actuals" });
MaintenanceActual.belongsTo(MaintenanceSchedule, { foreignKey: "schedule_id", as: "schedule" });

StandardMaintenanceCheck.hasMany(MaintenanceActual, { foreignKey: "check_id", as: "actuals" });
MaintenanceActual.belongsTo(StandardMaintenanceCheck, { foreignKey: "check_id", as: "check" });

MaintenanceActual.hasMany(MaintenanceAbnormalLog, { foreignKey: "actual_id", as: "abnormalLogs" });
MaintenanceAbnormalLog.belongsTo(MaintenanceActual, { foreignKey: "actual_id", as: "actual" });

User.hasMany(MaintenanceActual, { foreignKey: "created_by", as: "actualsCreated" });
MaintenanceActual.belongsTo(User, { foreignKey: "created_by", as: "creator" });

User.hasMany(MaintenanceAbnormalLog, { foreignKey: "resolved_by", as: "abnormalLogsResolved" });
MaintenanceAbnormalLog.belongsTo(User, { foreignKey: "resolved_by", as: "resolver" });

MaintenanceActual.hasMany(MaintenanceLogSheet, { foreignKey: "actual_id", as: "logSheets" });
MaintenanceLogSheet.belongsTo(MaintenanceActual, { foreignKey: "actual_id", as: "actual" });

export {
 sequelize,
 Company,
 Department,
 JobLevel,
 User,
 Role,
 Permission,
 UserRole,
 RolePermission,
 AssetCategory,
 AssetLocation,
 Asset,
 AssetFile,
 AssetLifecycle,
 Ticket,
 WorkOrder,
 YearlyStandardMaintenance,
 StandardMaintenance,
 StandardMaintenanceDetail,
 StandardMaintenanceCheck,
 MaintenanceSchedule,
 MaintenanceLogSheet,
 MaintenanceActual,
 MaintenanceAbnormalLog,
 Part,
 WarehouseStock,
 InventoryTransaction,
 AssetBudget,
 AuditLog,
 Holiday,
};

export default {
 sequelize,
 Company,
 Department,
 JobLevel,
 User,
 Role,
 Permission,
 UserRole,
 RolePermission,
 AssetCategory,
 AssetLocation,
 Asset,
 AssetFile,
 AssetLifecycle,
 Ticket,
 WorkOrder,
 YearlyStandardMaintenance,
 StandardMaintenance,
 StandardMaintenanceDetail,
 StandardMaintenanceCheck,
 MaintenanceSchedule,
 MaintenanceLogSheet,
 MaintenanceActual,
 MaintenanceAbnormalLog,
 Part,
 WarehouseStock,
 InventoryTransaction,
 AssetBudget,
 AuditLog,
 Holiday,
};