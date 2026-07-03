// be/src/modules/user/userController.js
import userService from "./userService.js";
import { User, Role, Department } from "../../models/index.js";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import {
  getExistingUserColumns,
  hasUserColumn,
  pickExistingUserPayload,
} from "./userColumnHelper.js";

const PROFILE_USER_ATTRIBUTES = [
  "user_id",
  "username",
  "full_name",
  "email",
  "phone",
  "profile_picture",
  "department_id",
];

const getAll = async (req, res) => {
    try {
        const result = await userService.getAll(req.query);

        return res.status(200).json({
            success: true,
            message: "Success",
            data: result.rows,
            meta: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
            },
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
        const result = await userService.getById(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Success",
            data: result,
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
        const result = await userService.create(req.body);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const update = async (req, res) => {
    try {
        const result = await userService.update(req.params.id, req.body);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const remove = async (req, res) => {
    try {
        const result = await userService.remove(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userAttributes = await getExistingUserColumns(PROFILE_USER_ATTRIBUTES);
    const user = await User.findByPk(req.user.id, {
      attributes: userAttributes,
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["role_name"],
        },
        {
          model: Department,
          attributes: ["department_name"],
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const roles = user.roles?.map(r => r.role_name) || [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const profilePicture = user.profile_picture
      ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${baseUrl}${user.profile_picture}`)
      : "";

    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || "",
        profile_picture: profilePicture,
        department: user.Department?.department_name || "IT",
        roles,
      }
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { full_name, phone } = req.body;
    if (!full_name) {
      return res.status(400).json({ success: false, message: "Nama lengkap wajib diisi" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    await user.update(await pickExistingUserPayload({
      full_name,
      phone: phone || null
    }));

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: {
        full_name: user.full_name,
        phone: user.phone || ""
      }
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserProfilePicture = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File gambar wajib diunggah" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    // Delete old profile picture if exists
    const supportsProfilePicture = await hasUserColumn("profile_picture");

    if (!supportsProfilePicture) {
      return res.status(400).json({ success: false, message: "Kolom profile_picture belum tersedia di database" });
    }

    if (user.profile_picture) {
      const oldPath = path.resolve(".", user.profile_picture.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const picturePath = `/uploads/profile/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullPictureUrl = `${baseUrl}${picturePath}`;
    await user.update(await pickExistingUserPayload({
      profile_picture: picturePath
    }));

    return res.status(200).json({
      success: true,
      message: "Foto profil berhasil diperbarui",
      data: {
        profile_picture: fullPictureUrl
      }
    });
  } catch (error) {
    console.error("Error in updateUserProfilePicture:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: "Semua kolom password wajib diisi" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Konfirmasi password baru tidak cocok" });
    }

    const userAttributes = await getExistingUserColumns(["user_id", "username", "full_name", "email", "password_hash"]);
    const user = await User.findByPk(req.user.id, {
      attributes: userAttributes,
      include: [{ model: Role, as: "roles", attributes: ["role_name"] }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Password lama salah" });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await user.update({
      password_hash: newHash
    });

    const roles = user.roles?.map((r) => r.role_name) || [];
    const payload = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      roles,
      must_change_password: 0,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "1d",
    });

    const refreshToken = jwt.sign({ ...payload, type: "refresh" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Password berhasil diganti",
      token,
      user: {
        id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        roles,
        must_change_password: 0,
      },
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await userService.resetPassword(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      data: result
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
    getAll,
    getById,
    create,
    update,
    remove,
    getUserProfile,
    updateUserProfile,
    updateUserProfilePicture,
    changePassword,
    resetPassword,
};
