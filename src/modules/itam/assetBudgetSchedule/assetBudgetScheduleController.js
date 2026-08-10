import { AssetBudgetScheduleItem } from "../../../models/index.js";

let assetBudgetScheduleColumnsPromise = null;

async function getAssetBudgetScheduleColumns() {
  if (!assetBudgetScheduleColumnsPromise) {
    assetBudgetScheduleColumnsPromise = AssetBudgetScheduleItem.sequelize
      .getQueryInterface()
      .describeTable(AssetBudgetScheduleItem.getTableName())
      .catch((error) => {
        assetBudgetScheduleColumnsPromise = null;
        throw error;
      });
  }

  return assetBudgetScheduleColumnsPromise;
}

async function getAssetBudgetScheduleOptionalFlags() {
  const columns = await getAssetBudgetScheduleColumns();
  return {
    hasStatusOverride: Boolean(columns.status_override),
    hasStatusNote: Boolean(columns.status_note),
  };
}

function buildAssetBudgetScheduleAttributes(optionalFlags = {}) {
  const attributes = [
    "id",
    "client_key",
    "display_order",
    "budget_code",
    "subject",
    "item_name",
    "item_no",
    "budget_plan_amount",
    "actual_budget_amount",
    "borrowed_from_budget_code",
    "borrowed_from_item_name",
    "borrowed_from_item_no",
    "borrowed_amount",
    "transfer_date",
    "borrow_purpose",
    "borrow_remark",
    "po_time",
    "allocation",
    "budget_year",
    "current_stage",
    "stages_json",
  ];

  if (optionalFlags.hasStatusOverride) attributes.push("status_override");
  if (optionalFlags.hasStatusNote) attributes.push("status_note");

  return attributes;
}

function normalizeTransferLine(line = {}) {
  return {
    sourceBudgetCode: String(line?.sourceBudgetCode || line?.borrowedFromBudgetCode || "").trim(),
    sourceItemName: String(line?.sourceItemName || line?.borrowedFromItemName || "").trim(),
    sourceItemNo: String(line?.sourceItemNo || line?.borrowedFromItemNo || "").trim(),
    amount: Number(line?.amount ?? line?.borrowedAmount ?? 0),
    transferDate: String(line?.transferDate || "").trim(),
    purpose: String(line?.purpose || line?.borrowPurpose || "").trim(),
    remark: String(line?.remark || line?.borrowRemark || "").trim(),
  };
}

function getTransferLinesFromRecord(record, meta = {}) {
  const providedLines = Array.isArray(meta?.transferLines)
    ? meta.transferLines.map(normalizeTransferLine)
    : [];
  const normalizedProvidedLines = providedLines.filter(
    (line) => line.sourceBudgetCode && (line.sourceItemNo || line.sourceItemName) && Number(line.amount || 0) > 0
  );

  if (normalizedProvidedLines.length > 0) {
    return normalizedProvidedLines;
  }

  if (Number(record?.borrowed_amount || 0) <= 0) {
    return [];
  }

  const legacyLine = normalizeTransferLine({
    sourceBudgetCode: record?.borrowed_from_budget_code,
    sourceItemName: record?.borrowed_from_item_name,
    sourceItemNo: record?.borrowed_from_item_no,
    amount: record?.borrowed_amount,
    transferDate: record?.transfer_date,
    purpose: record?.borrow_purpose,
    remark: record?.borrow_remark,
  });

  if (!legacyLine.sourceBudgetCode || (!legacyLine.sourceItemNo && !legacyLine.sourceItemName)) {
    return [];
  }

  return [legacyLine];
}

