// be\src\reset-admin.js
import "dotenv/config";
import bcrypt from "bcrypt";
import { User } from "./src/models/index.js";

const hash = await bcrypt.hash("123456", 10);

await User.update(
  { password_hash: hash },
  { where: { user_id: 1 } }
);

console.log("Password updated");
process.exit();