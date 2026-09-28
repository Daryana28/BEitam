import { AssetBudget, MaintenanceActual, MaintenanceAbnormalLog, MaintenanceLogSheet, MaintenanceSchedule, StandardMaintenance, StandardMaintenanceCheck, StandardMaintenanceDetail, Asset, AssetCategory, User, YearlyStandardMaintenance, sequelize } from "../../models/index.js";
import { Op } from "sequelize";
import { generateCheckboxDates } from "../cmms/maintenanceSchedule/checkboxGenerator.js";

const currency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const compactMonthKey = (date) => String(date).slice(0, 7);
const AUDIT_KMC_INVESTMENT_CODE_MAP = {
  hardware: ["26F01", "26F02", "26F03", "26F04"],
  software: ["26F05", "26F06"],
};

const toNumber = (value) => Number(value || 0);
const normalizeBudgetCode = (value) => String(value || "").trim().toUpperCase();
const formatRupiahValue = (value) => `Rp. ${toNumber(value).toLocaleString("id-ID")}`;
const getAuditKmcAmount = (row) =>
  toNumber(row.initial_plan || row.budget || row.purchase_price || row.price_pengajuan || 0);
const getAuditKmcLabel = (row) => String(row.subject || row.item_name || row.budget_code || "-").trim();
const HARDWARE_SUMMARY_TABS = [
  { key: "pc", label: "PC", aliases: ["pc", "personal computer", "desktop", "workstation", "all in one", "pc industrial", "laptop"] },
  { key: "cctv", label: "CCTV", aliases: ["cctv", "nvr", "camera"] },
  { key: "gathering", label: "GATHERING", aliases: ["gathering", "teleconference", "wireless display transmiter", "camera pocket", "podcast"] },
  { key: "scanner", label: "SCANNER", aliases: ["scanner", "scanners", "barcode scanner", "bht"] },
  { key: "accessdoor", label: "ACCESSDOOR", aliases: ["accessdoor", "acces door", "access door", "reader", "fingerprint", "face attendance", "suprema"] },
];
const SOFTWARE_SUMMARY_CATEGORY_ALIASES = [
  { label: "HARDWARE WARRANTY", aliases: ["hardware warranty", "warranty hardware", "garansi hardware"] },
  { label: "LICENSE SOFTWARE", aliases: ["license software", "software license", "lisensi software", "lisensi aplikasi"] },
  { label: "MAINTENANCE FEE", aliases: ["maintenance fee", "biaya maintenance", "maintenance cost", "support fee"] },
];
const MAINTENANCE_CATEGORY_GROUPS = [
  { key: "hardware", label: "Hardware", aliases: ["hardware"] },
  { key: "software-hardware", label: "Software Hardware", aliases: ["software hardware", "software hw", "software_hw", "software-hardware"] },
  { key: "application", label: "Application", aliases: ["application", "applications", "app"] },
  {
    key: "cyber-network",
    label: "Cyber Network",
    aliases: [
      "network",
      "networking",
      "network cyber",
      "network_cyber",
      "network-cyber",
      "network & cybersecurity",
      "network and cybersecurity",
      "network cybersecurity",
      "cyber",
      "cyber security",
      "cyber-security",
      "cybersecurity",
      "cyber network",
    ],
  },
];
const SCHEDULE_MONITORING_STATUSES = [
  { key: "upcoming", label: "Upcoming" },
  { key: "due", label: "Due / Remaining" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

const buildAuditKmcSectionRow = (key, item, rows = []) => {
  const normalizedRows = rows.filter(Boolean);
  const amount = normalizedRows.reduce((sum, row) => sum + getAuditKmcAmount(row), 0);
  const groupedContents = Array.from(
    normalizedRows.reduce((map, row) => {
      const budgetCode = normalizeBudgetCode(row.budget_code) || "-";
      const label = getAuditKmcLabel(row);
      const groupKey = `${budgetCode}__${label}`;
      const current = map.get(groupKey) || {
        budgetCode,
        label,
        amount: 0,
      };

      current.amount += getAuditKmcAmount(row);
      map.set(groupKey, current);
      return map;
    }, new Map()).values()
  )
    .sort((left, right) => left.budgetCode.localeCompare(right.budgetCode))
    .map((entry) => `${entry.budgetCode} - ${entry.label} (${formatRupiahValue(entry.amount)})`);

  return {
    key,
    item,
    localCurrency: formatRupiahValue(amount),
    mainContents: groupedContents,
  };
};

const buildEmptyAuditKmcSection = (key, title, rowLabels) => ({
  key,
  title,
  rows: [
    ...rowLabels.map(([rowKey, item]) => ({
      key: rowKey,
      item,
      localCurrency: "",
      mainContents: [],
    })),
    {
      key: "total",
      item: "Total",
      localCurrency: "",
      mainContents: [],
      isTotal: true,
    },
  ],
});

const buildAuditKmcSections = (budgetRows = []) => {
  const hardwareRows = budgetRows.filter((row) =>
    AUDIT_KMC_INVESTMENT_CODE_MAP.hardware.includes(normalizeBudgetCode(row.budget_code))
  );
  const softwareRows = budgetRows.filter((row) =>
    AUDIT_KMC_INVESTMENT_CODE_MAP.software.includes(normalizeBudgetCode(row.budget_code))
  );

  const hardware = buildAuditKmcSectionRow("hardware", "Hardware", hardwareRows);
  const software = buildAuditKmcSectionRow("software", "Software", softwareRows);
  const investmentTotal = toNumber(
    hardwareRows.reduce((sum, row) => sum + getAuditKmcAmount(row), 0) +
      softwareRows.reduce((sum, row) => sum + getAuditKmcAmount(row), 0)
  );

  return [
    {
      key: "investment",
      title: "Investment for adoption of IT",
      rows: [
        hardware,
        software,
        {
          key: "total",
          item: "Total",
          localCurrency: formatRupiahValue(investmentTotal),
          mainContents: [],
          isTotal: true,
        },
      ],
    },
    buildEmptyAuditKmcSection("expense", "Expense for IT", [
      ["rental", "Rental fee"],
      ["maintenance", "Maintenance and repair fee"],
    ]),
  ];
};

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeCategoryToken(value = "") {
  return normalizeText(value)
    .replace(/[_/&()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDateKey(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

async function resolveDashboardPlannedDates(year, check = {}, fallbackPeriodik = "") {
  const savedDates = Array.isArray(check?.planned_dates)
    ? check.planned_dates.map(normalizeDateKey).filter(Boolean)
    : [];

  if (savedDates.length > 0) {
    return [...new Set(savedDates)].sort();
  }

  const periodikString = String(check?.periodik || fallbackPeriodik || "").trim();
  if (!periodikString) return [];
  return generateCheckboxDates(year, periodikString);
}

function isMaintenanceCategoryAliasMatch(value = "", alias = "") {
  const normalizedValue = normalizeCategoryToken(value);
  const normalizedAlias = normalizeCategoryToken(alias);

  if (!normalizedValue || !normalizedAlias) return false;
  return (
    normalizedValue === normalizedAlias ||
    normalizedValue.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedValue)
  );
}

function getScheduleDeviceLabel(schedule, fallbackStandard = null) {
  const asset = schedule?.asset;
  const standard = schedule?.StandardMaintenance || fallbackStandard;

  const hostname = String(asset?.hostname || "").trim();
  if (hostname && hostname !== "-") return hostname;

  const assetName = String(asset?.asset_name || "").trim();
  if (assetName && assetName !== "-") return assetName;

  const deviceName = String(standard?.namaPerangkat || "").trim();
  if (deviceName && deviceName !== "-") return deviceName;

  const subDeviceName = String(standard?.subPerangkat || "").trim();
  if (subDeviceName && subDeviceName !== "-") return subDeviceName;

  return "-";
}

function getActualDeviceLabel(actual) {
  const fallbackStandard = actual?.check?.standard_maintenance_detail?.standard_maintenance;
  return getScheduleDeviceLabel(actual?.schedule, fallbackStandard);
}

async function getUnifiedAssetStatusSummary() {
  const [total, active, damaged, inService] = await Promise.all([
    Asset.count(),
    Asset.count({ where: { status: 'ACTIVE' } }),
    Asset.count({ where: { status: { [Op.in]: ['NON ACTIVE', 'DISPOSE', 'DISPOSED', 'DISPOSAL'] } } }),
    Asset.count({ where: { status: { [Op.in]: ['SERVICE', 'REPAIR'] } } }),
  ]);

  return {
    total,
    active,
    damaged,
    inService,
    nonActive: Math.max(total - active, 0),
  };
}

function getAssetCategoryChain(assetRow = {}) {
  const chain = [];
  let current = assetRow?.category || null;

  while (current) {
    const categoryName = String(current?.category_name || "").trim();
    if (categoryName) {
      chain.push({
        id: current?.category_id ?? null,
        name: categoryName,
      });
    }
    current = current?.parent || null;
  }

  return chain;
}

function getAssetCategoryChainNames(assetRow = {}) {
  return getAssetCategoryChain(assetRow).map((item) => item.name);
}

function isSoftwareAssetSummaryRow(assetRow = {}) {
  return getAssetCategoryChainNames(assetRow)
    .map(normalizeText)
    .includes("software hardware");
}

function resolveFallbackAssetType(assetRow = {}) {
  const chainNames = getAssetCategoryChainNames(assetRow);
  const nonGenericName = chainNames.find((name) => {
    const normalized = normalizeText(name);
    return normalized
      && normalized !== "hardware"
      && normalized !== "software hardware"
      && normalized !== "client"
      && normalized !== "utama"
      && normalized !== "lainnya";
  });

  if (nonGenericName) {
    return String(nonGenericName).trim().toUpperCase();
  }

  return String(assetRow?.asset_name || "LAINNYA").trim().toUpperCase();
}

function resolveAssetSummaryCategory(assetRow = {}) {
  if (isSoftwareAssetSummaryRow(assetRow)) {
    const categoryChain = getAssetCategoryChainNames(assetRow);
    const valuesToCheck = [
      assetRow?.asset_name,
      assetRow?.hostname,
      ...categoryChain,
    ]
      .map(normalizeText)
      .filter(Boolean);
    const matchedTab = SOFTWARE_SUMMARY_CATEGORY_ALIASES.find((tab) =>
      tab.aliases.some((alias) => {
        const normalizedAlias = normalizeText(alias);
        return valuesToCheck.some(
          (value) =>
            value === normalizedAlias ||
            value.includes(normalizedAlias) ||
            normalizedAlias.includes(value)
        );
      })
    );

    if (matchedTab) {
      return matchedTab.label;
    }

    const scopedSoftwareCategory = categoryChain.find((name) => {
      const normalized = normalizeText(name);
      return normalized
        && normalized !== "software hardware"
        && normalized !== "software"
        && normalized !== "lainnya";
    });

    return scopedSoftwareCategory ? String(scopedSoftwareCategory).trim().toUpperCase() : "Software";
  }

  const categoryChain = getAssetCategoryChainNames(assetRow);
  const scopedLeafCategory = categoryChain.find((name) => {
    const normalized = normalizeText(name);
    return normalized
      && normalized !== "hardware"
      && normalized !== "software hardware"
      && normalized !== "client"
      && normalized !== "utama";
  });

  if (scopedLeafCategory) {
    return String(scopedLeafCategory).trim().toUpperCase();
  }

  const valuesToCheck = [
    assetRow?.asset_name,
    assetRow?.hostname,
    ...categoryChain,
  ]
    .map(normalizeText)
    .filter(Boolean);

  const matchedTab = HARDWARE_SUMMARY_TABS.find((tab) =>
    tab.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return valuesToCheck.some(
        (value) =>
          value === normalizedAlias ||
          value.includes(normalizedAlias) ||
          normalizedAlias.includes(value)
      );
    })
  );

  if (matchedTab) {
    return matchedTab.label;
  }

  return resolveFallbackAssetType(assetRow);
}

function resolveHardwareAssetScope(assetRow = {}) {
  const chainNames = getAssetCategoryChainNames(assetRow).map(normalizeText);
  if (chainNames.includes("client")) return "client";
  if (chainNames.includes("utama")) return "utama";
  return null;
}

function resolveMaintenanceCategoryGroup(assetRow = {}) {
  const categoryChain = getAssetCategoryChainNames(assetRow).map(normalizeText).filter(Boolean);
  const valuesToCheck = [assetRow?.asset_name, assetRow?.hostname, ...categoryChain]
    .map(normalizeText)
    .filter(Boolean);
  const childCategoryName = categoryChain[0] || "";
  const parentCategoryName = categoryChain[1] || "";
  const matchesAlias = (group) =>
    group.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return valuesToCheck.some(
        (value) =>
          value === normalizedAlias ||
          value.includes(normalizedAlias) ||
          normalizedAlias.includes(value)
      );
    });

  let matchedGroup = null;

  if (childCategoryName === "application") {
    matchedGroup = MAINTENANCE_CATEGORY_GROUPS.find((group) => group.key === "application") || null;
  } else if (childCategoryName === "software hardware") {
    matchedGroup = MAINTENANCE_CATEGORY_GROUPS.find((group) => group.key === "software-hardware") || null;
  } else if (parentCategoryName === "application") {
    matchedGroup = MAINTENANCE_CATEGORY_GROUPS.find((group) => group.key === "application") || null;
  }

  if (!matchedGroup) {
    matchedGroup = MAINTENANCE_CATEGORY_GROUPS.find(matchesAlias);
  }

  return matchedGroup || MAINTENANCE_CATEGORY_GROUPS[0];
}

function resolveAbnormalCategoryGroup(abnormalLog = {}) {
  const standardFromCheck =
    abnormalLog?.actual?.check?.standard_maintenance_detail?.standard_maintenance || null;
  const standardFromSchedule = abnormalLog?.actual?.schedule?.StandardMaintenance || null;
  const assetRow = abnormalLog?.actual?.schedule?.asset || {};

  return (
    resolveMaintenanceCategoryGroupFromStandard(standardFromCheck) ||
    resolveMaintenanceCategoryGroupFromStandard(standardFromSchedule) ||
    resolveMaintenanceCategoryGroup(assetRow)
  );
}

function resolveMaintenanceCategoryGroupFromName(value = "") {
  if (!normalizeCategoryToken(value)) return null;

  return (
    MAINTENANCE_CATEGORY_GROUPS.find((group) =>
      group.aliases.some((alias) => {
        return isMaintenanceCategoryAliasMatch(value, alias);
      })
    ) || null
  );
}

function resolveMaintenanceCategoryGroupFromStandard(standardMaintenance = {}) {
  const primaryCategory = String(standardMaintenance?.kategori || "").trim();
  const normalizedPrimaryCategory = normalizeCategoryToken(primaryCategory);
  const fallbackCandidates = [
    standardMaintenance?.subKategori,
    standardMaintenance?.namaPerangkat,
    standardMaintenance?.tipePerangkat,
    standardMaintenance?.subPerangkat,
  ];

  for (const candidate of fallbackCandidates) {
    const matchedGroup = resolveMaintenanceCategoryGroupFromName(candidate);
    if (matchedGroup) return matchedGroup;
  }

  if (normalizedPrimaryCategory) {
    const matchedPrimaryGroup = resolveMaintenanceCategoryGroupFromName(primaryCategory);
    if (matchedPrimaryGroup) return matchedPrimaryGroup;

    if (normalizedPrimaryCategory === "software") {
      return MAINTENANCE_CATEGORY_GROUPS.find((group) => group.key === "application") || null;
    }

    return null;
  }

  return null;
}

function toDateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function formatDateYmd(value) {
  const parsed = toDateOrNull(value);
  if (!parsed) return "-";
  return parsed.toISOString().slice(0, 10);
}

function formatActualDateKey(value) {
  const normalized = normalizeDateKey(value);
  if (normalized) return normalized;
  const raw = String(value || "").trim();
  return raw.slice(0, 10);
}

function resolveSummaryMonthFilter(query = {}) {
  const now = new Date();
  const parsedMonth = Number.parseInt(query?.month, 10);
  const parsedYear = Number.parseInt(query?.year, 10);
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 9999 ? parsedYear : now.getFullYear();

  const monthStart = startOfDay(new Date(year, month - 1, 1));
  const monthEnd = endOfDay(new Date(year, month, 0));

  return {
    month,
    year,
    monthStart,
    monthEnd,
  };
}

function resolveScheduleAnchorDates(schedule, today = new Date()) {
  const directStart = toDateOrNull(schedule?.next_maintenance_date);
  const directEnd = toDateOrNull(schedule?.next_maintenance_end_date);
  if (directStart || directEnd) {
    return {
      startDate: directStart || directEnd,
      endDate: directEnd || directStart,
    };
  }

  const actuals = Array.isArray(schedule?.actuals) ? schedule.actuals : [];
  const sortedActuals = actuals
    .map((actual) => ({
      ...actual,
      parsedDate: toDateOrNull(actual?.tanggal),
    }))
    .filter((actual) => actual.parsedDate)
    .sort((left, right) => left.parsedDate - right.parsedDate);

  if (sortedActuals.length === 0) {
    return { startDate: null, endDate: null };
  }

  const todayStart = startOfDay(today);
  const pendingActuals = sortedActuals.filter((actual) => normalizeText(actual?.status) !== "actual");
  const nextPlannedActual =
    pendingActuals.find((actual) => startOfDay(actual.parsedDate) >= todayStart) || null;
  const latestPendingActual =
    [...pendingActuals].reverse().find((actual) => startOfDay(actual.parsedDate) < todayStart) || null;
  const latestCompletedActual =
    [...sortedActuals]
      .reverse()
      .find((actual) => normalizeText(actual?.status) === "actual") || null;
  const fallbackActual =
    sortedActuals.find(
      (actual) => startOfDay(actual.parsedDate) >= todayStart
    ) ||
    nextPlannedActual ||
    latestPendingActual ||
    latestCompletedActual ||
    sortedActuals[0];

  return {
    startDate: fallbackActual?.parsedDate || null,
    endDate: fallbackActual?.parsedDate || null,
    hasPendingActual: pendingActuals.length > 0,
    latestCompletedActualDate: latestCompletedActual?.parsedDate || null,
  };
}

function resolveScheduleMonitoringStatus(schedule, today = new Date()) {
  const todayStart = startOfDay(today);
  const { startDate, endDate, hasPendingActual, latestCompletedActualDate } = resolveScheduleAnchorDates(schedule, today);
  const endDateRaw = endDate || startDate;

  if (!hasPendingActual && latestCompletedActualDate) return "completed";
  if (!startDate && !endDateRaw) return latestCompletedActualDate ? "completed" : "upcoming";

  const startWindow = startDate ? startOfDay(startDate) : startOfDay(endDateRaw);
  const endWindow = endDateRaw ? endOfDay(endDateRaw) : endOfDay(startDate);

  if (todayStart > endWindow) return "overdue";
  if (todayStart >= startWindow && todayStart <= endWindow) return "due";
  return "upcoming";
}

function isScheduleWithinPeriod(scheduleRow, periodKey, today = new Date()) {
  const todayStart = startOfDay(today);
  const scheduleStart = toDateOrNull(scheduleRow?.nextMaintenanceDate);
  const scheduleEnd = toDateOrNull(scheduleRow?.nextMaintenanceEndDate) || scheduleStart;
  const anchor = scheduleEnd || scheduleStart;

  if (!anchor) return periodKey === "this-month";

  const anchorStart = startOfDay(anchor);
  if (periodKey === "next-7-days") {
    const next7 = new Date(todayStart);
    next7.setDate(next7.getDate() + 7);
    return anchorStart >= todayStart && anchorStart <= endOfDay(next7);
  }

  if (periodKey === "next-30-days") {
    const next30 = new Date(todayStart);
    next30.setDate(next30.getDate() + 30);
    return anchorStart >= todayStart && anchorStart <= endOfDay(next30);
  }

  return (
    anchorStart.getFullYear() === todayStart.getFullYear() &&
    anchorStart.getMonth() === todayStart.getMonth()
  );
}

function buildMaintenanceScheduleSummary(schedules = [], today = new Date()) {
  const summary = {
    upcoming: 0,
    due: 0,
    completed: 0,
    overdue: 0,
  };

  const rows = schedules.map((schedule) => {
    const statusKey = resolveScheduleMonitoringStatus(schedule, today);
    const standardMaintenance = schedule?.StandardMaintenance || null;
    const categoryGroup =
      resolveMaintenanceCategoryGroupFromStandard(standardMaintenance) ||
      resolveMaintenanceCategoryGroup(schedule?.asset || {});
    const { startDate, endDate } = resolveScheduleAnchorDates(schedule, today);
    summary[statusKey] += 1;

    return {
      key: schedule.id,
      asset: getScheduleDeviceLabel(schedule),
      categoryGroup: categoryGroup.key,
      categoryLabel: categoryGroup.label,
      sourceCategory: standardMaintenance?.kategori || "-",
      sourceSubCategory: standardMaintenance?.subKategori || "-",
      periodik: schedule.periodik || schedule.periodik_type || "-",
      dueDate: formatDateYmd(startDate),
      endDate: formatDateYmd(endDate),
      statusKey,
      statusLabel:
        SCHEDULE_MONITORING_STATUSES.find((item) => item.key === statusKey)?.label || statusKey,
      scheduleStatus: schedule.status || "ACTIVE",
    };
  });

  return { summary, rows };
}

function resolveActualMonitoringStatus(actual, today = new Date()) {
  const actualDate = toDateOrNull(actual?.tanggal);
  if (!actualDate) return "upcoming";

  if (normalizeText(actual?.status) === "actual") return "completed";

  const todayStart = startOfDay(today);
  const dateStart = startOfDay(actualDate);
  if (dateStart < todayStart) return "overdue";
  if (dateStart.getTime() === todayStart.getTime()) return "due";
  return "upcoming";
}

function buildMaintenanceActualSummary(actualRows = [], today = new Date()) {
  const summary = {
    upcoming: 0,
    due: 0,
    completed: 0,
    overdue: 0,
  };

  const rows = actualRows.map((actual) => {
    const standardMaintenance =
      actual?.check?.standard_maintenance_detail?.standard_maintenance || null;
    const categoryGroup =
      resolveMaintenanceCategoryGroupFromStandard(standardMaintenance) ||
      resolveMaintenanceCategoryGroup(actual?.schedule?.asset || {});
    const statusKey = resolveActualMonitoringStatus(actual, today);
    summary[statusKey] += 1;

    return {
      key: actual.id || `${actual.check_id}-${actual.tanggal}`,
      asset: getScheduleDeviceLabel(actual?.schedule, standardMaintenance) || standardMaintenance?.namaPerangkat || "-",
      categoryGroup: categoryGroup.key,
      categoryLabel: categoryGroup.label,
      sourceCategory: standardMaintenance?.kategori || "-",
      sourceSubCategory: standardMaintenance?.subKategori || "-",
      periodik: actual?.check?.periodik || actual?.schedule?.periodik || actual?.schedule?.periodik_type || "-",
      dueDate: formatDateYmd(actual?.tanggal),
      endDate: formatDateYmd(actual?.tanggal),
      statusKey,
      statusLabel:
        SCHEDULE_MONITORING_STATUSES.find((item) => item.key === statusKey)?.label || statusKey,
      actualStatus: actual?.status || "PLAN",
    };
  });

  return { summary, rows };
}

function buildMaintenanceStatusCategorySummary(scheduleRows = []) {
  const summaryMap = new Map(
    MAINTENANCE_CATEGORY_GROUPS.map((group) => [
      group.key,
      {
        key: group.key,
        category: group.label,
        total: 0,
        completed: 0,
        upcoming: 0,
        due: 0,
        overdue: 0,
      },
    ])
  );

  (Array.isArray(scheduleRows) ? scheduleRows : []).forEach((row) => {
    const bucket = summaryMap.get(row?.categoryGroup) || summaryMap.get("hardware");
    bucket.total += 1;

    if (row?.statusKey === "completed") bucket.completed += 1;
    else if (row?.statusKey === "due") bucket.due += 1;
    else if (row?.statusKey === "overdue") bucket.overdue += 1;
    else bucket.upcoming += 1;
  });

  return Array.from(summaryMap.values());
}

function resolveMaintenanceStatusPriority(statusKey = "") {
  if (statusKey === "overdue") return 4;
  if (statusKey === "due") return 3;
  if (statusKey === "upcoming") return 2;
  return 1;
}

function resolveMaintenanceSourceCategory(row = {}) {
  return (
    String(row?.sourceSubCategory || "").trim() ||
    String(row?.sourceCategory || "").trim() ||
    String(row?.asset || "").trim() ||
    "-"
  );
}

function buildMaintenanceStatusEntriesBySourceCategory(scheduleRows = []) {
  const categoryMap = new Map();

  (Array.isArray(scheduleRows) ? scheduleRows : []).forEach((row, index) => {
    const groupKey = row?.categoryGroup || "hardware";
    const sourceCategory = resolveMaintenanceSourceCategory(row);
    const normalizedCategory = normalizeText(sourceCategory) || `uncategorized-${index + 1}`;
    const normalizedDueDate = String(row?.dueDate || "").trim() || `undated-${index + 1}`;
    const uniqueKey = `${groupKey}__${normalizedCategory}__${normalizedDueDate}`;
    const nextPriority = resolveMaintenanceStatusPriority(row?.statusKey);
    const current = categoryMap.get(uniqueKey);

    if (!current) {
      categoryMap.set(uniqueKey, {
        ...row,
        key: uniqueKey,
        sourceCategory,
        asset: sourceCategory,
        dueDate: normalizedDueDate,
        planCount: 1,
        completedCount: row?.statusKey === "completed" ? 1 : 0,
        pendingChecks: row?.statusKey === "completed"
          ? []
          : [{
              checkId: row?.checkId || null,
              actualId: row?.actualId || null,
              pengecekan: row?.pengecekan || row?.asset || sourceCategory,
              statusKey: row?.statusKey || "upcoming",
              actualStatus: row?.actualStatus || "PLAN",
            }],
        statusPriority: nextPriority,
      });
      return;
    }

    current.planCount += 1;
    if (row?.statusKey === "completed") {
      current.completedCount += 1;
    } else {
      current.pendingChecks.push({
        checkId: row?.checkId || null,
        actualId: row?.actualId || null,
        pengecekan: row?.pengecekan || row?.asset || sourceCategory,
        statusKey: row?.statusKey || "upcoming",
        actualStatus: row?.actualStatus || "PLAN",
      });
    }

    if (nextPriority > current.statusPriority) {
      current.statusPriority = nextPriority;
      current.statusKey = row?.statusKey || current.statusKey;
      current.statusLabel = row?.statusLabel || current.statusLabel;
      current.dueDate = row?.dueDate || current.dueDate;
      current.endDate = row?.endDate || current.endDate;
      current.actualStatus = row?.actualStatus || current.actualStatus;
      current.checkId = row?.checkId || current.checkId;
      current.actualId = row?.actualId || current.actualId;
      current.periodik = row?.periodik || current.periodik;
    }
  });

  return Array.from(categoryMap.values()).map(({ statusPriority, ...item }) => {
    const completedCount = Number(item.completedCount || 0);
    const planCount = Number(item.planCount || 0);
    const incompleteCount = Math.max(planCount - completedCount, 0);
    const firstPendingCheck = Array.isArray(item.pendingChecks) ? item.pendingChecks[0] : null;

    if (planCount > 0 && incompleteCount === 0) {
      return {
        ...item,
        statusKey: "completed",
        statusLabel: "Completed",
        actualStatus: "ACTUAL",
        incompleteCount,
        pendingChecks: [],
      };
    }

    return {
      ...item,
      incompleteCount,
      checkId: firstPendingCheck?.checkId || item.checkId,
      actualId: firstPendingCheck?.actualId || item.actualId,
    };
  });
}

function normalizeMaintenanceMonthlyStatus({ actualStatus, targetDate, today = new Date() }) {
  const normalizedActualStatus = normalizeText(actualStatus);
  if (normalizedActualStatus === "actual") return "completed";

  const todayStart = startOfDay(today);
  const targetStart = startOfDay(targetDate);

  if (targetStart.getTime() < todayStart.getTime()) return "overdue";
  if (targetStart.getTime() === todayStart.getTime()) return "due";
  return "upcoming";
}

async function buildMaintenanceMonthlyStatusSummary({ month, year, today = new Date() }) {
  const emptySummary = { upcoming: 0, due: 0, completed: 0, overdue: 0 };
  const yearlyStandard = await YearlyStandardMaintenance.findOne({
    where: { tahun: Number(year) },
    attributes: ["id", "tahun"],
  });

  if (!yearlyStandard) {
    return { summary: { ...emptySummary }, rows: [] };
  }

  const standards = await StandardMaintenance.findAll({
    where: { yearly_standard_id: yearlyStandard.id },
    attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
    include: [
      {
        model: StandardMaintenanceDetail,
        as: "details",
        attributes: ["id", "fungsi", "deskripsi"],
        include: [
          {
            model: StandardMaintenanceCheck,
            as: "pengecekanList",
            attributes: ["id", "pengecekan", "standard", "periodik", "planned_dates"],
          },
        ],
      },
    ],
    order: [["id", "ASC"]],
  });

  const allChecks = [];
  standards.forEach((standard) => {
    (standard.details || []).forEach((detail) => {
      (detail.pengecekanList || []).forEach((check) => {
        allChecks.push({
          standard,
          detail,
          check,
        });
      });
    });
  });

  const monthKey = String(month).padStart(2, "0");
  const monthStart = `${year}-${monthKey}-01`;
  const monthEnd = endOfDay(new Date(year, month, 0)).toISOString().slice(0, 10);
  const allCheckIds = allChecks.map((entry) => entry.check.id);

  const existingActuals = allCheckIds.length
    ? await MaintenanceActual.findAll({
        where: {
          check_id: { [Op.in]: allCheckIds },
          tanggal: { [Op.between]: [monthStart, monthEnd] },
        },
        attributes: ["id", "check_id", "tanggal", "status", "legend"],
        raw: true,
      })
    : [];

  const actualByCheckAndDate = new Map();
  existingActuals.forEach((actual) => {
    const actualDateKey = formatActualDateKey(actual.tanggal);
    if (!actualDateKey) return;
    actualByCheckAndDate.set(`${actual.check_id}__${actualDateKey}`, actual);
  });

  const monthlyPlanRows = [];
  const plannedDatesCache = new Map();

  for (const entry of allChecks) {
    const categoryGroup = resolveMaintenanceCategoryGroupFromStandard(entry.standard);
    const periodik = entry.check?.periodik;
    if (!periodik || !categoryGroup) continue;

    const plannedDatesCacheKey = entry.check?.id
      ? `check-${entry.check.id}`
      : `periodik-${year}-${String(periodik || "").trim().toUpperCase()}`;
    let allDates = plannedDatesCache.get(plannedDatesCacheKey);

    if (!allDates) {
      allDates = await resolveDashboardPlannedDates(Number(year), entry.check, periodik);
      plannedDatesCache.set(plannedDatesCacheKey, allDates);
    }

    const monthDates = allDates.filter((date) => date.startsWith(`${year}-${monthKey}`));
    if (!monthDates.length) continue;

    for (const date of monthDates) {
      const actual = actualByCheckAndDate.get(`${entry.check.id}__${date}`) || null;
      const statusKey = normalizeMaintenanceMonthlyStatus({
        actualStatus: actual?.status,
        targetDate: date,
        today,
      });

      monthlyPlanRows.push({
        key: actual?.id || `${categoryGroup.key}-${entry.check.id}-${date}`,
        asset: entry.standard?.namaPerangkat || entry.standard?.subPerangkat || entry.standard?.subKategori || "-",
        categoryGroup: categoryGroup.key,
        categoryLabel: categoryGroup.label,
        sourceCategory: entry.standard?.kategori || "-",
        sourceSubCategory: entry.standard?.subKategori || "-",
        pengecekan: entry.check?.pengecekan || "-",
        periodik,
        dueDate: date,
        endDate: date,
        statusKey,
        statusLabel:
          SCHEDULE_MONITORING_STATUSES.find((item) => item.key === statusKey)?.label || statusKey,
        actualStatus: actual?.status || "PLAN",
        checkId: entry.check.id,
        actualId: actual?.id || null,
      });
    }
  }

  const rows = buildMaintenanceStatusEntriesBySourceCategory(monthlyPlanRows);
  const summary = rows.reduce(
    (acc, row) => {
      const statusKey = row?.statusKey || "upcoming";
      acc[statusKey] += 1;
      return acc;
    },
    { ...emptySummary }
  );

  return { summary, rows };
}

function buildMaintenanceAbnormalCategorySummary(abnormalLogs = []) {
  const aggregatedEntries = buildMaintenanceAbnormalEntriesBySourceCategory(abnormalLogs);
  const summaryMap = new Map(
    MAINTENANCE_CATEGORY_GROUPS.map((group) => [
      group.key,
      {
        key: group.key,
        category: group.label,
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
      },
    ])
  );

  aggregatedEntries.forEach((entry) => {
    const bucket = summaryMap.get(entry.groupKey);
    const status = entry.status;

    bucket.total += 1;
    if (status === "open") {
      bucket.open += 1;
    } else if (status === "resolved") {
      bucket.resolved += 1;
    } else {
      bucket.inProgress += 1;
    }
  });

  return Array.from(summaryMap.values());
}

function resolveAbnormalSourceCategory(abnormalLog = {}) {
  const standardMaintenance =
    abnormalLog?.actual?.check?.standard_maintenance_detail?.standard_maintenance ||
    abnormalLog?.actual?.schedule?.StandardMaintenance ||
    null;

  return (
    String(standardMaintenance?.kategori || "").trim() ||
    String(standardMaintenance?.subKategori || "").trim() ||
    String(standardMaintenance?.namaPerangkat || "").trim() ||
    String(standardMaintenance?.subPerangkat || "").trim() ||
    "-"
  );
}

function resolveAbnormalCategoryPriority(status = "") {
  const normalizedStatus = normalizeText(status);
  if (normalizedStatus === "open") return 3;
  if (normalizedStatus === "resolved") return 1;
  return 2;
}

function buildMaintenanceAbnormalEntriesBySourceCategory(abnormalLogs = []) {
  const categoryMap = new Map();

  (Array.isArray(abnormalLogs) ? abnormalLogs : []).forEach((abnormalLog, index) => {
    const group = resolveAbnormalCategoryGroup(abnormalLog);
    const sourceCategory = resolveAbnormalSourceCategory(abnormalLog);
    const normalizedCategory = normalizeText(sourceCategory) || `uncategorized-${index + 1}`;
    const uniqueKey = `${group.key}__${normalizedCategory}`;
    const nextStatus = normalizeText(abnormalLog?.status_temuan) || "in-progress";
    const nextPriority = resolveAbnormalCategoryPriority(nextStatus);
    const current = categoryMap.get(uniqueKey);

    if (!current || nextPriority > current.priority) {
      categoryMap.set(uniqueKey, {
        key: uniqueKey,
        groupKey: group.key,
        sourceCategory,
        status: nextStatus,
        priority: nextPriority,
      });
    }
  });

  return Array.from(categoryMap.values());
}

function buildAssetCategorySummary(assetRows = [], totalAsset = 0) {
  const categoryMap = new Map();

  assetRows.forEach((assetRow, index) => {
    const categoryLabel = resolveAssetSummaryCategory(assetRow) || `Category ${index + 1}`;
    const current = categoryMap.get(categoryLabel) || {
      key: normalizeText(categoryLabel).replace(/\s+/g, "-") || `category-${index + 1}`,
      category: categoryLabel,
      count: 0,
    };

    current.count += 1;
    categoryMap.set(categoryLabel, current);
  });

  return Array.from(categoryMap.values())
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
    .map((item) => ({
      ...item,
      percent: totalAsset > 0 ? Number(((item.count / totalAsset) * 100).toFixed(1)) : 0,
    }));
}

function buildHardwareScopeSummary(assetRows = [], totalAsset = 0) {
  const scopeMap = new Map([
    ["client", { key: "client", label: "Client", total: 0, categories: [] }],
    ["utama", { key: "utama", label: "Utama", total: 0, categories: [] }],
  ]);
  const categoryMaps = new Map([
    ["client", new Map()],
    ["utama", new Map()],
  ]);

  assetRows.forEach((assetRow, index) => {
    if (isSoftwareAssetSummaryRow(assetRow)) return;

    const scopeKey = resolveHardwareAssetScope(assetRow);
    if (!scopeKey || !scopeMap.has(scopeKey)) return;

    const scopeEntry = scopeMap.get(scopeKey);
    const categoryLabel = resolveAssetSummaryCategory(assetRow) || `Category ${index + 1}`;
    const categoryMap = categoryMaps.get(scopeKey);
    const currentCategory = categoryMap.get(categoryLabel) || {
      key: normalizeText(categoryLabel).replace(/\s+/g, "-") || `category-${index + 1}`,
      category: categoryLabel,
      count: 0,
    };

    currentCategory.count += 1;
    scopeEntry.total += 1;
    categoryMap.set(categoryLabel, currentCategory);
  });

  return Object.fromEntries(
    Array.from(scopeMap.entries()).map(([scopeKey, scopeEntry]) => {
      const categories = Array.from(categoryMaps.get(scopeKey).values())
        .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
        .map((item) => ({
          ...item,
          percent: scopeEntry.total > 0 ? Number(((item.count / scopeEntry.total) * 100).toFixed(1)) : 0,
        }));

      return [
        scopeKey,
        {
          ...scopeEntry,
          percentOfTotal: totalAsset > 0 ? Number(((scopeEntry.total / totalAsset) * 100).toFixed(1)) : 0,
          categoryCount: categories.length,
          topCategories: categories.slice(0, 5),
          categories,
        },
      ];
    })
  );
}

const dummyAssetBudgets = [
  { key: 'dummy-ba-1', poDate: '2026-07-05', budgetCode: 'BA-2026-001', itemName: 'Laptop Replacement', initialBudget: currency(185000000), status: 'PO' },
  { key: 'dummy-ba-2', poDate: '2026-08-12', budgetCode: 'BA-2026-002', itemName: 'Network Switch Core', initialBudget: currency(125000000), status: 'PV' },
  { key: 'dummy-ba-3', poDate: '2026-09-18', budgetCode: 'BA-2026-003', itemName: 'Server Storage Expansion', initialBudget: currency(240000000), status: 'Plan' },
];

const dummyOperationalBudgets = [
  { key: 'dummy-op-1', budgetCode: 'OP-2026-001', itemName: 'Microsoft 365', status: 'Invoice', julPlan: 10000000, julActual: 10000000, augPlan: 10000000, augActual: 0, sepPlan: 10000000, sepActual: 0 },
  { key: 'dummy-op-2', budgetCode: 'OP-2026-002', itemName: 'AWS Hosting', status: 'PO', julPlan: 5000000, julActual: 4900000, augPlan: 5000000, augActual: 0, sepPlan: 5000000, sepActual: 0 },
  { key: 'dummy-op-3', budgetCode: 'OP-2026-003', itemName: 'Internet ISP', status: 'Plan', julPlan: 3000000, julActual: 0, augPlan: 3000000, augActual: 0, sepPlan: 3000000, sepActual: 0 },
];

const dummyMaintenanceLogs = [
  { key: 'dummy-log-1', date: 'Monday, Jul 6', code: 'Server Room Cooling', personnel: 'System Demo' },
  { key: 'dummy-log-2', date: 'Tuesday, Jul 14', code: 'Core Switch Inspection', personnel: 'System Demo' },
  { key: 'dummy-log-3', date: 'Friday, Jul 24', code: 'Backup Storage Check', personnel: 'System Demo' },
];

const dummyAssetValueByCategory = [
  { key: 'dummy-value-1', category: 'Laptop / PC', acquisitionValue: currency(1250000000), bookValue: currency(780000000) },
  { key: 'dummy-value-2', category: 'Server', acquisitionValue: currency(980000000), bookValue: currency(620000000) },
  { key: 'dummy-value-3', category: 'Network Devices', acquisitionValue: currency(760000000), bookValue: currency(490000000) },
];

const monthLabels = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const getBudgetStatus = (budget) => {
  if (budget.payment_date_1 || budget.payment_date_2 || budget.payment_date_3) return 'Closed';
  if (budget.po_date) return 'PO';
  if (budget.review) return 'PV';
  return 'Plan';
};

function buildBudgetProgressSummary(budgetRows = [], options = {}) {
  const {
    pendingLimit = 10,
    includeOperationalPlaceholder = false,
  } = options;

  const normalizedRows = Array.isArray(budgetRows) ? budgetRows : [];
  const rowsWithStatus = normalizedRows.map((item) => ({
    ...item,
    summaryStatus: getBudgetStatus(item),
  }));

  const completedRows = rowsWithStatus.filter((item) => item.summaryStatus === "Closed");
  const progressRows = rowsWithStatus.filter((item) => ["PV", "PO"].includes(item.summaryStatus));
  const pendingRows = rowsWithStatus.filter((item) => item.summaryStatus === "Plan");

  const overview = [
    {
      key: "asset",
      category: "Asset Budget",
      total: rowsWithStatus.length,
      progress: progressRows.length,
      completed: completedRows.length,
    },
  ];

  if (includeOperationalPlaceholder) {
    overview.push({
      key: "operational",
      category: "Operational Budget",
      total: 0,
      progress: 0,
      completed: 0,
    });
  }

  return {
    total: rowsWithStatus.length,
    completed: completedRows.length,
    progress: progressRows.length,
    pending: pendingRows.length,
    pendingRows: pendingRows.slice(0, pendingLimit).map((item) => ({
      key: item.id,
      code: item.budget_code || "-",
      category: "Asset",
      item: item.item_name || item.subject || "-",
      status: item.summaryStatus,
    })),
    overview,
  };
}

const buildOperationalBudgets = (assetBudgets) => {
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() + index, 1);
    return {
      key: monthLabels[d.getMonth()],
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  });

  return assetBudgets.slice(0, 8).map((budget, index) => {
    const row = {
      key: budget.id || `op-${index}`,
      budgetCode: budget.budget_code || '-',
      itemName: budget.subject || budget.item_name || '-',
      status: getBudgetStatus(budget),
    };

    months.forEach((month) => {
      const planAmount = Number(budget.initial_plan || budget.budget || budget.price_pengajuan || 0);
      const actualAmount = [
        [budget.payment_date_1, budget.payment_amount_1],
        [budget.payment_date_2, budget.payment_amount_2],
        [budget.payment_date_3, budget.payment_amount_3],
      ].reduce((sum, [paymentDate, amount]) => compactMonthKey(paymentDate) === month.monthKey ? sum + Number(amount || 0) : sum, 0);

      row[`${month.key}Plan`] = planAmount;
      row[`${month.key}Actual`] = actualAmount;
    });

    return row;
  });
};

