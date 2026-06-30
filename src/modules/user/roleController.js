// be/src/modules/user/roleController.js
import roleService from "./roleService.js";

const getAll = async (req, res) => {
    try {
        const roles = await roleService.getAll();
        return res.status(200).json({
            success: true,
            message: "Success",
            data: roles,
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
};