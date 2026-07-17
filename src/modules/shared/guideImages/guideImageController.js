import guideImageService from "./guideImageService.js";

const list = async (req, res) => {
  try {
    const data = await guideImageService.list();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const upload = async (req, res) => {
  try {
    const data = await guideImageService.upload({
      guideKey: req.params.guideKey,
      label: req.body.label,
      file: req.file,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Gambar panduan berhasil disimpan.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  list,
  upload,
};
