// be\src\modules\itam\assetLifecycle\assetLifecycleService.js
import repository from "./assetLifecycleRepository.js";

const ALLOWED_ACTIONS = [
  "PROCURED",
  "RECEIVED",
  "IN_STOCK",
  "DEPLOYED",
  "TRANSFERRED",
  "MAINTENANCE",
  "REPAIRED",
  "NEW",
  "PLANNING",
  "REPLACED",
  "LOST",
  "RETIRED",
  "DISPOSED",
  "WRITE_OFF",
];

const getByAssetId =
  async (assetId) => {
    return await repository.getByAssetId(
      assetId
    );
  };

const create =
  async (
    assetId,
    payload,
    userId
  ) => {
    const actionName =
      String(
        payload.action_name || ""
      ).toUpperCase();

    if (
      !ALLOWED_ACTIONS.includes(
        actionName
      )
    ) {
      throw new Error(
        "Invalid action_name"
      );
    }

    return await repository.create({
      asset_id: assetId,
      action_name:
        actionName,
      from_location:
        payload.from_location ||
        null,
      to_location:
        payload.to_location ||
        null,
      notes:
        payload.notes ||
        null,
      created_by:
        userId || null,
    });
  };

export default {
  getByAssetId,
  create,
};
