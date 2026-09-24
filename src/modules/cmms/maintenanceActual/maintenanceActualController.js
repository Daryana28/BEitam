import { MaintenanceActual, MaintenanceAbnormalLog, MaintenanceLogSheet, sequelize } from "../../../models/index.js";

const normalizeActualNote = (value) => {
  const text = String(value || "").trim();
  return text || null;
};

let maintenanceActualNoteColumnAvailable = null;

const ensureMaintenanceActualNoteColumn = async (transaction) => {
  if (maintenanceActualNoteColumnAvailable) return;

  const [rows] = await sequelize.query(
    `
      SELECT 1 AS is_available
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'maintenance_actual'
        AND COLUMN_NAME = 'actual_note'
    `,
    { transaction }
  );

  maintenanceActualNoteColumnAvailable = Array.isArray(rows) && rows.length > 0;

  if (!maintenanceActualNoteColumnAvailable) {
    await sequelize.query(
      `
        ALTER TABLE dbo.maintenance_actual
        ADD actual_note NVARCHAR(MAX) NULL
      `,
      { transaction }
    );
    maintenanceActualNoteColumnAvailable = true;
  }
};

export const createActualEntry = async (req, res) => {
  try {
    await ensureMaintenanceActualNoteColumn();
    const { schedule_id, check_id, tanggal, actual_note } = req.body;

    if (!check_id || !tanggal) {
      return res.status(400).json({ success: false, message: "check_id and tanggal are required" });
    }

    const whereClause = schedule_id
      ? { schedule_id, check_id, tanggal }
      : { schedule_id: null, check_id, tanggal };

    const existing = await MaintenanceActual.findOne({
      where: whereClause
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Actual record already exists",
        data: existing
      });
    }

    const actual = await MaintenanceActual.create({
      schedule_id: schedule_id || null,
      check_id,
      tanggal,
      status: "PLAN",
      legend: "□",
      actual_note: normalizeActualNote(actual_note),
      created_by: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Actual record created",
      data: actual
    });
  } catch (error) {
    console.error("Create actual entry error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertAndSetStatus = async (req, res) => {
  try {
    await ensureMaintenanceActualNoteColumn();
    const { schedule_id, check_id, tanggal, status, actual_note } = req.body;

    if (!check_id || !tanggal) {
      return res.status(400).json({ success: false, message: "check_id and tanggal are required" });
    }

    const userId = req.user?.id || req.user?.user_id || null;

    // Find or create the actual record
    const whereClause = schedule_id
      ? { schedule_id, check_id, tanggal }
      : { schedule_id: null, check_id, tanggal };

    let actual = await MaintenanceActual.findOne({
      where: whereClause
    });

    const isNew = !actual;

    if (!actual) {
      actual = await MaintenanceActual.create({
        schedule_id: schedule_id || null,
        check_id,
        tanggal,
        status: "PLAN",
        legend: "□",
        actual_note: normalizeActualNote(actual_note),
        created_by: userId,
      });
    }

    // Update status if provided
    if (status && ["PLAN", "ACTUAL"].includes(status)) {
      if (status === "ACTUAL") {
        await actual.update({
          status: "ACTUAL",
          legend: "✓",
          actual_note: normalizeActualNote(actual_note),
          created_by: userId,
        });
      } else {
        await actual.update({
          status: "PLAN",
          legend: "□",
          actual_note: null,
          created_by: null,
        });
        await MaintenanceAbnormalLog.destroy({
          where: { actual_id: actual.id }
        });
        await MaintenanceLogSheet.destroy({
          where: { actual_id: actual.id }
        });
      }
    }

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? "Actual record created" : "Actual record updated",
      data: actual
    });
  } catch (error) {
    console.error("Upsert actual error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateActualStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    await ensureMaintenanceActualNoteColumn(transaction);
    const { id } = req.params;
    const { status, actual_note } = req.body;

    if (!status || !["PLAN", "ACTUAL"].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Status must be PLAN or ACTUAL" });
    }

    const actual = await MaintenanceActual.findByPk(id);
    if (!actual) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Actual record not found" });
    }

    const userId = req.user?.id || req.user?.user_id || null;

    if (status === "ACTUAL") {
      await actual.update({
        status: "ACTUAL",
        legend: "✓",
        actual_note: normalizeActualNote(actual_note),
        created_by: userId
      }, { transaction });
    } else {
      // PLAN - reset
      await actual.update({
        status: "PLAN",
        legend: "□",
        actual_note: null,
        created_by: null
      }, { transaction });

      // Delete associated abnormal logs if any
      await MaintenanceAbnormalLog.destroy({
        where: { actual_id: id },
        transaction
      });

      // Delete associated log sheets if any
      await MaintenanceLogSheet.destroy({
        where: { actual_id: id },
        transaction
      });
    }

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: `Status successfully updated to ${status}`,
      data: { id: actual.id, status: actual.status, legend: actual.legend, actual_note: actual.actual_note }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Update actual status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
