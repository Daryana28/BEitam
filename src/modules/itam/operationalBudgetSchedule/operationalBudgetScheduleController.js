import { OperationalBudgetScheduleItem } from "../../../models/index.js";

let operationalBudgetScheduleColumnsPromise = null;

async function getOperationalBudgetScheduleColumns() {
  if (!operationalBudgetScheduleColumnsPromise) {
    operationalBudgetScheduleColumnsPromise = OperationalBudgetScheduleItem.sequelize
      .getQueryInterface()
      .describeTable(OperationalBudgetScheduleItem.getTableName())
      .catch((error) => {
        operationalBudgetScheduleColumnsPromise = null;
        throw error;
      });
  }

  return operationalBudgetScheduleColumnsPromise;
}

async function getOperationalBudgetScheduleOptionalFlags() {
  const columns = await getOperationalBudgetScheduleColumns();
  return {
    hasStatusOverride: Boolean(columns.status_override),
    hasStatusNote: Boolean(columns.status_note),
  };
}

function buildOperationalBudgetScheduleAttributes(optionalFlags = {}) {
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
    borrowedFromBudgetCode: record.borrowed_from_budget_code || "",
    borrowedFromItemName: record.borrowed_from_item_name || "",
    borrowedFromItemNo: record.borrowed_from_item_no || "",
    borrowedAmount: Number(record.borrowed_amount || 0),
    transferDate: record.transfer_date || "",
    borrowPurpose: record.borrow_purpose || "",
    borrowRemark: record.borrow_remark || "",
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

  if (!options.hasStatusOverride || !options.hasStatusNote) {
    if (metaStatusOverride || metaStatusNote) {
      normalizedStages.__meta = {
        ...(normalizedStages.__meta && typeof normalizedStages.__meta === "object"
          ? normalizedStages.__meta
          : {}),
        statusOverride: metaStatusOverride,
        statusNote: metaStatusNote,
      };
    } else if (normalizedStages.__meta) {
      delete normalizedStages.__meta.statusOverride;
      delete normalizedStages.__meta.statusNote;
      if (Object.keys(normalizedStages.__meta).length === 0) {
        delete normalizedStages.__meta;
      }
    }
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
    borrowed_from_budget_code: String(body.borrowedFromBudgetCode || "").trim() || null,
    borrowed_from_item_name: String(body.borrowedFromItemName || "").trim() || null,
    borrowed_from_item_no: String(body.borrowedFromItemNo || "").trim() || null,
    borrowed_amount: Number(body.borrowedAmount || 0),
    transfer_date: String(body.transferDate || "").trim() || null,
    borrow_purpose: String(body.borrowPurpose || "").trim() || null,
    borrow_remark: String(body.borrowRemark || "").trim() || null,
    po_time: String(body.poTime || "").trim() || null,
    allocation: String(body.allocation || "").trim() || null,
    budget_year: String(body.budgetYear || "").trim(),
    current_stage: String(body.currentStage || "All").trim() || "All",
    stages_json: JSON.stringify(normalizedStages),
  };

  if (options.hasStatusOverride) {
    payload.status_override = metaStatusOverride || null;
  }

  if (options.hasStatusNote) {
    payload.status_note = metaStatusNote || null;
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

export const getOperationalBudgetScheduleItems = async (_req, res) => {
  try {
    const optionalFlags = await getOperationalBudgetScheduleOptionalFlags();
    const attributes = buildOperationalBudgetScheduleAttributes(optionalFlags);

    const items = await OperationalBudgetScheduleItem.findAll({
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
    console.error("Error fetching operational budget schedule items:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createOperationalBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getOperationalBudgetScheduleOptionalFlags();
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const created = await OperationalBudgetScheduleItem.create(buildPayload(req.body, optionalFlags));

    res.status(201).json({
      success: true,
      data: serializeScheduleItem(created),
    });
  } catch (error) {
    console.error("Error creating operational budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOperationalBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getOperationalBudgetScheduleOptionalFlags();
    const attributes = buildOperationalBudgetScheduleAttributes(optionalFlags);
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const item = await OperationalBudgetScheduleItem.findByPk(req.params.id, {
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
    console.error("Error updating operational budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteOperationalBudgetScheduleItem = async (req, res) => {
  try {
    const optionalFlags = await getOperationalBudgetScheduleOptionalFlags();
    const item = await OperationalBudgetScheduleItem.findByPk(req.params.id, {
      attributes: buildOperationalBudgetScheduleAttributes(optionalFlags),
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
      message: "Item schedule operational berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting operational budget schedule item:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
