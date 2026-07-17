import fs from "fs";
import path from "path";
import db from "../../../models/index.js";

const { GuideImage } = db;

let syncPromise = null;

const ensureGuideImageTable = async () => {
  if (!syncPromise) {
    syncPromise = GuideImage.sync();
  }
  await syncPromise;
};

const toPublicUrl = (req, fileName) => {
  const relativePath = `/uploads/guides/${fileName}`;
  return `${req.protocol}://${req.get("host")}${relativePath}`;
};

const removeFileIfExists = (filePath = "") => {
  if (!filePath) return;
  const resolvedPath = path.resolve(".", filePath.replace(/^\//, ""));
  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
  }
};

const list = async () => {
  await ensureGuideImageTable();

  const rows = await GuideImage.findAll({
    order: [["guide_key", "ASC"]],
  });

  return rows.reduce((acc, row) => {
    acc[row.guide_key] = {
      id: row.guide_image_id,
      key: row.guide_key,
      label: row.label,
      url: row.file_url,
      uploaded_by: row.uploaded_by,
      updated_at: row.updated_at,
    };
    return acc;
  }, {});
};

const upload = async ({ guideKey, label, file, req }) => {
  await ensureGuideImageTable();

  if (!guideKey) {
    throw new Error("Guide key wajib diisi.");
  }

  if (!label) {
    throw new Error("Label gambar panduan wajib diisi.");
  }

  if (!file) {
    throw new Error("File gambar wajib diunggah.");
  }

  const existing = await GuideImage.findOne({
    where: { guide_key: guideKey },
  });

  if (existing?.file_path) {
    removeFileIfExists(existing.file_path);
  }

  const filePath = `/uploads/guides/${file.filename}`;
  const payload = {
    guide_key: guideKey,
    label,
    file_name: file.originalname,
    file_path: filePath,
    file_url: toPublicUrl(req, file.filename),
    file_ext: path.extname(file.originalname).toLowerCase(),
    file_size: file.size,
    uploaded_by: req.user?.id || null,
    updated_at: new Date(),
  };

  let record = existing;
  if (record) {
    await record.update(payload);
  } else {
    record = await GuideImage.create({
      ...payload,
      created_at: new Date(),
    });
  }

  return {
    id: record.guide_image_id,
    key: record.guide_key,
    label: record.label,
    url: record.file_url,
    uploaded_by: record.uploaded_by,
    updated_at: record.updated_at,
  };
};

export default {
  list,
  upload,
};
