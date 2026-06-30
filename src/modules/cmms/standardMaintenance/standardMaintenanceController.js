import { 
  StandardMaintenance, 
  StandardMaintenanceDetail, 
  StandardMaintenanceCheck, 
  YearlyStandardMaintenance, 
  MaintenanceSchedule, 
  Asset, 
  AssetCategory, 
  MaintenanceActual, 
  MaintenanceLogSheet, 
  MaintenanceAbnormalLog,
  sequelize 
} from "../../../models/index.js";
import { Op } from "sequelize";
import xlsx from "xlsx";
import { generateTemplate } from "./excelTemplateGenerator.js";
import dayjs from "dayjs";

const normalizeCategoryName = (value) => String(value || "").trim().toLowerCase();

const expandStandardCategoryAliases = (kategori) => {
  const raw = String(kategori || "").trim();
  const upper = raw.toUpperCase();

  if (upper === "HARDWARE") {
    return ["HARDWARE", "Hardware"];
  }

  if (upper === "SOFTWARE_HW") {
    return ["SOFTWARE_HW", "Software", "Software Hardware"];
  }

  if (upper === "APPLICATION") {
    return ["APPLICATION", "Application", "Software"];
  }

  if (upper === "NETWORK_CYBER") {
    return [
      "NETWORK_CYBER",
      "Network",
      "Networking",
      "Cyber",
      "Cyber Security",
      "Cybersecurity",
      "Network & Cyber",
      "Network & Cybersecurity",
    ];
  }

  return [raw];
};

const buildAssetCategoryCandidates = (kategori, subKategori, namaPerangkat, tipePerangkat, subPerangkat) => {
  const candidates = [];
  const pushCandidate = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized || normalized === "-") return;
    if (!candidates.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      candidates.push(normalized);
    }
  };

  pushCandidate(subKategori);
  pushCandidate(subPerangkat);
  pushCandidate(tipePerangkat);
  pushCandidate(namaPerangkat);

  return candidates;
};

const collectDescendantCategoryIds = (rootIds, categories) => {
  const childrenByParent = new Map();
  categories.forEach((category) => {
    const parentId = category.parent_id ?? null;
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
    childrenByParent.get(parentId).push(category);
  });

  const visited = new Set();
  const stack = [...rootIds];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = childrenByParent.get(currentId) || [];
    children.forEach((child) => {
      if (!visited.has(child.category_id)) {
        stack.push(child.category_id);
      }
    });
  }

  return [...visited];
};

const resolveAssetCategoryIds = async ({ kategori, subKategori, namaPerangkat, tipePerangkat, subPerangkat, transaction }) => {
  const categories = await AssetCategory.findAll({
    raw: true,
    ...(transaction ? { transaction } : {}),
  });

  if (!categories.length) {
    return [];
  }

  const candidates = buildAssetCategoryCandidates(
    kategori,
    subKategori,
    namaPerangkat,
    tipePerangkat,
    subPerangkat
  ).map(normalizeCategoryName);

  return categories
    .filter((category) => candidates.includes(normalizeCategoryName(category.category_name)))
    .map((category) => category.category_id);
};

const normalizeDateKey = (value) => {
  if (!value) return "";
  const parsed = dayjs(value);
  if (parsed.isValid()) {
    return parsed.format("YYYY-MM-DD");
  }
  return String(value).slice(0, 10);
};

