// be\src\modules\itam\assets\services\index.js
import getAll from "./getAll.js";
import getById from "./getById.js";
import getNextCode from "./getNextCode.js";
import getHistory from "./getHistory.js";
import create from "./create.js";
import update from "./update.js";
import remove from "./remove.js";
import bulkImport from "./bulkImport.js";
import bulkDelete from "./bulkDelete.js";
import replace from "./replace.js";
import renewSoftware from "./renewSoftware.js";
import transferOwner from "./transferOwner.js";
import changeAssignedUser from "./changeAssignedUser.js";
import transferDepartment from "./transferDepartment.js";
import generateQr from "./generateQr.js";

export default {
 getAll,
 getById,
 getNextCode,
 getHistory,
 create,
 update,
 remove,
 bulkImport,
 bulkDelete,
 replace,
 renewSoftware,
 transferOwner,
 changeAssignedUser,
 transferDepartment,
 generateQr,
};
