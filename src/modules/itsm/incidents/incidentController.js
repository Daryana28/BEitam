// be\src\modules\itsm\incidents\incidentController.js
import incidentService from "./incidentService.js";

const getAll = async (req, res) => {
  try {
    const data = await incidentService.getAll(req.query);

    return res.status(200).json({
      success: true,
      message: "Success",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getById = async (req, res) => {
  try {
    const data = await incidentService.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Success",
      data,
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
    const data = await incidentService.create(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Created",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const data = await incidentService.update(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Updated",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await incidentService.remove(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Deleted",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};