export const createStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const payload = req.body;

    // 1. Create Parent (Device/Kategori)
    const standardMaintenance = await StandardMaintenance.create({
      kategori: payload.kategori,
      subKategori: payload.subKategori,
      namaPerangkat: payload.namaPerangkat,
      tipePerangkat: payload.tipePerangkat || "-",
      subPerangkat: payload.subPerangkat,
      yearly_standard_id: payload.yearly_standard_id,
    }, { transaction });

    // 2. Create Details & Checks
    if (payload.maintenanceDetails && payload.maintenanceDetails.length > 0) {
      for (const detail of payload.maintenanceDetails) {
        const standardDetail = await StandardMaintenanceDetail.create({
          standard_maintenance_id: standardMaintenance.id,
          fungsi: detail.fungsi,
          deskripsi: detail.deskripsi,
        }, { transaction });

        if (detail.pengecekanList && detail.pengecekanList.length > 0) {
          const checks = detail.pengecekanList.map((cek) => ({
            standard_maintenance_detail_id: standardDetail.id,
            pengecekan: cek.pengecekan,
            standard: cek.standard,
            periodik: cek.periodik,
            bagian: cek.bagian,
            metode: cek.metode,
            alat: cek.alat,
          }));

          await StandardMaintenanceCheck.bulkCreate(checks, { transaction });
        }
      }
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Standard maintenance created successfully",
      data: standardMaintenance,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in createStandardMaintenance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create standard maintenance",
    });
  }
};

export const getAllStandardMaintenance = async (req, res) => {
  try {
    const { yearly_standard_id, kategori } = req.query;
    const whereClause = {};
    if (yearly_standard_id) {
      whereClause.yearly_standard_id = yearly_standard_id;
    }
    if (kategori) {
      whereClause.kategori = {
        [Op.in]: expandStandardCategoryAliases(kategori)
      };
    }

    const data = await StandardMaintenance.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: StandardMaintenanceDetail,
          as: "details",
          include: [
            {
              model: StandardMaintenanceCheck,
              as: "pengecekanList",
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getAllStandardMaintenance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve standard maintenance data",
    });
  }
};

