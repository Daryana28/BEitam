// be/src/modules/user/userService.js
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { User, Role, UserRole } from "../../models/index.js";
import {
    getExistingUserColumns,
    pickExistingUserPayload,
} from "./userColumnHelper.js";

const SALT_ROUNDS = 10;
const BASE_USER_ATTRIBUTES = [
    "user_id",
    "company_id",
    "department_id",
    "job_level_id",
    "supervisor_id",
    "username",
    "full_name",
    "email",
    "is_active",
    "profile_picture",
    "phone",
    "created_at",
];

const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

const getAll = async (query = {}) => {
    const {
        page = 1,
        pageSize = 10,
        search = "",
        is_active,
    } = query;

    const where = {};

    if (search) {
        where[Op.or] = [
            { username: { [Op.like]: `%${search}%` } },
            { full_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
        ];
    }

    if (is_active !== undefined && is_active !== "") {
        where.is_active = is_active === "true" || is_active === true;
    }

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);

    const userAttributes = await getExistingUserColumns(BASE_USER_ATTRIBUTES);
    const orderColumn = userAttributes.includes("created_at") ? "created_at" : "user_id";

    const { count: total, rows } = await User.findAndCountAll({
        where,
        include: [
            {
                model: Role,
                as: "roles",
                attributes: ["role_id", "role_name"],
                through: { attributes: [] },
            },
        ],
        attributes: userAttributes,
        offset,
        limit,
        order: [[orderColumn, "DESC"]],
    });

    return {
        rows,
        total,
        page: parseInt(page, 10),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
    };
};

const getById = async (id) => {
    const userAttributes = await getExistingUserColumns(BASE_USER_ATTRIBUTES);

    return await User.findByPk(id, {
        include: [
            {
                model: Role,
                as: "roles",
                attributes: ["role_id", "role_name"],
                through: { attributes: [] },
            },
        ],
        attributes: userAttributes,
    });
};

const create = async (data) => {
    const { username, full_name, email = `${username}@ikoito.co.id`, role_ids = [], is_active = true } = data;

    const existing = await User.findOne({
        where: { username },
    });

    if (existing) {
        const err = new Error("Username already exists");
        err.status = 409;
        throw err;
    }

    const plaintextPassword = generateRandomPassword();
    const password_hash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);

    const createPayload = await pickExistingUserPayload({
        company_id: 1,
        username,
        full_name,
        email,
        password_hash,
        is_active,
        created_at: new Date(),
    });

    const user = await User.create(createPayload);

    if (role_ids.length > 0) {
        const roleRecords = await Role.findAll({
            where: { role_id: role_ids },
        });

        await user.setRoles(roleRecords);
    }

    const userDetails = await getById(user.user_id);
    return {
        user: userDetails,
        plaintextPassword,
        passwordHash: password_hash
    };
};

const update = async (id, data) => {
    const user = await User.findByPk(id);

    if (!user) return null;

    const { username, full_name, email, password, role_ids, is_active } = data;

    if (username && username !== user.username) {
        const existing = await User.findOne({ where: { username } });
        if (existing && existing.user_id !== parseInt(id)) {
            const err = new Error("Username already taken");
            err.status = 409;
            throw err;
        }
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (password) {
        updateData.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await User.update(await pickExistingUserPayload(updateData), { where: { user_id: id } });

    if (role_ids !== undefined) {
        const roleRecords = await Role.findAll({
            where: { role_id: role_ids },
        });

        await user.setRoles(roleRecords);
    }

    return await getById(id);
};

const resetPassword = async (id) => {
    const user = await User.findByPk(id);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const plaintextPassword = generateRandomPassword();
    const password_hash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);

    await user.update({
        password_hash
    });

    return {
        user,
        plaintextPassword,
        passwordHash: password_hash
    };
};

const remove = async (id) => {
    const user = await User.findByPk(id);

    if (!user) return null;

    await UserRole.destroy({ where: { user_id: id } });
    await User.destroy({ where: { user_id: id } });

    return true;
};

export default {
    getAll,
    getById,
    create,
    update,
    resetPassword,
    remove,
};
