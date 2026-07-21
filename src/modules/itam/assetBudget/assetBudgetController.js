import { AssetBudget } from "../../../models/index.js";

function buildPayload(body = {}) {
  return {
    budget_code: body.budgetCode,
    subject: body.subject,
    initial_plan: body.initialPlan,
    review: body.review,
    item_no: body.itemNo,
    item_name: body.itemName,
    factory: body.factory,
    vehicle_type: body.vehicleType,
    qty: body.qty,
    purpose: body.purpose,
    sale: body.sale,
    currency: body.currency,
    price_pengajuan: body.pricePengajuan,
    purchase_price: body.purchasePrice,
    budget: body.initialBudget,
    po_date: body.poDate,
    ship_date: body.shipDate,
    acceptance_month: body.acceptanceMonth,
    payment_condition: body.paymentCondition,
    payment_date_1: body.paymentDate1,
    payment_rate_1: body.paymentRate1,
    payment_amount_1: body.paymentAmount1,
    payment_date_2: body.paymentDate2,
    payment_rate_2: body.paymentRate2,
    payment_amount_2: body.paymentAmount2,
    payment_date_3: body.paymentDate3,
    payment_rate_3: body.paymentRate3,
    payment_amount_3: body.paymentAmount3,
    mass_pro_timing: body.massProTiming,
    capitalized_month: body.capitalizedMonth,
  };
}

export const importAssetBudgets = async (req, res) => {
  try {
    const budgets = req.body;

    console.log(
      "DEBUG: Importing asset budgets:",
      JSON.stringify(budgets, null, 2)
    );

    await AssetBudget.bulkCreate(budgets);

    res.status(200).json({
      success: true,
      message: "Berhasil import data budget",
    });
  } catch (error) {
    console.error("Error importing asset budgets:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAssetBudgets = async (req, res) => {
  try {
    const budgets = await AssetBudget.findAll({
      // Urut berdasarkan No Budget dari kecil ke besar
      order: [
        ["budget_code", "ASC"],
        ["item_no", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error("Error fetching asset budgets:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAllAssetBudgets = async (req, res) => {
  try {
    const deletedCount = await AssetBudget.destroy({
      where: {},
      truncate: true,
    });

    res.status(200).json({
      success: true,
      message: "Semua data asset budget berhasil dihapus",
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error deleting all asset budgets:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAssetBudget = async (req, res) => {
  try {
    const budget = await AssetBudget.findByPk(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Data asset budget tidak ditemukan",
      });
    }

    await budget.update(buildPayload(req.body));

    res.status(200).json({
      success: true,
      message: "Data asset budget berhasil diperbarui",
      data: budget,
    });
  } catch (error) {
    console.error("Error updating asset budget:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
