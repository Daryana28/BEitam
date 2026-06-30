import { AssetBudget } from "../../../models/index.js";

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