export const getYearsStandardMaintenance = async (req, res) => {
  try {
    const data = await YearlyStandardMaintenance.findAll({
      order: [['tahun', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getYearsStandardMaintenance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve yearly standard maintenance data",
    });
  }
};

export const getYearlyStandardMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await YearlyStandardMaintenance.findByPk(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getYearlyStandardMaintenanceById:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createYearlyStandardMaintenance = async (req, res) => {
  try {
    const payload = req.body;
    const yearly = await YearlyStandardMaintenance.create({
      tahun: payload.tahun,
      judul: payload.judul,
      status_approval: "DRAFT"
    });

    return res.status(201).json({
      success: true,
      message: "Yearly standard maintenance created successfully",
      data: yearly,
    });
  } catch (error) {
    console.error("Error in createYearlyStandardMaintenance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create yearly standard maintenance",
    });
  }
};

export const updateYearlyStandardMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahun, judul } = req.body;

    const yearly = await YearlyStandardMaintenance.findByPk(id);
    if (!yearly) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    await yearly.update({ tahun, judul });

    return res.status(200).json({
      success: true,
      message: "Data berhasil diperbarui",
      data: yearly,
    });
  } catch (error) {
    console.error("Error in updateYearlyStandardMaintenance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteYearlyStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const yearly = await YearlyStandardMaintenance.findByPk(id);
    if (!yearly) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    if (yearly.status_approval !== "DRAFT") {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Hanya data DRAFT yang bisa dihapus langsung" });
    }

    // Cascade delete children manually
    const standardMaintenances = await StandardMaintenance.findAll({ where: { yearly_standard_id: id } });
    for (const sm of standardMaintenances) {
      const details = await StandardMaintenanceDetail.findAll({ where: { standard_maintenance_id: sm.id } });
      for (const d of details) {
        await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: d.id }, transaction });
      }
      await StandardMaintenanceDetail.destroy({ where: { standard_maintenance_id: sm.id }, transaction });
    }
    await StandardMaintenance.destroy({ where: { yearly_standard_id: id }, transaction });
    await yearly.destroy({ transaction });

    await transaction.commit();
    return res.status(200).json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in deleteYearlyStandardMaintenance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestDeleteYearlyStandardMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan_hapus } = req.body;

    const yearly = await YearlyStandardMaintenance.findByPk(id);
    if (!yearly) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    await yearly.update({
      status_approval: "WAITING_FOR_DELETION",
      alasan_hapus
    });

    return res.status(200).json({
      success: true,
      message: "Permintaan hapus berhasil diajukan",
      data: yearly,
    });
  } catch (error) {
    console.error("Error in requestDeleteYearlyStandardMaintenance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertFlatStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      detailId, // Add detailId support
      cekId,
      yearly_standard_id,
      kategori, subKategori, namaPerangkat, tipePerangkat, subPerangkat,
      fungsi, deskripsi,
      pengecekan, standard, periodik, bagian, metode, alat
    } = req.body;

    let sm = await StandardMaintenance.findOne({
      where: { 
        yearly_standard_id, 
        kategori, 
        subKategori, 
        namaPerangkat, 
        tipePerangkat: tipePerangkat || "-",
        subPerangkat: subPerangkat || null
      },
      transaction
    });

    if (!sm) {
      sm = await StandardMaintenance.create({
        yearly_standard_id, kategori, subKategori, namaPerangkat, tipePerangkat: tipePerangkat || "-", subPerangkat
      }, { transaction });
    }

    let smDetail = null;
    if (detailId) {
       smDetail = await StandardMaintenanceDetail.findByPk(detailId, { transaction });
       if (smDetail) {
          await smDetail.update({ standard_maintenance_id: sm.id, fungsi, deskripsi }, { transaction });
       }
    }

    if (!smDetail) {
      smDetail = await StandardMaintenanceDetail.findOne({
        where: { standard_maintenance_id: sm.id, fungsi },
        transaction
      });

      if (!smDetail) {
        smDetail = await StandardMaintenanceDetail.create({
          standard_maintenance_id: sm.id, fungsi, deskripsi
        }, { transaction });
      } else if (deskripsi !== undefined && smDetail.deskripsi !== deskripsi) {
        await smDetail.update({ deskripsi }, { transaction });
      }
    }

    let smCheck = null;
    // ONLY process Check logic if pengecekan is actually provided!
    if (pengecekan !== undefined && pengecekan !== null && pengecekan !== "") {
      if (cekId) {
        smCheck = await StandardMaintenanceCheck.findByPk(cekId, { transaction });
        if (smCheck) {
          await smCheck.update({
            standard_maintenance_detail_id: smDetail.id,
            pengecekan, standard, periodik, bagian, metode, alat
          }, { transaction });
        }
      }

      if (!smCheck) {
        smCheck = await StandardMaintenanceCheck.create({
          standard_maintenance_detail_id: smDetail.id,
          pengecekan, standard, periodik, bagian, metode, alat
        }, { transaction });
      }
    }

    await transaction.commit();
    return res.status(200).json({ success: true, data: smCheck || smDetail, message: "Data berhasil disimpan" });
  } catch (error) {
    await transaction.rollback();
    console.error("Upsert Flat Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFlatStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { check_id } = req.params;
    const smCheck = await StandardMaintenanceCheck.findByPk(check_id, { transaction });
    if (!smCheck) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Pengecekan tidak ditemukan" });
    }

    const detailId = smCheck.standard_maintenance_detail_id;
    await smCheck.destroy({ transaction });

    const remainingChecks = await StandardMaintenanceCheck.count({ where: { standard_maintenance_detail_id: detailId }, transaction });
    if (remainingChecks === 0) {
      const smDetail = await StandardMaintenanceDetail.findByPk(detailId, { transaction });
      if (smDetail) {
        const smId = smDetail.standard_maintenance_id;
        await smDetail.destroy({ transaction });
        const remainingDetails = await StandardMaintenanceDetail.count({ where: { standard_maintenance_id: smId }, transaction });
        if (remainingDetails === 0) {
          await StandardMaintenance.destroy({ where: { id: smId }, transaction });
        }
      }
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    await transaction.rollback();
    console.error("Delete Flat Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStandardMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategori, subKategori, namaPerangkat, tipePerangkat, subPerangkat } = req.body;
    
    const sm = await StandardMaintenance.findByPk(id);
    if (!sm) {
      return res.status(404).json({ success: false, message: "Perangkat tidak ditemukan" });
    }

    const updateClause = { kategori, subKategori, namaPerangkat };
    if (tipePerangkat !== undefined) updateClause.tipePerangkat = tipePerangkat;

    const whereClause = {
      yearly_standard_id: sm.yearly_standard_id,
      kategori: sm.kategori,
      subKategori: sm.subKategori,
      namaPerangkat: sm.namaPerangkat
    };

    if (subPerangkat !== undefined) {
      updateClause.subPerangkat = subPerangkat;
      whereClause.subPerangkat = sm.subPerangkat;
    }

    await StandardMaintenance.update(updateClause, { where: whereClause });

    return res.status(200).json({
      success: true,
      message: "Data perangkat berhasil diperbarui",
      data: updateClause,
    });
  } catch (error) {
    console.error("Error in updateStandardMaintenance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { level } = req.query; // 'namaPerangkat' or 'jenisPerangkat'
    
    const sm = await StandardMaintenance.findByPk(id);
    if (!sm) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Perangkat tidak ditemukan" });
    }
    
    const whereClause = {
      yearly_standard_id: sm.yearly_standard_id,
      kategori: sm.kategori,
      subKategori: sm.subKategori,
      namaPerangkat: sm.namaPerangkat
    };

    if (level === 'jenisPerangkat') {
      whereClause.subPerangkat = sm.subPerangkat;
    }

    const smList = await StandardMaintenance.findAll({ where: whereClause, transaction });

    for (const item of smList) {
      const details = await StandardMaintenanceDetail.findAll({ where: { standard_maintenance_id: item.id }, transaction });
      for (const d of details) {
        await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: d.id }, transaction });
      }
      await StandardMaintenanceDetail.destroy({ where: { standard_maintenance_id: item.id }, transaction });
      await item.destroy({ transaction });
    }
    
    await transaction.commit();
    return res.status(200).json({ success: true, message: "Perangkat berhasil dihapus" });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStandardMaintenanceDetail = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const detail = await StandardMaintenanceDetail.findByPk(id);
    if (!detail) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Detail tidak ditemukan" });
    }
    
    await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: id }, transaction });
    await detail.destroy({ transaction });
    
    await transaction.commit();
    return res.status(200).json({ success: true, message: "Deskripsi berhasil dihapus" });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const importStandardMaintenance = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File Excel wajib diunggah" });
  }

  const { kategori } = req.body;
  if (!kategori) {
    return res.status(400).json({ success: false, message: "Kategori wajib diisi" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet tidak ditemukan di dalam file Excel.`);
    }

    if (!worksheet['!ref']) {
      throw new Error(`File Excel kosong atau format tidak valid.`);
    }

    const range = xlsx.utils.decode_range(worksheet['!ref']);
    
    let lastSubKategori = '';
    let lastNamaPerangkat = '';
    let lastTipePerangkat = '';
    let lastSubPerangkat = '';
    let lastFungsi = '';
    let lastDeskripsi = '';

    const parsedItems = [];

    // Excel data row starts at row 8 (index 8)
    for (let r = 8; r <= range.e.r; r++) {
      const col1Val = (worksheet[xlsx.utils.encode_cell({ c: 1, r })]?.v || '').toString().trim();
      const col2Val = (worksheet[xlsx.utils.encode_cell({ c: 2, r })]?.v || '').toString().trim();
      const col3Val = (worksheet[xlsx.utils.encode_cell({ c: 3, r })]?.v || '').toString().trim();
      const col5Val = (worksheet[xlsx.utils.encode_cell({ c: 5, r })]?.v || '').toString().trim();
      const col6Val = (worksheet[xlsx.utils.encode_cell({ c: 6, r })]?.v || '').toString().trim();
      const col7Val = (worksheet[xlsx.utils.encode_cell({ c: 7, r })]?.v || '').toString().trim();
      const col24Val = (worksheet[xlsx.utils.encode_cell({ c: 24, r })]?.v || '').toString().trim();

      // Update carry forward if cell has value
      if (col1Val) lastSubKategori = col1Val;
      if (col2Val) lastNamaPerangkat = col2Val;
      if (col3Val) {
        lastTipePerangkat = col3Val;
        lastSubPerangkat = col3Val;
      }
      if (col5Val) lastFungsi = col5Val;
      if (col6Val) lastDeskripsi = col6Val;

      // Skip row if no inspection item or function descriptions at all
      if (!col7Val && !col5Val && !col1Val) {
        // Check if we hit a large blank block
        let isBlankBlock = true;
        for (let checkR = r; checkR < Math.min(r + 15, range.e.r); checkR++) {
          const checkCol7 = (worksheet[xlsx.utils.encode_cell({ c: 7, r: checkR })]?.v || '').toString().trim();
          const checkCol5 = (worksheet[xlsx.utils.encode_cell({ c: 5, r: checkR })]?.v || '').toString().trim();
          if (checkCol7 || checkCol5) {
            isBlankBlock = false;
            break;
          }
        }
        if (isBlankBlock) {
          // Break loop early as we hit the end of data rows
          break;
        }
        continue;
      }

      // If no check item, skip inserting check
      if (!col7Val) {
        continue;
      }

      // Extract check group from columns 8-11 (single group per category template)
      const checkGroups = [];

      const extractGroup = (baseC) => {
        const standard = (worksheet[xlsx.utils.encode_cell({ c: baseC, r })]?.v || '').toString().trim();
        const bagian = (worksheet[xlsx.utils.encode_cell({ c: baseC + 1, r })]?.v || '').toString().trim();
        const metode = (worksheet[xlsx.utils.encode_cell({ c: baseC + 2, r })]?.v || '').toString().trim();
        const alat = (worksheet[xlsx.utils.encode_cell({ c: baseC + 3, r })]?.v || '').toString().trim();
        if (standard || bagian || metode || alat) {
          return { standard, bagian, metode, alat };
        }
        return null;
      };

      // New template: only one check group at columns 8-11
      const gMain = extractGroup(8);
      if (gMain) {
        checkGroups.push(gMain);
      } else {
        // Fallback for old templates with multiple groups
        const gInfra = extractGroup(12);
        const gSw = extractGroup(16);
        const gCyber = extractGroup(20);
        if (gInfra) checkGroups.push(gInfra);
        if (gSw) checkGroups.push(gSw);
        if (gCyber) checkGroups.push(gCyber);
      }

      // If no normal check details found, push a default empty check so we still register the item
      if (checkGroups.length === 0) {
        checkGroups.push({ standard: '', bagian: '', metode: '', alat: '' });
      }

      const periodik = col24Val || '1 Bulan';

      for (const group of checkGroups) {
        parsedItems.push({
          kategori: kategori.toUpperCase(),
          subKategori: lastSubKategori || '-',
          namaPerangkat: lastNamaPerangkat || '-',
          tipePerangkat: lastTipePerangkat || '-',
          subPerangkat: lastSubPerangkat || '-',
          fungsi: lastFungsi || '-',
          deskripsi: lastDeskripsi || '-',
          pengecekan: col7Val,
          standard: group.standard || '',
          bagian: group.bagian || '',
          metode: group.metode || '',
          alat: group.alat || '',
          periodik,
          planned_dates: []
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "File Excel berhasil dibaca",
      data: parsedItems
    });
  } catch (error) {
    console.error("Error in importStandardMaintenance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengimpor standard maintenance"
    });
  }
};

export const saveAndGenerateSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();
  let currentStage = "initializing";
  try {
    const { yearly_standard_id, kategori, checks } = req.body;
    currentStage = "validating request";

    if (!yearly_standard_id || !kategori || !Array.isArray(checks)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "yearly_standard_id, kategori, dan checks wajib diisi" });
    }

    const targetYearly = await YearlyStandardMaintenance.findByPk(yearly_standard_id, { transaction });
    if (!targetYearly) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Yearly standard maintenance tidak ditemukan" });
    }

    const savedCheckIds = [];
    const savedDetailIds = [];
    const savedSmIds = [];
    const checkPlanMap = new Map();

    for (const [index, checkItem] of checks.entries()) {
      currentStage = `saving check row ${index + 1}`;
      const dbKategori = kategori.toUpperCase();
      const dbSubKategori = checkItem.subKategori || '-';
      const dbNamaPerangkat = checkItem.namaPerangkat || '-';
      const dbTipePerangkat = checkItem.tipePerangkat || '-';
      const dbSubPerangkat = checkItem.subPerangkat || '-';

      // 1. Find or create StandardMaintenance parent
      let sm = await StandardMaintenance.findOne({
        where: {
          yearly_standard_id,
          kategori: dbKategori,
          subKategori: dbSubKategori,
          namaPerangkat: dbNamaPerangkat,
          tipePerangkat: dbTipePerangkat,
          subPerangkat: dbSubPerangkat
        },
        transaction
      });

      if (!sm) {
        sm = await StandardMaintenance.create({
          yearly_standard_id,
          kategori: dbKategori,
          subKategori: dbSubKategori,
          namaPerangkat: dbNamaPerangkat,
          tipePerangkat: dbTipePerangkat,
          subPerangkat: dbSubPerangkat
        }, { transaction });
      }
      if (!savedSmIds.includes(sm.id)) {
        savedSmIds.push(sm.id);
      }

      // 2. Find or create StandardMaintenanceDetail
      const dbFungsi = checkItem.fungsi || '-';
      const dbDeskripsi = checkItem.deskripsi || '-';
      let smDetail = await StandardMaintenanceDetail.findOne({
        where: {
          standard_maintenance_id: sm.id,
          fungsi: dbFungsi
        },
        transaction
      });

      if (!smDetail) {
        smDetail = await StandardMaintenanceDetail.create({
          standard_maintenance_id: sm.id,
          fungsi: dbFungsi,
          deskripsi: dbDeskripsi
        }, { transaction });
      } else {
        await smDetail.update({ deskripsi: dbDeskripsi }, { transaction });
      }
      if (!savedDetailIds.includes(smDetail.id)) {
        savedDetailIds.push(smDetail.id);
      }

      // 3. Find or create StandardMaintenanceCheck
      let smCheck = null;
      if (checkItem.cekId) {
        smCheck = await StandardMaintenanceCheck.findByPk(checkItem.cekId, { transaction });
      }

      if (!smCheck) {
        smCheck = await StandardMaintenanceCheck.findOne({
          where: {
            standard_maintenance_detail_id: smDetail.id,
            pengecekan: checkItem.pengecekan,
            standard: checkItem.standard || '',
            bagian: checkItem.bagian || ''
          },
          transaction
        });
      }

      if (!smCheck) {
        smCheck = await StandardMaintenanceCheck.create({
          standard_maintenance_detail_id: smDetail.id,
          pengecekan: checkItem.pengecekan,
          standard: checkItem.standard || '',
          periodik: checkItem.periodik || '1 Bulan',
          bagian: checkItem.bagian || '',
          metode: checkItem.metode || '',
          alat: checkItem.alat || ''
        }, { transaction });
      } else {
        await smCheck.update({
          pengecekan: checkItem.pengecekan,
          standard: checkItem.standard || '',
          periodik: checkItem.periodik || '1 Bulan',
          bagian: checkItem.bagian || '',
          metode: checkItem.metode || '',
          alat: checkItem.alat || ''
        }, { transaction });
      }
      savedCheckIds.push(smCheck.id);
      checkPlanMap.set(smCheck.id, Array.isArray(checkItem.planned_dates) ? checkItem.planned_dates : []);
    }

    // 4. Cleanup orphaned records that are not in configuration
    currentStage = "cleaning orphan records";
    const allSmForCat = await StandardMaintenance.findAll({
      where: { yearly_standard_id, kategori: kategori.toUpperCase() },
      transaction
    });

    for (const smItem of allSmForCat) {
      const smDetails = await StandardMaintenanceDetail.findAll({
        where: { standard_maintenance_id: smItem.id },
        transaction
      });

      for (const detail of smDetails) {
        const smChecks = await StandardMaintenanceCheck.findAll({
          where: { standard_maintenance_detail_id: detail.id },
          transaction
        });

        for (const check of smChecks) {
          if (!savedCheckIds.includes(check.id)) {
            // Check if this check has completed actual records
            const completedCount = await MaintenanceActual.count({
              where: {
                check_id: check.id,
                [Op.or]: [
                  { status: { [Op.ne]: "PLAN" } },
                  { legend: { [Op.ne]: "□" } }
                ]
              },
              transaction
            });

            if (completedCount > 0) {
              console.log(`Preserving check ${check.id} due to existing logged actual records`);
            } else {
              // Delete uncompleted actual records first
              await MaintenanceActual.destroy({
                where: { check_id: check.id },
                transaction
              });
              await check.destroy({ transaction });
            }
          }
        }

        // Clean up detail if no remaining checks
        const remainingChecksCount = await StandardMaintenanceCheck.count({
          where: { standard_maintenance_detail_id: detail.id },
          transaction
        });
        if (remainingChecksCount === 0 && !savedDetailIds.includes(detail.id)) {
          await detail.destroy({ transaction });
        }
      }

      // Clean up parent if no remaining details
      const remainingDetailsCount = await StandardMaintenanceDetail.count({
        where: { standard_maintenance_id: smItem.id },
        transaction
      });
      if (remainingDetailsCount === 0 && !savedSmIds.includes(smItem.id)) {
        await MaintenanceSchedule.destroy({
          where: { standard_maintenance_id: smItem.id },
          transaction
        });
        await smItem.destroy({ transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Berhasil menyimpan standard maintenance (${savedSmIds.length} SM).`,
      data: { saved_sm_ids: savedSmIds }
    });

  } catch (error) {
    let rollbackErrorMessage = "";
    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      rollbackErrorMessage = rollbackError?.message || String(rollbackError);
      console.error("Rollback Save and Generate Schedule Error:", rollbackError);
    }

    console.error(`Save and Generate Schedule Error [${currentStage}]:`, error);
    const nestedMessages = [
      ...(Array.isArray(error?.errors) ? error.errors.map((item) => item?.message) : []),
      ...(Array.isArray(error?.parent?.errors) ? error.parent.errors.map((item) => item?.message) : []),
      ...(Array.isArray(error?.original?.errors) ? error.original.errors.map((item) => item?.message) : []),
    ].filter(Boolean);

    const detailedMessage =
      error?.message ||
      error?.parent?.message ||
      error?.original?.message ||
      (nestedMessages.length > 0 ? nestedMessages.join("; ") : "") ||
      "Terjadi kesalahan saat menyimpan dan generate schedule";

    const stackSnippet = String(error?.stack || "")
      .split("\n")
      .slice(0, 6)
      .join("\n");

    return res.status(500).json({
      success: false,
      message: `[${currentStage}] ${detailedMessage}`,
      rollback_error: rollbackErrorMessage || undefined,
      stack: stackSnippet || undefined,
    });
  }
};

