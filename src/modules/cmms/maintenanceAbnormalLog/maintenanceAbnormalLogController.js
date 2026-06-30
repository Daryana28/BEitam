import { MaintenanceActual, MaintenanceAbnormalLog, MaintenanceLogSheet, MaintenanceSchedule, Asset, StandardMaintenanceCheck, StandardMaintenanceDetail, StandardMaintenance, AssetCategory, sequelize } from "../../../models/index.js";

export const submitAbnormalLog = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; // actual_id
    const { deskripsi_kerusakan, tindakan, status_temuan } = req.body;

    if (!deskripsi_kerusakan || !tindakan) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Deskripsi kerusakan dan tindakan wajib diisi" });
    }

    const actual = await MaintenanceActual.findByPk(id, {
      include: [{ model: MaintenanceSchedule, as: "schedule" }]
    });

    if (!actual) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Actual record not found" });
    }

    const userId = req.user?.id || req.user?.user_id || null;
    const statusTemuan = status_temuan || "OPEN";

    // 1. Create or update the MaintenanceAbnormalLog
    let abnormalLog = await MaintenanceAbnormalLog.findOne({
      where: { actual_id: id }
    });

    if (abnormalLog) {
      await abnormalLog.update({
        deskripsi_kerusakan,
        tindakan,
        status_temuan: statusTemuan,
        resolved_by: statusTemuan === "APPROVED" || statusTemuan === "RESOLVED" ? userId : null,
        resolved_at: statusTemuan === "APPROVED" || statusTemuan === "RESOLVED" ? new Date() : null
      }, { transaction });
    } else {
      abnormalLog = await MaintenanceAbnormalLog.create({
        actual_id: id,
        deskripsi_kerusakan,
        tindakan,
        status_temuan: statusTemuan,
        resolved_by: statusTemuan === "APPROVED" || statusTemuan === "RESOLVED" ? userId : null,
        resolved_at: statusTemuan === "APPROVED" || statusTemuan === "RESOLVED" ? new Date() : null
      }, { transaction });
    }

    // 2. Update status and legend in MaintenanceActual depending on status_temuan
    if (statusTemuan === "RESOLVED" || statusTemuan === "APPROVED") {
      await actual.update({
        status: "ACTUAL",
        legend: "✓"
      }, { transaction });
    } else {
      await actual.update({
        status: "ABNORMAL",
        legend: "✗"
      }, { transaction });
    }

    // 3. Sync to legacy MaintenanceLogSheet table to preserve compatibility
    let logSheet = await MaintenanceLogSheet.findOne({
      where: { actual_id: id }
    });

    if (logSheet) {
      await logSheet.update({
        temuan: deskripsi_kerusakan,
        tindakan,
        status_temuan: statusTemuan,
        tanggal_temuan: actual.tanggal,
        created_by: userId
      }, { transaction });
    } else {
      await MaintenanceLogSheet.create({
        schedule_id: actual.schedule_id,
        actual_id: id,
        temuan: deskripsi_kerusakan,
        tindakan,
        status_temuan: statusTemuan,
        tanggal_temuan: actual.tanggal,
        created_by: userId
      }, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Laporan abnormal berhasil disubmit",
      data: {
        id: abnormalLog.id,
        actual_id: id,
        status: "ABNORMAL",
        legend: "✗",
        abnormal: {
          deskripsi_kerusakan: abnormalLog.deskripsi_kerusakan,
          tindakan: abnormalLog.tindakan,
          status: abnormalLog.status_temuan
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Submit abnormal log error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAbnormalLogs = async (req, res) => {
  try {
    const { status, category } = req.query;

    const whereClause = {};
    if (status) {
      whereClause.status_temuan = status;
    }

    const actualIncludeWhere = {};
    if (category) {
      // Filter by category inside the schedule or standard maintenance
      // To keep it simple, we can filter standard checks
    }

    const actualInclude = {
      model: MaintenanceActual,
      as: "actual",
      include: [
        {
          model: MaintenanceSchedule,
          as: "schedule",
          required: false,
          include: [
            {
              model: Asset,
              as: "asset",
              required: false,
              include: [
                {
                  model: AssetCategory,
                  as: "category",
                  required: false,
                  include: [
                    {
                      model: AssetCategory,
                      as: "parent",
                      required: false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: StandardMaintenanceCheck,
          as: "check",
          required: false,
          include: [
            {
              model: StandardMaintenanceDetail,
              as: "standard_maintenance_detail",
              required: false,
              include: [
                {
                  model: StandardMaintenance,
                  as: "standard_maintenance",
                  required: false
                }
              ]
            }
          ]
        }
      ]
    };

    if (Object.keys(actualIncludeWhere).length > 0) {
      actualInclude.where = actualIncludeWhere;
    }

    const logs = await MaintenanceAbnormalLog.findAll({
      where: whereClause,
      include: [actualInclude],
      order: [["created_at", "DESC"]]
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Get all abnormal logs error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbnormalLogsBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const logs = await MaintenanceAbnormalLog.findAll({
      include: [
        {
          model: MaintenanceActual,
          as: "actual",
          where: { schedule_id: scheduleId },
          include: [
            {
              model: StandardMaintenanceCheck,
              as: "check"
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Get abnormal logs by schedule error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
