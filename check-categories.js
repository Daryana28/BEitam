import "dotenv/config";
import { AssetCategory } from "./src/models/index.js";

async function run() {
  try {
    const categories = await AssetCategory.findAll({ raw: true });
    console.log(JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

run();
