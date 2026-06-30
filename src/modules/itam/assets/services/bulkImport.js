// be\src\modules\itam\assets\services\bulkImport.js
import db from "../../../../models/index.js";
import writeAudit from "../../../../core/utils/writeAudit.js";
import { ensureCurrentCycleTimeline } from "./timeline.js";

const {
 Asset,
 AssetCategory,
 sequelize,
} = db;

const TYPE_ALIAS_GROUPS = [
  {
    aliases: ["all in one", "aio", "desktop", "workstation", "pc", "personal computer"],
    candidates: ["personal computer", "pc industrial", "pc"],
  },
  {
    aliases: ["pc industrial", "industrial pc", "pc industri"],
    candidates: ["pc industrial", "personal computer", "pc"],
  },
  {
    aliases: ["cctv", "camera", "ip camera"],
    candidates: ["cctv"],
  },
  {
    aliases: ["nvr", "nvr cctv"],
    candidates: ["nvr", "cctv"],
  },
  {
    aliases: ["scanner", "scanners"],
    candidates: ["scanners", "scanner"],
  },
  {
    aliases: ["access door", "acces door", "fingerprint", "face attendance", "suprema", "reader"],
    candidates: ["acces door", "face attendance"],
  },
  {
    aliases: ["gathering", "teleconference", "podcast", "wireless display transmiter", "camera pocket"],
    candidates: ["teleconference", "podcast", "wireless display transmiter", "camera pocket"],
  },
];

const TYPE_CODE_CANDIDATES = {
 PC: ["personal computer", "pc", "desktop", "all in one", "workstation", "pc industrial"],
 CCTV: ["cctv", "nvr", "camera"],
 GATHERING: ["teleconference", "podcast", "wireless display transmiter", "camera pocket", "gathering"],
 SCANNER: ["scanners", "scanner"],
 ACCESSDOOR: ["acces door", "access door", "face attendance", "fingerprint", "reader", "suprema"],
};

function normalizeValue(value = "") {
 return String(value || "").trim().toLowerCase();
}

function includesKeywordMatch(source = "", keywords = []) {
 const normalizedSource = normalizeValue(source);
 return keywords.some((keyword) => normalizedSource.includes(normalizeValue(keyword)));
}

function isGatheringFamily(typeCode = "", typeValue = "") {
 const normalizedTypeCode = String(typeCode || "").trim().toUpperCase();
 const normalizedTypeValue = normalizeValue(typeValue);
 return (
  normalizedTypeCode === "GATHERING" ||
  ["gathering", "teleconference", "podcast", "wireless display transmiter", "camera pocket"].some(
   (keyword) =>
    normalizedTypeValue === keyword ||
    normalizedTypeValue.includes(keyword)
  )
 );
}

function resolveGenericTypeCodeName(typeCode = "") {
 const normalizedTypeCode = String(typeCode || "").trim().toUpperCase();

  switch (normalizedTypeCode) {
  case "PC":
   return "PC";
  case "CCTV":
   return "CCTV";
  case "GATHERING":
   return "GATHERING";
  case "SCANNER":
   return "SCANNER";
  case "ACCESSDOOR":
   return "ACCESSDOOR";
  case "LAINNYA":
   return "LAINNYA";
  default:
   return normalizedTypeCode;
 }
}

function isSoftwareCategory(categoryId, categories = []) {
 const categoryMap = new Map(
  categories.map((category) => [String(category.category_id), category])
 );

 let current = categoryMap.get(String(categoryId || ""));

 while (current) {
  if (normalizeValue(current.category_name) === "software hardware") {
   return true;
  }

  current = current.parent_id
   ? categoryMap.get(String(current.parent_id))
   : null;
 }

 return false;
}

