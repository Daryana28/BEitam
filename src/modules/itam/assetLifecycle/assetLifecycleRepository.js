// be\src\modules\itam\assetLifecycle\assetLifecycleRepository.js
import db from "../../../models/index.js";

const {
 AssetLifecycle,
 User,
} = db;

const getByAssetId =
 async (assetId) => {
  return await AssetLifecycle.findAll({
   where: {
    asset_id: assetId,
   },
   include: [
    {
     model: User,
     as: "creator",
     required: false,
     attributes: [
      "user_id",
      "full_name",
     ],
    },
   ],
   order: [
    ["created_at", "DESC"],
   ],
  });
 };

const create =
 async (payload, options = {}) => {
  return await AssetLifecycle.create(
   payload,
   options
  );
 };

export default {
 getByAssetId,
 create,
};
