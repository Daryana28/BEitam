// be\src\modules\itam\assets\services\getAll.js
import db from "../../../../models/index.js";
import { Op, where, col } from "sequelize";

const {
 Asset,
 AssetCategory,
 AssetLocation,
 AssetLifecycle,
 sequelize,
} = db;

const include = [
 {
  model: AssetCategory,
  as: "category",
  required: false,
  include: [
   {
    model: AssetCategory,
    as: "parent",
    required: false,
    attributes: ["category_id", "category_name"],
   },
  ],
 },
 {
  model: AssetLocation,
  as: "location",
  required: false,
 },
 {
  model: AssetLifecycle,
  as: "lifecycles",
  required: false,
  separate: true,
  attributes: ["lifecycle_id", "action_name", "notes", "created_at"],
  order: [["created_at", "ASC"], ["lifecycle_id", "ASC"]],
 },
];

const WORKBOOK_TAB_ALIASES = {
 hardware: {
  pc: ["pc", "personal computer", "desktop", "workstation", "all in one", "pc industrial", "laptop"],
  cctv: ["cctv", "nvr", "camera"],
  gathering: ["gathering", "teleconference", "wireless display transmiter", "camera pocket", "podcast"],
  scanner: ["scanner", "scanners", "barcode scanner", "bht"],
  accessdoor: ["accessdoor", "acces door", "access door", "reader", "fingerprint", "face attendance", "suprema"],
  },
};

function normalizeValue(value = "") {
 return String(value || "").trim().toLowerCase();
}

function isSoftwareAssetRecord(record = {}) {
 const currentName = normalizeValue(record?.category?.category_name);
 const parentName = normalizeValue(record?.category?.parent?.category_name);

 return currentName === "software hardware" || parentName === "software hardware";
}

function enrichAssetRow(row) {
 const json = typeof row?.toJSON === "function" ? row.toJSON() : row;

 if (!isSoftwareAssetRecord(json)) {
  return json;
 }

 const softwareType = json.operating_system || json.type || "";

 return {
  ...json,
  qty: json.mac_address || "",
  type: softwareType,
  last_renew: json.os_version || "",
  next_renewal:
   softwareType === "Permanen"
    ? "Seumur Hidup"
    : json.antivirus_status || json.depreciation_date || "",
 };
}