function getTransferLinesFromBody(body = {}) {
  const providedLines = Array.isArray(body?.transferLines)
    ? body.transferLines.map(normalizeTransferLine)
    : [];
  const normalizedProvidedLines = providedLines.filter(
    (line) => line.sourceBudgetCode && (line.sourceItemNo || line.sourceItemName) && Number(line.amount || 0) > 0
  );

  if (normalizedProvidedLines.length > 0) {
    return normalizedProvidedLines;
  }

  if (Number(body?.borrowedAmount || 0) <= 0) {
    return [];
  }

  const legacyLine = normalizeTransferLine({
    sourceBudgetCode: body?.borrowedFromBudgetCode,
    sourceItemName: body?.borrowedFromItemName,
    sourceItemNo: body?.borrowedFromItemNo,
    amount: body?.borrowedAmount,
    transferDate: body?.transferDate,
    purpose: body?.borrowPurpose,
    remark: body?.borrowRemark,
  });

  if (!legacyLine.sourceBudgetCode || (!legacyLine.sourceItemNo && !legacyLine.sourceItemName)) {
    return [];
  }

  return [legacyLine];
}

function serializeScheduleItem(record) {
  let stages = {};

  try {
    stages = JSON.parse(record.stages_json || "{}");
  } catch {
    stages = {};
  }

  const meta = stages?.__meta && typeof stages.__meta === "object" ? stages.__meta : {};
  const serializedStages = { ...stages };
  delete serializedStages.__meta;
  const transferLines = getTransferLinesFromRecord(record, meta);
  const totalBorrowedAmount = transferLines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const firstTransferLine = transferLines[0] || null;

  return {
    id: record.id,
    key: record.client_key,
    no: Number(record.display_order || 0),
    budgetCode: record.budget_code,
    subject: record.subject,
    itemName: record.item_name,
    itemNo: record.item_no || "",
    budgetPlanAmount: Number(record.budget_plan_amount || 0),
    actualBudgetAmount: Number(record.actual_budget_amount || 0),
    borrowedFromBudgetCode:
      transferLines.length === 1
        ? firstTransferLine?.sourceBudgetCode || ""
        : record.borrowed_from_budget_code || "",
    borrowedFromItemName:
      transferLines.length === 1
        ? firstTransferLine?.sourceItemName || ""
        : record.borrowed_from_item_name || "",
    borrowedFromItemNo:
      transferLines.length === 1
        ? firstTransferLine?.sourceItemNo || ""
        : record.borrowed_from_item_no || "",
    borrowedAmount: totalBorrowedAmount,
    transferDate:
      transferLines.length === 1
        ? firstTransferLine?.transferDate || ""
        : record.transfer_date || "",
    borrowPurpose:
      transferLines.length === 1
        ? firstTransferLine?.purpose || ""
        : record.borrow_purpose || "",
    borrowRemark:
      transferLines.length === 1
        ? firstTransferLine?.remark || ""
        : record.borrow_remark || "",
    transferLines,
    poTime: record.po_time || "",
    allocation: record.allocation || "",
    budgetYear: record.budget_year,
    currentStage: record.current_stage || "All",
    statusOverride: record.status_override || meta.statusOverride || "",
    statusNote: record.status_note || meta.statusNote || "",
    stages: serializedStages,
  };
}

