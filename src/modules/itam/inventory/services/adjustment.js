// be\src\modules\itam\inventory\services\adjustment.js
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
  qty === undefined ||
  qty === null
 ) {
  throw new Error(
   "Invalid payload"
  );
 }

 const value =
  Number(qty);

 if (
  Number.isNaN(
   value
  ) ||
  value < 0
 ) {
  throw new Error(
   "Invalid qty"
  );
 }

 const stock =
  await WarehouseStock.findOne({
   where: {
    part_id,
   },
  });

 const beforeQty =
  stock
   ? Number(
      stock.qty
     )
   : 0;

 if (stock) {
  await stock.update({
   qty: value,
  });
 } else {
  await WarehouseStock.create({
   part_id,
   qty: value,
  });
 }

 const diff =
  value -
  beforeQty;

 const trxType =
  "ADJUSTMENT";

 const trx =
  await InventoryTransaction.create({
   part_id,
   trx_type:
    trxType,
   qty: diff,
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
   "ADJUSTMENT",
  oldData: {
   qty:
    beforeQty,
  },
  newData: {
   qty: value,
  },
  description:
   `Adjust stock ${beforeQty} -> ${value}`,
 });

 return trx;
}