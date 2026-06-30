import { MaintenanceActual, MaintenanceAbnormalLog, MaintenanceLogSheet, sequelize } from "../../../models/index.js";

export const createActualEntry = async (req, res) => {
  try {
    const { check_id, tanggal } = req.body;

    if (!check_id || !tanggal) {
      return res.status(400).json({ success: false, message: "check_id and tanggal are required" });
    }

    const existing = await MaintenanceActual.findOne({
      where: { check_id, tanggal }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Actual record already exists",
        data: existing
      });
    }

    const actual = await MaintenanceActual.create({
      schedule_id: null,
      check_id,
      tanggal,
      status: "PLAN",
      legend: "□",
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
    const { check_id, tanggal, status } = req.body;

    if (!check_id || !tanggal) {
      return res.status(400).json({ success: false, message: "check_id and tanggal are required" });
    }

    const userId = req.user?.id || req.user?.user_id || null;

    // Find or create the actual record
    let actual = await MaintenanceActual.findOne({
      where: { check_id, tanggal }
    });

    const isNew = !actual;

    if (!actual) {
      actual = await MaintenanceActual.create({
        schedule_id: null,
        check_id,
        tanggal,
        status: "PLAN",
        legend: "□",
        created_by: userId,
      });
    }

    // Update status if provided
    if (status && ["PLAN", "ACTUAL"].includes(status)) {
      if (status === "ACTUAL") {
        await actual.update({
          status: "ACTUAL",
          legend: "✓",
          created_by: userId,
        });
      } else {
        await actual.update({
          status: "PLAN",
          legend: "□",
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
    const { id } = req.params;
    const { status } = req.body;

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
        created_by: userId
      }, { transaction });
    } else {
      // PLAN - reset
      await actual.update({
        status: "PLAN",
        legend: "□",
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
      data: { id: actual.id, status: actual.status, legend: actual.legend }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Update actual status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