function buildPayload(body = {}, options = {}) {
  const normalizedStages =
    body.stages && typeof body.stages === "object" ? JSON.parse(JSON.stringify(body.stages)) : {};
  const metaStatusOverride = String(body.statusOverride || "").trim();
  const metaStatusNote = String(body.statusNote || "").trim();
  const transferLines = getTransferLinesFromBody(body);
  const totalBorrowedAmount = transferLines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const firstTransferLine = transferLines[0] || null;

  const currentMeta =
    normalizedStages.__meta && typeof normalizedStages.__meta === "object" ? normalizedStages.__meta : {};
  const nextMeta = {
    ...currentMeta,
    transferLines,
  };

  if (!options.hasStatusOverride || !options.hasStatusNote) {
    if (metaStatusOverride || metaStatusNote) {
      nextMeta.statusOverride = metaStatusOverride;
      nextMeta.statusNote = metaStatusNote;
    } else if (normalizedStages.__meta) {
      delete normalizedStages.__meta.statusOverride;
      delete normalizedStages.__meta.statusNote;
    }
  }

  if (!options.hasStatusOverride || !options.hasStatusNote) {
    if (metaStatusOverride) {
      nextMeta.statusOverride = metaStatusOverride;
    } else {
      delete nextMeta.statusOverride;
    }

    if (metaStatusNote) {
      nextMeta.statusNote = metaStatusNote;
    } else {
      delete nextMeta.statusNote;
    }
  }

  if (transferLines.length > 0 || Object.keys(nextMeta).length > 0) {
    normalizedStages.__meta = nextMeta;
  } else {
    delete normalizedStages.__meta;
  }

  const payload = {
    client_key: String(body.key || "").trim(),
    display_order: Number(body.no || 0),
    budget_code: String(body.budgetCode || "").trim(),
    subject: String(body.subject || "").trim(),
    item_name: String(body.itemName || "").trim(),
    item_no: String(body.itemNo || "").trim() || null,
    budget_plan_amount: Number(body.budgetPlanAmount || 0),
    actual_budget_amount: Number(body.actualBudgetAmount || 0),
    borrowed_from_budget_code: transferLines.length === 1 ? firstTransferLine?.sourceBudgetCode || null : null,
    borrowed_from_item_name: transferLines.length === 1 ? firstTransferLine?.sourceItemName || null : null,
    borrowed_from_item_no: transferLines.length === 1 ? firstTransferLine?.sourceItemNo || null : null,
    borrowed_amount: totalBorrowedAmount,
    transfer_date: transferLines.length === 1 ? firstTransferLine?.transferDate || null : null,
    borrow_purpose: transferLines.length === 1 ? firstTransferLine?.purpose || null : null,
    borrow_remark: transferLines.length === 1 ? firstTransferLine?.remark || null : null,
    po_time: String(body.poTime || "").trim() || null,
    allocation: String(body.allocation || "").trim() || null,
    budget_year: String(body.budgetYear || "").trim(),
    current_stage: String(body.currentStage || "All").trim() || "All",
    stages_json: JSON.stringify(normalizedStages),
  };

  if (options.hasStatusOverride) {
    payload.status_override = String(body.statusOverride || "").trim() || null;
  }

  if (options.hasStatusNote) {
    payload.status_note = String(body.statusNote || "").trim() || null;
  }

  return payload;
}

function validatePayload(body = {}) {
  if (!String(body.key || "").trim()) {
    return "key wajib ada";
  }
  if (!String(body.budgetCode || "").trim()) {
    return "budgetCode wajib ada";
  }
  if (!String(body.itemName || "").trim()) {
    return "itemName wajib ada";
  }
  if (!String(body.budgetYear || "").trim()) {
    return "budgetYear wajib ada";
  }
  return null;
}

export const getAssetBudgetScheduleItems = async (req, res) => {
  try {
    const optionalFlags = await getAssetBudgetScheduleOptionalFlags();
    const attributes = buildAssetBudgetScheduleAttributes(optionalFlags);

    const items = await AssetBudgetScheduleItem.findAll({
      attributes,
      order: [
        ["display_order", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: items.map(serializeScheduleItem),
    });
  } catch (error) {
    console.error("Error fetching asset budget schedule items:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createAssetBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getAssetBudgetScheduleOptionalFlags();
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const created = await AssetBudgetScheduleItem.create(buildPayload(req.body, optionalFlags));

    res.status(201).json({
      success: true,
      data: serializeScheduleItem(created),
    });
  } catch (error) {
    console.error("Error creating asset budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAssetBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getAssetBudgetScheduleOptionalFlags();
    const attributes = buildAssetBudgetScheduleAttributes(optionalFlags);
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const item = await AssetBudgetScheduleItem.findByPk(req.params.id, {
      attributes,
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item tidak ditemukan",
      });
    }

    await item.update(buildPayload(req.body, optionalFlags));

    res.status(200).json({
      success: true,
      data: serializeScheduleItem(item),
    });
  } catch (error) {
    console.error("Error updating asset budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAssetBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getAssetBudgetScheduleOptionalFlags();
    const item = await AssetBudgetScheduleItem.findByPk(req.params.id, {
      attributes: buildAssetBudgetScheduleAttributes(optionalFlags),
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item tidak ditemukan",
      });
    }

    await item.destroy();

    res.status(200).json({
      success: true,
      message: "Item schedule berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting asset budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
