import { OperationalBudget } from "../../../models/index.js";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function serializeBudget(record) {
  const payload = {
    id: record.id,
    key: record.client_key,
    budgetCode: record.budget_code || "",
    costCode: record.cost_code || "",
    acctBudget: record.acct_budget || "",
    largeAccount: record.large_account || "",
    costCode1: record.cost_code_1 || "",
    deptSect: record.dept_sect || "",
    accNo: record.acc_no || "",
    accDesc: record.acc_desc || "",
    itemName: record.item_name || "",
    reason: record.reason || "",
    initialBudgetPlan: Number(record.initial_budget_plan || 0),
    initialBudgetActual: Number(record.initial_budget_actual || 0),
  };

  MONTH_KEYS.forEach((monthKey) => {
    payload[`${monthKey}Plan`] = Number(record[`${monthKey}_plan`] || 0);
    payload[`${monthKey}Actual`] = Number(record[`${monthKey}_actual`] || 0);
  });

  return payload;
}

function buildPayload(body = {}, fallbackKey = "") {
  const payload = {
    client_key: String(body.key || fallbackKey || "").trim(),
    budget_code: String(body.budgetCode || "").trim(),
    cost_code: String(body.costCode || "").trim() || null,
    acct_budget: String(body.acctBudget || "").trim() || null,
    large_account: String(body.largeAccount || "").trim() || null,
    cost_code_1: String(body.costCode1 || "").trim() || null,
    dept_sect: String(body.deptSect || "").trim() || null,
    acc_no: String(body.accNo || "").trim() || null,
    acc_desc: String(body.accDesc || "").trim() || null,
    item_name: String(body.itemName || "").trim(),
    reason: String(body.reason || "").trim() || null,
    initial_budget_plan: Number(body.initialBudgetPlan || 0),
    initial_budget_actual: Number(body.initialBudgetActual || 0),
  };

  MONTH_KEYS.forEach((monthKey) => {
    payload[`${monthKey}_plan`] = Number(body[`${monthKey}Plan`] || 0);
    payload[`${monthKey}_actual`] = Number(body[`${monthKey}Actual`] || 0);
  });

  return payload;
}

function validateBudgetPayload(body = {}) {
  if (!String(body.key || "").trim()) return "key wajib ada";
  if (!String(body.budgetCode || "").trim()) return "budgetCode wajib ada";
  if (!String(body.itemName || "").trim()) return "itemName wajib ada";
  return null;
}

export const getOperationalBudgets = async (_req, res) => {
  try {
    const budgets = await OperationalBudget.findAll({
      order: [
        ["budget_code", "ASC"],
        ["item_name", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: budgets.map(serializeBudget),
    });
  } catch (error) {
    console.error("Error fetching operational budgets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOperationalBudget = async (req, res) => {
  try {
    const validationError = validateBudgetPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const created = await OperationalBudget.create(buildPayload(req.body));
    res.status(201).json({ success: true, data: serializeBudget(created) });
  } catch (error) {
    console.error("Error creating operational budget:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOperationalBudget = async (req, res) => {
  try {
    const validationError = validateBudgetPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const budget = await OperationalBudget.findByPk(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget tidak ditemukan" });
    }

    await budget.update(buildPayload(req.body, budget.client_key));
    res.status(200).json({ success: true, data: serializeBudget(budget) });
  } catch (error) {
    console.error("Error updating operational budget:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOperationalBudget = async (req, res) => {
  try {
    const budget = await OperationalBudget.findByPk(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget tidak ditemukan" });
    }

    await budget.destroy();
    res.status(200).json({ success: true, message: "Budget operasional berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting operational budget:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importOperationalBudgets = async (req, res) => {
  try {
    const budgets = Array.isArray(req.body) ? req.body : [];
    const normalizedBudgets = budgets
      .map((item, index) => ({
        ...item,
        key: String(item.key || `${Date.now()}-${index}`),
      }));

    await OperationalBudget.destroy({ where: {}, truncate: true });
    await OperationalBudget.bulkCreate(normalizedBudgets.map((item) => buildPayload(item)));

    res.status(200).json({
      success: true,
      message: "Berhasil import data operational budget",
    });
  } catch (error) {
    console.error("Error importing operational budgets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllOperationalBudgets = async (_req, res) => {
  try {
    const deletedCount = await OperationalBudget.destroy({
      where: {},
      truncate: true,
    });

    res.status(200).json({
      success: true,
      message: "Semua data operational budget berhasil dihapus",
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error deleting all operational budgets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
