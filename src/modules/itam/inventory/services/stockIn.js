// be\src\modules\itam\inventory\services\stockIn.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";

const {
 WarehouseStock,
 InventoryTransaction,
} = db;

export default async function (
 payload,
 req
) {
 const {
  part_id,
  qty,
 } = payload;

 if (
  !part_id ||
  !qty ||
  Number(qty) <= 0
 ) {
  throw new Error(
   "Invalid payload"
  );
 }

 const value =
  Number(qty);

 const stock =
  await WarehouseStock.findOne({
   where: {
    part_id,
   },
  });

 if (stock) {
  await stock.update({
   qty:
    Number(
     stock.qty
    ) + value,
  });
 } else {
  await WarehouseStock.create({
   part_id,
   qty: value,
  });
 }

 const trx =
  await InventoryTransaction.create({
   part_id,
   trx_type:
    "IN",
   qty: value,
  });

 await writeAudit({
  req,
  moduleName:
   "INVENTORY",
  entityName:
   "PART",
  entityId:
   part_id,
  actionName:
   "STOCK_IN",
  newData:
   payload,
  description:
   `Stock in ${value}`,
 });

 return trx;
}