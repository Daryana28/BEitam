// be\src\modules\itam\assets\services\getNextCode.js
import db from "../../../../models/index.js";

const {
 Asset,
} = db;

export default async function () {
 const last =
  await Asset.findOne({
   order: [
    [
     "asset_id",
     "DESC",
    ],
   ],
  });

 const next =
  Number(
   last?.asset_id ||
    0
  ) + 1;

 return `FI-${String(
  next
 ).padStart(
  5,
  "0"
 )}`;
}