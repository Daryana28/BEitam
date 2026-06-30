import { MaintenanceLogSheet, MaintenanceSchedule, Asset, User } from "../../../models/index.js";

export const getLogSheets = async (req, res) => {
  try {
    const { schedule_id } = req.query;
    const whereClause = {};
    if (schedule_id) {
      whereClause.schedule_id = schedule_id;
    }

    const logs = await MaintenanceLogSheet.findAll({
      where: whereClause,
      include: [
        {
          model: MaintenanceSchedule,
          as: "schedule",
          include: [{ model: Asset, as: "asset" }]
        },
        {
          model: User,
          as: "creator",
          attributes: ["user_id", "username", "full_name"]
        }
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ data: logs });
  } catch (error) {
    console.error("Error getLogSheets:", error);
    res.status(500).json({ message: "Gagal mengambil data log sheet" });
  }
};

export const createLogSheet = async (req, res) => {
  try {
    const { schedule_id, temuan, tindakan, status_temuan, tanggal_temuan } = req.body;
    const user_id = req.user ? req.user.id : null;

    if (!schedule_id || !temuan || !tanggal_temuan) {
      return res.status(400).json({ message: "schedule_id, temuan, dan tanggal_temuan wajib diisi" });
    }

    const newLog = await MaintenanceLogSheet.create({
      schedule_id,
      temuan,
      tindakan,
      status_temuan: status_temuan || 'OPEN',
      tanggal_temuan,
      created_by: user_id
    });

    res.status(201).json({ message: "Log sheet berhasil dibuat", data: newLog });
  } catch (error) {
    console.error("Error createLogSheet:", error);
    res.status(500).json({ message: "Gagal membuat log sheet" });
  }
};

export const updateLogSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { temuan, tindakan, status_temuan, tanggal_temuan } = req.body;

    const log = await MaintenanceLogSheet.findByPk(id);
    if (!log) {
      return res.status(404).json({ message: "Log sheet tidak ditemukan" });
    }

    await log.update({
      temuan: temuan !== undefined ? temuan : log.temuan,
      tindakan: tindakan !== undefined ? tindakan : log.tindakan,
      status_temuan: status_temuan !== undefined ? status_temuan : log.status_temuan,
      tanggal_temuan: tanggal_temuan !== undefined ? tanggal_temuan : log.tanggal_temuan,
    });

    res.status(200).json({ message: "Log sheet berhasil diupdate", data: log });
  } catch (error) {
    console.error("Error updateLogSheet:", error);
    res.status(500).json({ message: "Gagal mengupdate log sheet" });
  }
};

export const deleteLogSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await MaintenanceLogSheet.findByPk(id);
    if (!log) {
      return res.status(404).json({ message: "Log sheet tidak ditemukan" });
    }

    await log.destroy();
    res.status(200).json({ message: "Log sheet berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteLogSheet:", error);
    res.status(500).json({ message: "Gagal menghapus log sheet" });
  }
};