export const resetStandardMaintenance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { yearly_standard_id, kategori } = req.body;
    if (!yearly_standard_id || !kategori) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "yearly_standard_id dan kategori wajib diisi" });
    }

    const sms = await StandardMaintenance.findAll({
      where: {
        yearly_standard_id,
        kategori: {
          [Op.in]: expandStandardCategoryAliases(kategori)
        }
      },
      attributes: ["id"],
      transaction,
    });

    const smIds = sms.map((item) => item.id);
    if (smIds.length === 0) {
      await transaction.commit();
      return res.status(200).json({ success: true, message: "Tidak ada data standard maintenance untuk di-reset" });
    }

    const schedules = await MaintenanceSchedule.findAll({
      where: {
        yearly_standard_id,
        standard_maintenance_id: { [Op.in]: smIds },
      },
      attributes: ["id"],
      transaction,
    });
    const scheduleIds = schedules.map((item) => item.id);

    const details = await StandardMaintenanceDetail.findAll({
      where: { standard_maintenance_id: { [Op.in]: smIds } },
      attributes: ["id"],
      transaction,
    });
    const detailIds = details.map((item) => item.id);

    const checks = detailIds.length > 0
      ? await StandardMaintenanceCheck.findAll({
          where: { standard_maintenance_detail_id: { [Op.in]: detailIds } },
          attributes: ["id"],
          transaction,
        })
      : [];
    const checkIds = checks.map((item) => item.id);

    const actuals = checkIds.length > 0
      ? await MaintenanceActual.findAll({
          where: { check_id: { [Op.in]: checkIds } },
          attributes: ["id"],
          transaction,
        })
      : [];
    const actualIds = actuals.map((item) => item.id);

    if (actualIds.length > 0) {
      await MaintenanceAbnormalLog.destroy({
        where: { actual_id: { [Op.in]: actualIds } },
        transaction,
      });
    }

    if (actualIds.length > 0 || scheduleIds.length > 0) {
      const logSheetWhere = {};
      if (actualIds.length > 0 && scheduleIds.length > 0) {
        logSheetWhere[Op.or] = [
          { actual_id: { [Op.in]: actualIds } },
          { schedule_id: { [Op.in]: scheduleIds } },
        ];
      } else if (actualIds.length > 0) {
        logSheetWhere.actual_id = { [Op.in]: actualIds };
      } else if (scheduleIds.length > 0) {
        logSheetWhere.schedule_id = { [Op.in]: scheduleIds };
      }

      await MaintenanceLogSheet.destroy({
        where: logSheetWhere,
        transaction,
      });
    }

    if (actualIds.length > 0) {
      await MaintenanceActual.destroy({
        where: { id: { [Op.in]: actualIds } },
        transaction,
      });
    }

    if (checkIds.length > 0) {
      await StandardMaintenanceCheck.destroy({
        where: { id: { [Op.in]: checkIds } },
        transaction,
      });
    }

    if (detailIds.length > 0) {
      await StandardMaintenanceDetail.destroy({
        where: { id: { [Op.in]: detailIds } },
        transaction,
      });
    }

    if (scheduleIds.length > 0) {
      await MaintenanceSchedule.destroy({
        where: { id: { [Op.in]: scheduleIds } },
        transaction,
      });
    }

    await StandardMaintenance.destroy({
      where: { id: { [Op.in]: smIds } },
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({ success: true, message: "Reset standard maintenance dan schedule berhasil dilakukan" });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Reset Standard Maintenance Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadTemplate = async (req, res) => {
  try {
    const { kategori } = req.params;
    const validCategories = ['HARDWARE', 'SOFTWARE_HW', 'APPLICATION', 'NETWORK_CYBER'];
    const uppercaseKategori = (kategori || '').toUpperCase();
    
    if (!validCategories.includes(uppercaseKategori)) {
      return res.status(400).json({ success: false, message: "Kategori tidak valid" });
    }

    const fileBuffer = generateTemplate(uppercaseKategori);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=template_${kategori.toLowerCase()}.xlsx`);
    return res.send(fileBuffer);
  } catch (error) {
    console.error("Error in downloadTemplate:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
