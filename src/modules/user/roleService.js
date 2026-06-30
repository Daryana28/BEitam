// be/src/modules/user/roleService.js
import { Role } from "../../models/index.js";

const getAll = async () => {
    const roles = await Role.findAll({
        attributes: ["role_id", "role_name"],
        order: [["role_name", "ASC"]],
    });

    return roles.map((r) => ({
        role_id: r.role_id,
        role_name: r.role_name,
    }));
};

export default {
    getAll,
};