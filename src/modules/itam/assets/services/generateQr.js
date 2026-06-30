// be\src\modules\itam\assets\services\generateQr.js
import QRCode from "qrcode";
import db from "../../../../models/index.js";

const {
 Asset,
} = db;

export default async function (
 assetId
) {
 const asset =
  await Asset.findByPk(
   assetId
  );

 if (!asset) {
  throw new Error(
   "Asset not found"
  );
 }

 const payload = JSON.stringify({
  asset_id:
   asset.asset_id,
  asset_code:
   asset.asset_code,
  asset_name:
   asset.asset_name,
 });

 const qr =
  await QRCode.toDataURL(
   payload
  );

 await asset.update({
  qr_code: qr,
 });

 return {
  qr_code: qr,
 };
}