export default async function (
 query = {}
) {
 const page = Math.max(
  Number(query.page) || 1,
  1
 );

 const pageSize =
  Math.max(
   Number(
    query.pageSize
   ) || 20,
   1
  );

 const offset =
  (page - 1) *
  pageSize;

 const andConditions = [];

 if (query.search) {
  andConditions.push({
   [Op.or]: [
    {
     asset_code: {
      [Op.like]: `%${query.search}%`,
     },
    },
    {
     asset_name: {
      [Op.like]: `%${query.search}%`,
     },
    },
   ],
  });
 }

const likeFields = [
 "asset_code",
  "serial_number",
  "asset_name",
  "division",
  "department",
  "owner_name",
  "nik",
  "purchase_date",
  "depreciation_date",
  "hostname",
  "ip_main",
  "ip_backup",
  "mac_address",
  "operating_system",
  "os_version",
  "antivirus_status",
 ];

 likeFields.forEach((field) => {
  if (query[field]) {
   if (field === "depreciation_date") {
    andConditions.push({
     [Op.or]: [
      {
       depreciation_date: {
        [Op.like]: `%${query[field]}%`,
       },
      },
      {
       antivirus_status: {
        [Op.like]: `%${query[field]}%`,
       },
      },
     ],
    });
    return;
   }

   andConditions.push({
    [field]: {
     [Op.like]: `%${query[field]}%`,
    },
   });
  }
 });

 if (query.workbook_tab) {
  const workbookTab = String(query.workbook_tab).trim().toLowerCase();
  const aliases = WORKBOOK_TAB_ALIASES.hardware[workbookTab] || [];

  if (aliases.length > 0) {
    andConditions.push({
      [Op.or]: aliases.flatMap((alias) => ([
        where(col("category.category_name"), { [Op.like]: `%${alias}%` }),
        { asset_name: { [Op.like]: `%${alias}%` } },
        { hostname: { [Op.like]: `%${alias}%` } },
      ])),
    });
  }
 }

 if (query.type) {
  andConditions.push(
   {
    [Op.or]: [
     where(col("category.category_name"), {
      [Op.like]: `%${query.type}%`,
     }),
     {
      asset_name: {
       [Op.like]: `%${query.type}%`,
      },
     },
     {
      operating_system: {
       [Op.like]: `%${query.type}%`,
      },
     },
    ],
   }
  );
 }

 if (query.status) {
  const normalizedStatus = query.status.toString().trim().toUpperCase();

  if (normalizedStatus === "NON ACTIVE") {
   andConditions.push({
    status: {
     [Op.ne]: "ACTIVE",
    },
   });
  } else if (normalizedStatus === "ACTIVE") {
   andConditions.push({
    status: "ACTIVE",
   });
  } else {
   andConditions.push({
    status: query.status.toString().includes(",")
     ? { [Op.in]: query.status.toString().split(",").map((s) => s.trim()) }
     : query.status,
   });
  }
 } else if (query.exclude_status) {
  andConditions.push({
   status: {
    [Op.notIn]: query.exclude_status.split(",").map((s) => s.trim()),
   },
  });
 }

 if (
  query.has_depreciation_date === true ||
  query.has_depreciation_date === "true" ||
  query.has_depreciation_date === 1 ||
  query.has_depreciation_date === "1"
 ) {
 andConditions.push({
  depreciation_date: {
   [Op.ne]: null,
  },
 });
}

 if (
  query.depreciation_due === true ||
  query.depreciation_due === "true" ||
  query.depreciation_due === 1 ||
  query.depreciation_due === "1"
 ) {
  andConditions.push({
   depreciation_date: {
    [Op.ne]: null,
    [Op.lte]: new Date().toISOString().slice(0, 10),
   },
  });
 }

 if (
  query.depreciation_history === true ||
  query.depreciation_history === "true" ||
  query.depreciation_history === 1 ||
  query.depreciation_history === "1"
 ) {
  const today = new Date().toISOString().slice(0, 10);

  andConditions.push({
   [Op.or]: [
    {
     depreciation_date: {
      [Op.ne]: null,
      [Op.lte]: today,
     },
    },
    {
     status: {
      [Op.in]: ["DISPOSE", "DISPOSED"],
     },
    },
   ],
  });
 }

 if (query.category_id) {
  const rawCategoryId =
   query.category_id.toString();

  if (rawCategoryId === "__empty__") {
   andConditions.push({
    category_id: {
     [Op.eq]: null,
    },
   });
  } else {
   andConditions.push({
    category_id: rawCategoryId.includes(",")
     ? { [Op.in]: rawCategoryId.split(",") }
     : rawCategoryId,
   });
  }
 }

 const whereClause = andConditions.length > 0
  ? { [Op.and]: andConditions }
  : {};

 const sortBy = ["purchase_date", "depreciation_date", "asset_id"].includes(query.sort_by)
  ? query.sort_by
  : "asset_id";

 const sortOrder =
  String(query.sort_order || "DESC").toUpperCase() === "ASC"
   ? "ASC"
   : "DESC";

 const order =
  sortBy === "purchase_date"
   ? [
      [sequelize.literal("CASE WHEN purchase_date IS NULL THEN 1 ELSE 0 END"), "ASC"],
      ["purchase_date", sortOrder],
      ["asset_id", "ASC"],
     ]
   : [
      [
       sortBy,
       sortOrder,
      ],
     ];

 const result =
  await Asset.findAndCountAll(
   {
    where: whereClause,
    include,
    order,
    limit:
     pageSize,
    offset,
    distinct: true,
   }
  );

 return {
  rows:
   result.rows.map(enrichAssetRow),
  total:
   result.count,
  page,
  pageSize,
  totalPages:
   Math.ceil(
    result.count /
     pageSize
   ),
 };
}
