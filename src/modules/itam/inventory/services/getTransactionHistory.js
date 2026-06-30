// be/src/modules/itam/inventory/services/getTransactionHistory.js
import db from "../../../../models/index.js";

const {
 InventoryTransaction,
 Part,
} = db;

export default async function (
 query = {}
) {
 const rows =
  await InventoryTransaction.findAll({
   include: [
    {
     model: Part,
     required: false,
    },
   ],
   order: [
    ["trx_id", "DESC"],
   ],
  });

 return rows;
}