export const getDashboardSummary = async (req, res) => {
  try {
    const assetStatusSummary = await getUnifiedAssetStatusSummary();
    const totalAsset = assetStatusSummary.total;
    const activeAsset = assetStatusSummary.active;
    const nonActiveAsset = assetStatusSummary.nonActive;
    const damagedAsset = assetStatusSummary.damaged;
    const inServiceAsset = assetStatusSummary.inService;
    const assetSummaryRows = await Asset.findAll({
      attributes: ["asset_id", "asset_name", "hostname", "category_id"],
      include: [
        {
          model: AssetCategory,
          as: "category",
          required: false,
          attributes: ["category_id", "category_name", "parent_id"],
          include: [
            {
              model: AssetCategory,
              as: "parent",
              required: false,
              attributes: ["category_id", "category_name", "parent_id"],
              include: [
                {
                  model: AssetCategory,
                  as: "parent",
                  required: false,
                  attributes: ["category_id", "category_name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["asset_id", "ASC"]],
    });

    const assetBudgets = await AssetBudget.findAll({
      limit: 7,
      order: [['created_at', 'DESC']]
    });

    const allBudgetRows = await AssetBudget.findAll({
      limit: 50,
      order: [['created_at', 'DESC']],
      raw: true,
    });

    const categorySummary = buildAssetCategorySummary(assetSummaryRows, totalAsset);
    const hardwareBreakdown = buildHardwareScopeSummary(assetSummaryRows, totalAsset);

    const acquisitionValue = allBudgetRows.reduce((sum, item) => sum + Number(item.purchase_price || item.price_pengajuan || item.budget || item.initial_plan || 0), 0);
    const bookValue = allBudgetRows.reduce((sum, item) => sum + Number(item.budget || item.purchase_price || item.price_pengajuan || item.initial_plan || 0), 0);
    const depreciationValue = acquisitionValue > 0
      ? Math.max(acquisitionValue - bookValue, 0)
      : 0;

    const maintenanceLogs = await MaintenanceLogSheet.findAll({
      limit: 10,
      order: [['tanggal_temuan', 'DESC']],
      include: [
        {
          model: MaintenanceSchedule,
          as: 'schedule',
          include: [
            {
              model: StandardMaintenance,
              as: 'StandardMaintenance',
              attributes: ['namaPerangkat', 'subPerangkat'],
            },
            {
              model: Asset,
              as: 'asset',
              attributes: ['asset_name', 'asset_code', 'hostname']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['full_name']
        }
      ]
    });

    // Formatting maintenance logs for frontend
    const formattedLogs = maintenanceLogs.map(log => {
      const assetInfo = getScheduleDeviceLabel(log.schedule);
      return {
        key: log.id,
        date: new Date(log.tanggal_temuan).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        code: assetInfo,
        personnel: log.creator ? log.creator.full_name : 'System/Unknown'
      };
    });

    // Formatting asset budgets for frontend
    const formattedBudgets = assetBudgets.map(b => ({
      key: b.id,
      poDate: b.po_date || '-',
      budgetCode: b.budget_code || '-',
      itemName: b.item_name || '-',
      initialBudget: currency(b.initial_plan || b.budget || b.price_pengajuan),
      status: getBudgetStatus(b)
    }));

    const operationalBudgets = buildOperationalBudgets(allBudgetRows);
    const budgetProgressSummary = buildBudgetProgressSummary(allBudgetRows, { pendingLimit: 4 });
    const budgetRowsWithStatus = allBudgetRows.map((item) => ({
      ...item,
      dashboardStatus: getBudgetStatus(item),
      dashboardAmount: Number(item.initial_plan || item.budget || item.purchase_price || item.price_pengajuan || 0),
    }));
    const completedBudgetRows = budgetRowsWithStatus.filter((item) => item.dashboardStatus === "Closed");
    const progressBudgetRows = budgetRowsWithStatus.filter((item) => ["PV", "PO"].includes(item.dashboardStatus));
    const pendingBudgetSourceRows = budgetRowsWithStatus.filter((item) => item.dashboardStatus === "Plan");
    const completedBudgets = budgetProgressSummary.completed;
    const progressBudgets = budgetProgressSummary.progress;
    const pendingBudgets = budgetProgressSummary.pending;
    const pendingBudgetRows = budgetProgressSummary.pendingRows.map((item) => ({
      key: item.key,
      code: item.code,
      itemName: item.item,
      status: item.status,
    }));
    const totalBudgetValue = budgetRowsWithStatus.reduce((sum, item) => sum + item.dashboardAmount, 0);
    const completedBudgetValue = completedBudgetRows.reduce((sum, item) => sum + item.dashboardAmount, 0);
    const progressBudgetValue = progressBudgetRows.reduce((sum, item) => sum + item.dashboardAmount, 0);
    const pendingBudgetValue = pendingBudgetSourceRows.reduce((sum, item) => sum + item.dashboardAmount, 0);
    const completionRate = allBudgetRows.length > 0 ? Number(((completedBudgets / allBudgetRows.length) * 100).toFixed(1)) : 0;
    const progressRate = allBudgetRows.length > 0 ? Number(((progressBudgets / allBudgetRows.length) * 100).toFixed(1)) : 0;
    const statusBreakdown = [
      { key: "closed", label: "Completed", count: completedBudgets, percent: completionRate },
      { key: "progress", label: "On Progress", count: progressBudgets, percent: progressRate },
      {
        key: "pending",
        label: "Pending",
        count: pendingBudgets,
        percent: allBudgetRows.length > 0 ? Number(((pendingBudgets / allBudgetRows.length) * 100).toFixed(1)) : 0,
      },
    ];

    const today = new Date();
    const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
    const next30 = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));
    const maintenanceActualRows = await MaintenanceActual.findAll({
      where: {
        tanggal: {
          [Op.between]: [
            monthStart.toISOString().slice(0, 10),
            next30.toISOString().slice(0, 10),
          ],
        },
      },
      order: [["tanggal", "ASC"]],
      include: [
        {
          model: MaintenanceSchedule,
          as: "schedule",
          required: false,
          attributes: ["id", "asset_id", "periodik", "periodik_type"],
          include: [
            {
              model: Asset,
              as: "asset",
              required: false,
              attributes: ["asset_id", "asset_name", "asset_code", "hostname", "category_id"],
              include: [
                {
                  model: AssetCategory,
                  as: "category",
                  required: false,
                  attributes: ["category_id", "category_name", "parent_id"],
                  include: [
                    {
                      model: AssetCategory,
                      as: "parent",
                      required: false,
                      attributes: ["category_id", "category_name"],
                    },
                  ],
                },
              ],
            },
            {
              model: StandardMaintenance,
              as: "StandardMaintenance",
              required: false,
              attributes: ["namaPerangkat", "subPerangkat", "kategori", "subKategori"],
            },
          ],
        },
        {
          model: StandardMaintenanceCheck,
          as: "check",
          required: false,
          attributes: ["id", "pengecekan", "standard", "periodik"],
          include: [
            {
              model: StandardMaintenanceDetail,
              as: "standard_maintenance_detail",
              required: false,
              attributes: ["id", "fungsi", "deskripsi"],
              include: [
                {
                  model: StandardMaintenance,
                  as: "standard_maintenance",
                  required: false,
                  attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
                },
              ],
            },
          ],
        },
      ],
    });
    const maintenanceScheduleSummary = buildMaintenanceActualSummary(maintenanceActualRows, today);

    // Maintenance Actuals
    const totalActuals = await MaintenanceActual.count();
    const doneActuals = await MaintenanceActual.count({ where: { status: 'ACTUAL' } });
    const pendingActuals = await MaintenanceActual.count({ where: { status: 'PLAN' } });

    const recentActuals = await MaintenanceActual.findAll({
      limit: 10,
      order: [['tanggal', 'DESC']],
      include: [
        {
          model: MaintenanceSchedule,
          as: 'schedule',
          include: [
            {
              model: StandardMaintenance,
              as: 'StandardMaintenance',
              attributes: ['namaPerangkat', 'subPerangkat'],
            },
            { model: Asset, as: 'asset', attributes: ['asset_name', 'asset_code', 'hostname'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['full_name'] },
      ],
    });

    const formattedActuals = recentActuals.map(a => ({
      key: a.id,
      tanggal: a.tanggal,
      status: a.status,
      legend: a.legend,
      asset: getScheduleDeviceLabel(a.schedule),
      personnel: a.creator?.full_name || '-',
    }));

    // Maintenance Abnormal Logs
    const allAbnormalCategories = await MaintenanceAbnormalLog.findAll({
      attributes: ["id", "status_temuan"],
      include: [
        {
          model: MaintenanceActual,
          as: "actual",
          attributes: ["id"],
          include: [
            {
              model: MaintenanceSchedule,
              as: "schedule",
              attributes: ["id"],
              include: [
                {
                  model: StandardMaintenance,
                  as: "StandardMaintenance",
                  required: false,
                  attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
                },
                {
                  model: Asset,
                  as: "asset",
                  attributes: ["asset_id", "asset_name", "hostname", "category_id"],
                  include: [
                    {
                      model: AssetCategory,
                      as: "category",
                      required: false,
                      attributes: ["category_id", "category_name", "parent_id"],
                      include: [
                        {
                          model: AssetCategory,
                          as: "parent",
                          required: false,
                          attributes: ["category_id", "category_name"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: StandardMaintenanceCheck,
              as: "check",
              required: false,
              attributes: ["id"],
              include: [
                {
                  model: StandardMaintenanceDetail,
                  as: "standard_maintenance_detail",
                  required: false,
                  attributes: ["id"],
                  include: [
                    {
                      model: StandardMaintenance,
                      as: "standard_maintenance",
                      required: false,
                      attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const abnormalCategoryEntries = buildMaintenanceAbnormalEntriesBySourceCategory(allAbnormalCategories);
    const totalAbnormals = abnormalCategoryEntries.length;
    const openAbnormals = abnormalCategoryEntries.filter((entry) => entry.status === "open").length;
    const resolvedAbnormals = abnormalCategoryEntries.filter((entry) => entry.status === "resolved").length;
    const inProgressAbnormals = Math.max(totalAbnormals - openAbnormals - resolvedAbnormals, 0);

    const recentAbnormals = await MaintenanceAbnormalLog.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: MaintenanceActual,
          as: 'actual',
          include: [
            {
              model: MaintenanceSchedule,
              as: 'schedule',
              include: [
                {
                  model: StandardMaintenance,
                  as: 'StandardMaintenance',
                  attributes: ['id', 'kategori', 'subKategori', 'namaPerangkat', 'tipePerangkat', 'subPerangkat'],
                },
                {
                  model: Asset,
                  as: 'asset',
                  attributes: ['asset_id', 'asset_name', 'asset_code', 'hostname', 'category_id'],
                  include: [
                    {
                      model: AssetCategory,
                      as: 'category',
                      required: false,
                      attributes: ['category_id', 'category_name', 'parent_id'],
                      include: [
                        {
                          model: AssetCategory,
                          as: 'parent',
                          required: false,
                          attributes: ['category_id', 'category_name'],
                        },
                      ],
                    },
                  ],
                }
              ]
            },
            {
              model: StandardMaintenanceCheck,
              as: 'check',
              required: false,
              attributes: ["id", "pengecekan", "standard", "periodik", "planned_dates"],
              include: [
                {
                  model: StandardMaintenanceDetail,
                  as: 'standard_maintenance_detail',
                  required: false,
                  include: [
                    {
                      model: StandardMaintenance,
                      as: 'standard_maintenance',
                      required: false,
                      attributes: ['id', 'kategori', 'subKategori', 'namaPerangkat', 'tipePerangkat', 'subPerangkat'],
                    }
                  ]
                }
              ]
            }
          ],
        },
        { model: User, as: 'resolver', attributes: ['full_name'] },
      ],
    });

    const formattedAbnormals = recentAbnormals.map((a) => {
      const categoryGroup = resolveAbnormalCategoryGroup(a);
      const standardMaintenance =
        a?.actual?.check?.standard_maintenance_detail?.standard_maintenance ||
        a?.actual?.schedule?.StandardMaintenance ||
        null;
      return {
        key: a.id,
        deskripsi: a.deskripsi_kerusakan || '-',
        tindakan: a.tindakan || '-',
        status: a.status_temuan,
        asset: getActualDeviceLabel(a.actual),
        categoryGroup: categoryGroup.key,
        categoryLabel: categoryGroup.label,
        sourceCategory: standardMaintenance?.kategori || '-',
        sourceSubCategory: standardMaintenance?.subKategori || '-',
        resolvedBy: a.resolver?.full_name || '-',
        resolvedAt: a.resolved_at ? new Date(a.resolved_at).toLocaleDateString() : '-',
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        assetSummary: {
          total: totalAsset || 0,
          active: activeAsset || 0,
          nonActive: nonActiveAsset || 0,
          damaged: damagedAsset || 0,
          inService: inServiceAsset || 0,
          acquisitionValue,
          depreciationValue,
          bookValue,
          topCategories: categorySummary.slice(0, 4),
          hardwareBreakdown,
        },
        budgetSummary: {
          total: allBudgetRows.length,
          progress: progressBudgets,
          completed: completedBudgets,
          pending: pendingBudgets,
          completionRate,
          progressRate,
          totalValue: totalBudgetValue,
          completedValue: completedBudgetValue,
          progressValue: progressBudgetValue,
          pendingValue: pendingBudgetValue,
          statusBreakdown,
          pendingRows: pendingBudgetRows,
          auditKmcSections: buildAuditKmcSections(allBudgetRows),
        },
        assetBudgets: formattedBudgets.length ? formattedBudgets : dummyAssetBudgets,
        maintenanceLogs: formattedLogs.length ? formattedLogs : dummyMaintenanceLogs,
        operationalBudgets: operationalBudgets.length ? operationalBudgets : dummyOperationalBudgets,
        maintenanceActuals: {
          total: totalActuals,
          done: doneActuals,
          pending: pendingActuals,
          rows: formattedActuals,
        },
        maintenanceSchedules: {
          summary: maintenanceScheduleSummary.summary,
          rows: maintenanceScheduleSummary.rows,
        },
        maintenanceAbnormals: {
          total: totalAbnormals,
          open: openAbnormals,
          inProgress: inProgressAbnormals,
          resolved: resolvedAbnormals,
          byCategory: buildMaintenanceAbnormalCategorySummary(allAbnormalCategories),
          rows: formattedAbnormals,
        },
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getFullSummary = async (req, res) => {
  try {
    const { month, year, monthStart, monthEnd } = resolveSummaryMonthFilter(req.query);

    // 1. Asset Summary
    const assetStatusSummary = await getUnifiedAssetStatusSummary();
    const totalAsset = assetStatusSummary.total;
    const activeAsset = assetStatusSummary.active;
    const damagedAsset = assetStatusSummary.damaged;
    const inServiceAsset = assetStatusSummary.inService;
    const assetSummaryRows = await Asset.findAll({
      attributes: ["asset_id", "asset_name", "hostname", "category_id"],
      include: [
        {
          model: AssetCategory,
          as: "category",
          required: false,
          attributes: ["category_id", "category_name", "parent_id"],
          include: [
            {
              model: AssetCategory,
              as: "parent",
              required: false,
              attributes: ["category_id", "category_name", "parent_id"],
              include: [
                {
                  model: AssetCategory,
                  as: "parent",
                  required: false,
                  attributes: ["category_id", "category_name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["asset_id", "ASC"]],
    });
    const categorySummary = buildAssetCategorySummary(assetSummaryRows, totalAsset);
    const hardwareBreakdown = buildHardwareScopeSummary(assetSummaryRows, totalAsset);

    // 2. Budget Summary
    const budgetRows = await AssetBudget.findAll({ raw: true, order: [['created_at', 'DESC']] });
    const auditKmcSections = buildAuditKmcSections(budgetRows);
    const budgetProgressSummary = buildBudgetProgressSummary(budgetRows, {
      pendingLimit: 10,
      includeOperationalPlaceholder: true,
    });

    const acquisitionValue = budgetRows.reduce((sum, item) => sum + Number(item.purchase_price || item.price_pengajuan || item.budget || item.initial_plan || 0), 0);
    const bookValue = budgetRows.reduce((sum, item) => sum + Number(item.budget || item.purchase_price || item.price_pengajuan || item.initial_plan || 0), 0);

    // 3. Maintenance Summary
    const totalLogsheets = await MaintenanceLogSheet.count({
      where: {
        tanggal_temuan: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
    });
    const approvedLogsheets = await MaintenanceLogSheet.count({
      where: {
        status_temuan: 'RESOLVED',
        tanggal_temuan: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
    });
    const pendingLogsheets = totalLogsheets - approvedLogsheets;

    const totalActuals = await MaintenanceActual.count({
      where: {
        tanggal: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
    });
    const doneActuals = await MaintenanceActual.count({
      where: {
        status: 'ACTUAL',
        tanggal: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
    });
    const pendingActuals = await MaintenanceActual.count({
      where: {
        status: 'PLAN',
        tanggal: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
    });
    const today = new Date();
    const maintenanceStatusSummary = await buildMaintenanceMonthlyStatusSummary({
      month,
      year,
      today,
    });

    const allAbnormalCategories = await MaintenanceAbnormalLog.findAll({
      attributes: ["id", "status_temuan"],
      include: [
        {
          model: MaintenanceActual,
          as: "actual",
          required: true,
          attributes: ["id", "tanggal"],
          where: {
            tanggal: {
              [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
            },
          },
          include: [
            {
              model: MaintenanceSchedule,
              as: "schedule",
              attributes: ["id"],
              include: [
                {
                  model: StandardMaintenance,
                  as: "StandardMaintenance",
                  required: false,
                  attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
                },
                {
                  model: Asset,
                  as: "asset",
                  attributes: ["asset_id", "asset_name", "hostname", "category_id"],
                  include: [
                    {
                      model: AssetCategory,
                      as: "category",
                      required: false,
                      attributes: ["category_id", "category_name", "parent_id"],
                      include: [
                        {
                          model: AssetCategory,
                          as: "parent",
                          required: false,
                          attributes: ["category_id", "category_name"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: StandardMaintenanceCheck,
              as: "check",
              required: false,
              attributes: ["id"],
              include: [
                {
                  model: StandardMaintenanceDetail,
                  as: "standard_maintenance_detail",
                  required: false,
                  attributes: ["id"],
                  include: [
                    {
                      model: StandardMaintenance,
                      as: "standard_maintenance",
                      required: false,
                      attributes: ["id", "kategori", "subKategori", "namaPerangkat", "tipePerangkat", "subPerangkat"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const abnormalCategoryEntries = buildMaintenanceAbnormalEntriesBySourceCategory(allAbnormalCategories);
    const totalAbnormals = abnormalCategoryEntries.length;
    const openAbnormals = abnormalCategoryEntries.filter((entry) => entry.status === "open").length;
    const resolvedAbnormals = abnormalCategoryEntries.filter((entry) => entry.status === "resolved").length;
    const inProgressAbnormals = Math.max(totalAbnormals - openAbnormals - resolvedAbnormals, 0);

    // Latest Logsheets for table
    const latestLogs = await MaintenanceLogSheet.findAll({
      limit: 5,
      order: [['tanggal_temuan', 'DESC']],
      where: {
        tanggal_temuan: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
      include: [
        {
          model: MaintenanceSchedule,
          as: 'schedule',
          include: [
            {
              model: StandardMaintenance,
              as: 'StandardMaintenance',
              attributes: ['namaPerangkat', 'subPerangkat'],
            },
            { model: Asset, as: 'asset', attributes: ['asset_name', 'hostname'] }
          ]
        }
      ]
    });

    // Latest Actuals for table
    const latestActuals = await MaintenanceActual.findAll({
      limit: 5,
      order: [['tanggal', 'DESC']],
      where: {
        tanggal: {
          [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
        },
      },
      include: [
        {
          model: MaintenanceSchedule,
          as: 'schedule',
          include: [
            {
              model: StandardMaintenance,
              as: 'StandardMaintenance',
              attributes: ['namaPerangkat', 'subPerangkat'],
            },
            { model: Asset, as: 'asset', attributes: ['asset_name', 'hostname'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['full_name'] },
      ],
    });

    // Latest Abnormals for table
    const latestAbnormals = await MaintenanceAbnormalLog.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: MaintenanceActual,
          as: 'actual',
          required: true,
          where: {
            tanggal: {
              [Op.between]: [monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)],
            },
          },
          include: [
            {
              model: MaintenanceSchedule,
              as: 'schedule',
              include: [
                {
                  model: StandardMaintenance,
                  as: 'StandardMaintenance',
                  attributes: ['id', 'kategori', 'subKategori', 'namaPerangkat', 'tipePerangkat', 'subPerangkat'],
                },
                {
                  model: Asset,
                  as: 'asset',
                  attributes: ['asset_id', 'asset_name', 'hostname', 'category_id'],
                  include: [
                    {
                      model: AssetCategory,
                      as: 'category',
                      required: false,
                      attributes: ['category_id', 'category_name', 'parent_id'],
                      include: [
                        {
                          model: AssetCategory,
                          as: 'parent',
                          required: false,
                          attributes: ['category_id', 'category_name'],
                        },
                      ],
                    },
                  ],
                }
              ]
            },
            {
              model: StandardMaintenanceCheck,
              as: 'check',
              required: false,
              attributes: ["id", "pengecekan", "standard", "periodik", "planned_dates"],
              include: [
                {
                  model: StandardMaintenanceDetail,
                  as: 'standard_maintenance_detail',
                  required: false,
                  include: [
                    {
                      model: StandardMaintenance,
                      as: 'standard_maintenance',
                      required: false,
                      attributes: ['id', 'kategori', 'subKategori', 'namaPerangkat', 'tipePerangkat', 'subPerangkat'],
                    }
                  ]
                }
              ]
            }
          ],
        },
        { model: User, as: 'resolver', attributes: ['full_name'] },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        asset: {
          total: totalAsset || 452,
          active: activeAsset || 421,
          damaged: damagedAsset || 18,
          inService: inServiceAsset || 13,
          categories: categorySummary.length ? categorySummary.map((item) => ({
            ...item,
            percent: `${Number(item.percent || 0).toFixed(1)}%`,
          })) : [
            { key: 'dummy-cat-1', category: 'Laptop / PC', count: 210, percent: '46.4%' },
            { key: 'dummy-cat-2', category: 'Server', count: 32, percent: '7.1%' },
            { key: 'dummy-cat-3', category: 'Network Devices', count: 48, percent: '10.6%' },
          ],
          hardwareBreakdown,
          value: {
            acquisition: acquisitionValue || 4520000000,
            depreciation: acquisitionValue ? Math.round(acquisitionValue * 0.42) : 1890000000,
            book: bookValue || 2630000000,
            byCategory: categorySummary.length ? categorySummary.slice(0, 5).map((item) => ({
              key: item.key,
              category: item.category,
              acquisitionValue: currency(Math.round((acquisitionValue || 4520000000) * ((Number(item.percent) || 0) / 100 || 0.2))),
              bookValue: currency(Math.round((bookValue || 2630000000) * ((Number(item.percent) || 0) / 100 || 0.2))),
            })) : dummyAssetValueByCategory
          }
        },
        budget: {
          total: budgetProgressSummary.total,
          completed: budgetProgressSummary.completed,
          progress: budgetProgressSummary.progress,
          pending: budgetProgressSummary.pending,
          auditKmcSections,
          pendingRows: budgetProgressSummary.pendingRows.length ? budgetProgressSummary.pendingRows : [
            { key: 'dummy-pending-1', code: 'BA-2026-014', category: 'Asset', item: 'Laptop Manager', status: 'Waiting Approval' },
            { key: 'dummy-pending-2', code: 'BA-2026-018', category: 'Asset', item: 'Switch Core', status: 'Waiting PO' },
          ],
          overview: budgetProgressSummary.overview,
        },
        maintenance: {
          filter: {
            month,
            year,
          },
          schedules: {
            summary: maintenanceStatusSummary.summary,
            byCategory: buildMaintenanceStatusCategorySummary(maintenanceStatusSummary.rows),
            rows: maintenanceStatusSummary.rows,
          },
          logsheets: {
            total: totalLogsheets || dummyMaintenanceLogs.length,
            approved: approvedLogsheets || 1,
            pending: pendingLogsheets || 2,
            latest: latestLogs.length ? latestLogs.map(l => ({
              key: l.id,
              logNo: `LOG-${l.id}`,
              asset: getScheduleDeviceLabel(l.schedule),
              date: new Date(l.tanggal_temuan).toLocaleDateString(),
              status: l.status_temuan === 'RESOLVED' ? 'Disetujui' : 'Menunggu Approval'
            })) : dummyMaintenanceLogs.map((item) => ({
              key: item.key,
              logNo: String(item.key).replace('dummy-', '').toUpperCase(),
              asset: item.code,
              date: item.date,
              status: 'Demo',
            }))
          },
          actuals: {
            total: totalActuals || 120,
            done: doneActuals || 101,
            pending: pendingActuals || 19,
            progressRows: [
              { key: 'daily', type: 'Daily Check', total: totalActuals || 120, done: doneActuals || 101, pending: pendingActuals || 19 },
              { key: 'weekly', type: 'Weekly Preventive', total: totalActuals ? Math.round(totalActuals * 0.4) : 48, done: doneActuals ? Math.round(doneActuals * 0.4) : 39, pending: pendingActuals ? Math.round(pendingActuals * 0.4) : 9 },
            ],
            latestRows: latestActuals.map(a => ({
              key: a.id,
              tanggal: a.tanggal,
              status: a.status,
              asset: getScheduleDeviceLabel(a.schedule),
              personnel: a.creator?.full_name || '-',
            })),
          },
          abnormals: {
            total: totalAbnormals || 0,
            open: openAbnormals || 0,
            inProgress: inProgressAbnormals || 0,
            resolved: resolvedAbnormals || 0,
            byCategory: buildMaintenanceAbnormalCategorySummary(allAbnormalCategories),
            latestRows: latestAbnormals.map((a) => {
              const categoryGroup = resolveAbnormalCategoryGroup(a);
              const standardMaintenance =
                a?.actual?.check?.standard_maintenance_detail?.standard_maintenance ||
                a?.actual?.schedule?.StandardMaintenance ||
                null;
              return {
                key: a.id,
                deskripsi: a.deskripsi_kerusakan || '-',
                tindakan: a.tindakan || '-',
                status: a.status_temuan,
                asset: getActualDeviceLabel(a.actual),
                categoryGroup: categoryGroup.key,
                categoryLabel: categoryGroup.label,
                sourceCategory: standardMaintenance?.kategori || '-',
                sourceSubCategory: standardMaintenance?.subKategori || '-',
                resolvedBy: a.resolver?.full_name || '-',
              };
            }),
          },
        }
      }
    });
  } catch (error) {
    console.error("Error fetching full summary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
