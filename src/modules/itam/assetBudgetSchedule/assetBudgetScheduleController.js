import { AssetBudgetScheduleItem } from "../../../models/index.js";

function serializeScheduleItem(record) {
  let stages = {};

  try {
    stages = JSON.parse(record.stages_json || "{}");
  } catch {
    stages = {};
  }

  return {
    id: record.id,
    key: record.client_key,
    no: Number(record.display_order || 0),
    budgetCode: record.budget_code,
    subject: record.subject,
    itemName: record.item_name,
    budgetPlanAmount: Number(record.budget_plan_amount || 0),
    actualBudgetAmount: Number(record.actual_budget_amount || 0),
    borrowedFromBudgetCode: record.borrowed_from_budget_code || "",
    borrowedAmount: Number(record.borrowed_amount || 0),
    transferDate: record.transfer_date || "",
    borrowPurpose: record.borrow_purpose || "",
    borrowRemark: record.borrow_remark || "",
    poTime: record.po_time || "",
    allocation: record.allocation || "",
    budgetYear: record.budget_year,
    currentStage: record.current_stage || "All",
    stages,
  };
}

function buildPayload(body = {}) {
  return {
    client_key: String(body.key || "").trim(),
    display_order: Number(body.no || 0),
    budget_code: String(body.budgetCode || "").trim(),
    subject: String(body.subject || "").trim(),
    item_name: String(body.itemName || "").trim(),
    budget_plan_amount: Number(body.budgetPlanAmount || 0),
    actual_budget_amount: Number(body.actualBudgetAmount || 0),
    borrowed_from_budget_code: String(body.borrowedFromBudgetCode || "").trim() || null,
    borrowed_amount: Number(body.borrowedAmount || 0),
    transfer_date: String(body.transferDate || "").trim() || null,
    borrow_purpose: String(body.borrowPurpose || "").trim() || null,
    borrow_remark: String(body.borrowRemark || "").trim() || null,
    po_time: String(body.poTime || "").trim() || null,
    allocation: String(body.allocation || "").trim() || null,
    budget_year: String(body.budgetYear || "").trim(),
    current_stage: String(body.currentStage || "All").trim() || "All",
    stages_json: JSON.stringify(body.stages || {}),
  };
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
    const items = await AssetBudgetScheduleItem.findAll({
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
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const created = await AssetBudgetScheduleItem.create(buildPayload(req.body));

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
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const item = await AssetBudgetScheduleItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item tidak ditemukan",
      });
    }

    await item.update(buildPayload(req.body));

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
    const item = await AssetBudgetScheduleItem.findByPk(req.params.id);
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
