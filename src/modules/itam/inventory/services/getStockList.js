// be/src/modules/itam/inventory/services/getStockList.js
import db from "../../../../models/index.js";

const {
 WarehouseStock,
 Part,
} = db;

export default async function (
 query = {}
) {
 const rows =
  await WarehouseStock.findAll({
   include: [
    {
     model: Part,
     required: false,
    },
   ],
   order: [
    ["stock_id", "DESC"],
   ],
  });

 return rows;
}