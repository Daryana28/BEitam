// be\src\modules\auth\authRepository.js
import { User, Role, Permission } from "../../models/index.js";
import { getExistingUserColumns } from "../user/userColumnHelper.js";

const findByEmail = async (email) => {
  const attributes = await getExistingUserColumns([
    "user_id",
    "company_id",
    "department_id",
    "username",
    "full_name",
    "email",
    "password_hash",
    "must_change_password",
  ]);

  return User.findOne({
    where: {
      email,
      is_active: true,
    },
    attributes,
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["role_name"],
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            as: "permissions",
            attributes: ["permission_name"],
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
};

export default {
  findByEmail,
};