export default async function (
 rows = [],
 req
) {
 if (
  !Array.isArray(rows) ||
  !rows.length
 ) {
  throw new Error(
   "Rows required"
  );
 }

 const trx =
  await sequelize.transaction();

 try {
  const parseDate = (val) => {
   if (!val) return null;
   const str = String(val).trim();
   if (str === "" || str === "-" || str.toUpperCase() === "N/A") return null;
   const formatted = str.replace(/\//g, "-");
   const d = new Date(formatted);
   if (isNaN(d.getTime())) return null;
   return d.toISOString().split("T")[0];
  };

  const allCategories = await AssetCategory.findAll({
   attributes: ["category_id", "category_name", "parent_id", "level_no"],
  });

  const findRootCategory = (rootName) =>
   allCategories.find(
    (category) =>
     !category.parent_id &&
     normalizeValue(category.category_name) === normalizeValue(rootName)
   );

  const resolveCategoryId = (rawTypeValue) => {
   const normalizedType = normalizeValue(rawTypeValue);
   if (!normalizedType) return null;

   const exactMatch = allCategories.find(
    (category) => normalizeValue(category.category_name) === normalizedType
   );
   if (exactMatch) return exactMatch.category_id;

   const containsMatch = allCategories.find((category) => {
    const categoryName = normalizeValue(category.category_name);
    return categoryName.includes(normalizedType) || normalizedType.includes(categoryName);
   });
   if (containsMatch) return containsMatch.category_id;

   const aliasGroup = TYPE_ALIAS_GROUPS.find((group) =>
    group.aliases.some((alias) => {
     const normalizedAlias = normalizeValue(alias);
     return normalizedType.includes(normalizedAlias) || normalizedAlias.includes(normalizedType);
    })
   );

   if (!aliasGroup) return null;

   for (const candidate of aliasGroup.candidates) {
    const matchedCandidate = allCategories.find(
     (category) => normalizeValue(category.category_name) === normalizeValue(candidate)
    );
    if (matchedCandidate) {
     return matchedCandidate.category_id;
    }
   }

   for (const candidate of aliasGroup.candidates) {
    const matchedCandidate = allCategories.find((category) => {
     const categoryName = normalizeValue(category.category_name);
     const normalizedCandidate = normalizeValue(candidate);
     return (
      categoryName.includes(normalizedCandidate) ||
      normalizedCandidate.includes(categoryName)
     );
    });
    if (matchedCandidate) {
     return matchedCandidate.category_id;
    }
   }

   if (aliasGroup.aliases.some((alias) => includesKeywordMatch(normalizedType, [alias]))) {
    const matchedByAliasKeyword = allCategories.find((category) =>
     aliasGroup.aliases.some((alias) =>
      includesKeywordMatch(category.category_name, [alias])
     )
    );
    if (matchedByAliasKeyword) {
      return matchedByAliasKeyword.category_id;
    }
   }

   if (includesKeywordMatch(normalizedType, ["pc", "personal computer", "desktop", "all in one", "workstation"])) {
    const matchedPcCategory = allCategories.find((category) =>
     includesKeywordMatch(category.category_name, ["pc", "personal computer", "desktop", "all in one", "workstation"])
    );
    if (matchedPcCategory) {
     return matchedPcCategory.category_id;
    }
   }

   if (includesKeywordMatch(normalizedType, ["access door", "acces door", "fingerprint", "reader", "suprema"])) {
    const matchedAccessDoorCategory = allCategories.find((category) =>
     includesKeywordMatch(category.category_name, ["access door", "acces door", "fingerprint", "reader", "suprema", "face attendance"])
    );
    if (matchedAccessDoorCategory) {
     return matchedAccessDoorCategory.category_id;
    }
   }

   return null;
  };

  const resolveCategoryIdByTypeCode = (rawTypeCode) => {
   const normalizedTypeCode = normalizeValue(rawTypeCode).toUpperCase();
   if (!normalizedTypeCode) return null;

   const directTypeCodeMatch = allCategories.find((category) => {
    const categoryName = normalizeValue(category.category_name);
    const normalizedCodeName = normalizeValue(normalizedTypeCode);
    return (
     categoryName === normalizedCodeName ||
     categoryName.includes(normalizedCodeName) ||
     normalizedCodeName.includes(categoryName)
    );
   });
   if (directTypeCodeMatch) {
    return directTypeCodeMatch.category_id;
   }

   const candidates = TYPE_CODE_CANDIDATES[normalizedTypeCode];
   if (!candidates?.length) return null;

   for (const candidate of candidates) {
    const matchedCandidate = allCategories.find(
     (category) => normalizeValue(category.category_name) === normalizeValue(candidate)
    );
    if (matchedCandidate) {
     return matchedCandidate.category_id;
    }
   }

   for (const candidate of candidates) {
    const matchedCandidate = allCategories.find((category) =>
     includesKeywordMatch(category.category_name, [candidate])
    );
    if (matchedCandidate) {
     return matchedCandidate.category_id;
    }
   }

   return null;
  };

  const ensureCategoryForImport = async (rawTypeCode, rawTypeValue) => {
   const genericTypeCodeName = resolveGenericTypeCodeName(rawTypeCode);
   const desiredCategoryName = isGatheringFamily(rawTypeCode, rawTypeValue)
    ? (String(rawTypeValue || "").trim() || "GATHERING")
    : (genericTypeCodeName || String(rawTypeValue || "").trim());

   if (!desiredCategoryName) return null;

   const existingCategory = allCategories.find(
    (category) => normalizeValue(category.category_name) === normalizeValue(desiredCategoryName)
   );
   if (existingCategory) {
    return existingCategory.category_id;
   }

   const normalizedTypeCode = String(rawTypeCode || "").trim().toUpperCase();
   const hardwareTypeCodes = new Set([
    "PC",
    "CCTV",
    "GATHERING",
    "SCANNER",
    "ACCESSDOOR",
    "LAINNYA",
   ]);
   const hardwareRoot = findRootCategory("Hardware");
   const softwareHardwareRoot = findRootCategory("Software Hardware");
   const parentCategory = hardwareTypeCodes.has(normalizedTypeCode)
    ? hardwareRoot
    : softwareHardwareRoot;

   const createdCategory = await AssetCategory.create(
    {
     category_name: desiredCategoryName,
     category_code: `CAT-${Date.now()}`,
     parent_id: parentCategory?.category_id || null,
     show_in_tabs: !parentCategory,
     level_no: parentCategory ? Number(parentCategory.level_no || 1) + 1 : 2,
     sort_no: 0,
     is_active: true,
     created_at: new Date(),
    },
    {
     transaction: trx,
    }
   );

   allCategories.push({
    category_id: createdCategory.category_id,
    category_name: createdCategory.category_name,
    parent_id: createdCategory.parent_id,
    level_no: createdCategory.level_no,
   });

   return createdCategory.category_id;
  };

  for (const row of rows) {
   const assetCode =
    row.asset_code ||
    row.asset_tag ||
    row.NO_ASSET ||
    row["NO ASSET"] ||
    row["NO.ASSET"];
   if (!assetCode) continue;

   let categoryId = row.category_id || null;
   const typeCodeRaw =
    row.type_code ||
    row["TYPE CODE"] ||
    row.typeCode ||
    null;
   const typeStrRaw =
    row.TYPE ||
    row.type ||
    row.category_name ||
    row.__sheet_name ||
    null;
   
   if (!categoryId && typeCodeRaw) {
    categoryId = resolveCategoryIdByTypeCode(typeCodeRaw);
   }

   if (!categoryId && typeStrRaw) {
    categoryId = resolveCategoryId(typeStrRaw);
   }

   if (!categoryId && normalizeValue(typeCodeRaw).toUpperCase() === "GATHERING") {
    categoryId = resolveCategoryId("teleconference");
   }

   if (!categoryId && typeCodeRaw) {
    categoryId = await ensureCategoryForImport(typeCodeRaw, typeCodeRaw);
   }

   if (!categoryId) {
    categoryId = await ensureCategoryForImport(typeCodeRaw, typeStrRaw);
   }

   if (!categoryId) {
    throw new Error(`Kategori "${typeStrRaw || 'Kosong'}" untuk Asset ${assetCode} tidak ditemukan di sistem.`);
   }

   const assetName =
    row.asset_name ||
    row["NAMA ASET"] ||
    row.TYPE ||
    row.type ||
    row.hostname ||
    row.HOSTNAME ||
   assetCode;

   const softwareMode = isSoftwareCategory(categoryId, allCategories);
   const softwareQty =
    row.qty ||
    row.QTY ||
    null;
   const softwareType =
    row.type ||
    row.TYPE ||
    null;
   const softwareLastRenew =
    row.last_renew ||
    row["LAST RENEW"] ||
    null;
   const softwareNextRenewal =
    row.next_renewal ||
    row["Next Renewal (MM/YYYY)"] ||
    row.depreciation_date ||
    row["DEPRESIASI (5+1 Th)"] ||
    null;

   const payload = {
    asset_code: assetCode,
    asset_name: assetName,
    category_id:
     categoryId,
    location_id:
     row.location_id ||
     null,
    serial_number:
     row.serial_number ||
     row["SERIAL NUMBER"] ||
     null,
    status:
     row.status ||
     row.STATUS ||
     "ACTIVE",
    purchase_date: parseDate(row.purchase_date || row.PEMBELIAN),
    depreciation_date: parseDate(row.depreciation_date || row["DEPRESIASI (5+1 Th)"]),
    hostname:
     row.hostname ||
     row.HOSTNAME ||
     null,
    owner_name:
     row.owner_name ||
     row["NAMA PIC"] ||
     null,
    division:
     row.division ||
     row.DIVISI ||
     null,
    department:
     row.department ||
     row.DEPT ||
     null,
    nik:
     row.nik ||
     row.NIK ||
     null,
    ip_main:
     row.ip_main ||
     row["IP ADDRESS MAIN"] ||
     null,
    ip_backup:
     row.ip_backup ||
     row["IP ADDRESS BACKUP"] ||
     null,
    mac_address: softwareMode ? (softwareQty || null) : undefined,
    operating_system: softwareMode ? (softwareType || null) : undefined,
    os_version: softwareMode ? (softwareLastRenew || null) : undefined,
    antivirus_status: softwareMode ? (softwareNextRenewal || null) : undefined,
   };

   let exist = await Asset.findOne({
    where: {
     asset_code: payload.asset_code,
    },
    transaction: trx,
   });

   if (!exist && payload.hostname) {
    exist = await Asset.findOne({
     where: {
      hostname: payload.hostname,
     },
     transaction: trx,
    });
   }

   if (exist) {
   await exist.update(
     payload,
     {
      transaction:
       trx,
     }
    );
    await ensureCurrentCycleTimeline(exist, req, trx);
   } else {
    const created = await Asset.create(
     {
      ...payload,
      created_at: new Date(),
     },
     {
      transaction:
       trx,
     }
    );
    await ensureCurrentCycleTimeline(created, req, trx);
   }
  }

  await trx.commit();

  await writeAudit({
   req,
   moduleName:
    "ITAM",
   entityName:
    "ASSET",
   entityId: 0,
   actionName:
    "IMPORT",
   description: `Bulk import ${rows.length} rows`,
  });

  return true;
 } catch (error) {
  try {
   await trx.rollback();
  } catch (err) {
   // Ignore if already rolled back
  }
  throw error;
 }
}
