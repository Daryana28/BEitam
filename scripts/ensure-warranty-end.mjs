import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const appEnv =
 process.env.APP_ENV ||
 process.env.NODE_ENV ||
 "development";

dotenv.config({
 path: path.join(
  projectRoot,
  `.env.${appEnv}`
 ),
});
dotenv.config({
 path: path.join(projectRoot, ".env"),
 override: false,
});

const { default: sequelize } = await import("../src/config/db/db.js");

try {
 await sequelize.authenticate();
 await sequelize.query(
  "IF COL_LENGTH('assets', 'warranty_end') IS NULL ALTER TABLE assets ADD warranty_end DATE NULL;"
 );
 console.log("warranty_end ensured");
} finally {
 await sequelize.close();
}
