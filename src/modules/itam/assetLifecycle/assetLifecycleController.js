// be\src\modules\itam\assetLifecycle\assetLifecycleController.js
import assetLifecycleService from "./assetLifecycleService.js";

const getByAssetId =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await assetLifecycleService.getByAssetId(
          req.params.id
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Success",
          data: result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

const create =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await assetLifecycleService.create(
          req.params.id,
          req.body,
          req.user?.user_id
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Created",
          data: result,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

export default {
  getByAssetId,
  create,
};