// be/src/modules/itam/assetCategories/assetCategoryController.js
import db from "../../../models/index.js";

const { AssetCategory, Asset } = db;

const getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.all !== "true") {
      where.is_active = true;
    }

    const rows = await AssetCategory.findAll({
      where,
      order: [
        ["level_no", "ASC"],
        ["sort_no", "ASC"],
        ["category_name", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Success",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const { category_name, parent_id, level_no, sort_no, is_active, show_in_tabs } = req.body;
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const checkParentId = parent_id ? Number(parent_id) : null;
    const existing = await AssetCategory.findOne({
      where: {
        category_name,
        parent_id: checkParentId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Kategori dengan nama yang sama sudah ada di level ini.",
      });
    }

    const category_code = `CAT-${Date.now()}`;

    const category = await AssetCategory.create({
      category_name,
      category_code,
      show_in_tabs: show_in_tabs !== undefined ? !!show_in_tabs : true,
      parent_id: parent_id ? Number(parent_id) : null,
      level_no: level_no !== undefined ? Number(level_no) : 1,
      sort_no: sort_no !== undefined ? Number(sort_no) : 0,
      is_active: is_active !== undefined ? !!is_active : true,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Category created",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.errors ? error.errors.map(e => e.message).join(', ') : error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, parent_id, level_no, sort_no, is_active, show_in_tabs } = req.body;

    const category = await AssetCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const updateData = {};
    if (category_name !== undefined) updateData.category_name = category_name;
    if (show_in_tabs !== undefined) updateData.show_in_tabs = !!show_in_tabs;
    if (parent_id !== undefined) updateData.parent_id = parent_id ? Number(parent_id) : null;
    if (level_no !== undefined) updateData.level_no = Number(level_no);
    if (sort_no !== undefined) updateData.sort_no = Number(sort_no);
    if (is_active !== undefined) updateData.is_active = !!is_active;

    if (category_name !== undefined || parent_id !== undefined) {
      const newName = category_name !== undefined ? category_name : category.category_name;
      const newParentId = updateData.parent_id !== undefined ? updateData.parent_id : category.parent_id;

      const existing = await AssetCategory.findOne({
        where: {
          category_name: newName,
          parent_id: newParentId,
        },
      });

      if (existing && String(existing.category_id) !== String(id)) {
        return res.status(400).json({
          success: false,
          message: "Kategori dengan nama yang sama sudah ada di level ini.",
        });
      }
    }

    await category.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Category updated",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.errors ? error.errors.map(e => e.message).join(', ') : error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await AssetCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Check if there are subcategories
    const subCategory = await AssetCategory.findOne({
      where: { parent_id: id },
    });
    if (subCategory) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because it has subcategories. Please reassign or delete them first.",
      });
    }

    // Check if there are assets using this category
    const assetInstance = await Asset.findOne({
      where: { category_id: id },
    });
    if (assetInstance) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because it is still integrated with assets. Please check and reassign the assets first.",
      });
    }

    await category.destroy();
    return res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getAll,
  create,
  update,
  remove,
};