// be\src\modules\itam\inventory\services\stockOut.js
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
  wo_id,
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

 if (
  !stock ||
  Number(stock.qty) <
   value
 ) {
  throw new Error(
   "Insufficient stock"
  );
 }

 await stock.update({
  qty:
   Number(
    stock.qty
   ) - value,
 });

 const trx =
  await InventoryTransaction.create({
   part_id,
   wo_id:
    wo_id || null,
   trx_type:
    "OUT",
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
   "STOCK_OUT",
  newData:
   payload,
  description:
   `Stock out ${value}`,
 });

 return trx;
}