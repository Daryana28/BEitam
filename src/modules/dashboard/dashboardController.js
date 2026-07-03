import { AssetBudget, MaintenanceActual, MaintenanceAbnormalLog, MaintenanceLogSheet, MaintenanceSchedule, StandardMaintenance, StandardMaintenanceCheck, StandardMaintenanceDetail, Asset, AssetCategory, User, sequelize } from "../../models/index.js";
import { Op } from "sequelize";

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

function getAssetCategoryChainNames(assetRow = {}) {
  const currentCategoryName = assetRow?.category?.category_name || "";
  const parentCategoryName = assetRow?.category?.parent?.category_name || "";
  return [currentCategoryName, parentCategoryName]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
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
    return normalized && normalized !== "hardware" && normalized !== "software hardware" && normalized !== "lainnya";
  });

  if (nonGenericName) {
    return String(nonGenericName).trim().toUpperCase();
  }

  return String(assetRow?.asset_name || "LAINNYA").trim().toUpperCase();
}

function resolveAssetSummaryCategory(assetRow = {}) {
  if (isSoftwareAssetSummaryRow(assetRow)) {
    return "Software";
  }

  const valuesToCheck = [
    assetRow?.asset_name,
    assetRow?.hostname,
    ...getAssetCategoryChainNames(assetRow),
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
              attributes: ["category_id", "category_name"],
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
    const totalAbnormals = await MaintenanceAbnormalLog.count();
    const openAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: 'OPEN' } });
    const inProgressAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: { [Op.notIn]: ['OPEN', 'RESOLVED'] } } });
    const resolvedAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: 'RESOLVED' } });

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
                  attributes: ['namaPerangkat', 'subPerangkat'],
                },
                { model: Asset, as: 'asset', attributes: ['asset_name', 'asset_code', 'hostname'] }
              ]
            },
            {
              model: StandardMaintenanceCheck,
              as: 'check',
              required: false,
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
                      attributes: ['namaPerangkat', 'subPerangkat'],
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

    const formattedAbnormals = recentAbnormals.map(a => ({
      key: a.id,
      deskripsi: a.deskripsi_kerusakan || '-',
      tindakan: a.tindakan || '-',
      status: a.status_temuan,
      asset: getActualDeviceLabel(a.actual),
      resolvedBy: a.resolver?.full_name || '-',
      resolvedAt: a.resolved_at ? new Date(a.resolved_at).toLocaleDateString() : '-',
    }));

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
        maintenanceAbnormals: {
          total: totalAbnormals,
          open: openAbnormals,
          inProgress: inProgressAbnormals,
          resolved: resolvedAbnormals,
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
              attributes: ["category_id", "category_name"],
            },
          ],
        },
      ],
      order: [["asset_id", "ASC"]],
    });
    const categorySummary = buildAssetCategorySummary(assetSummaryRows, totalAsset);

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
    const totalLogsheets = await MaintenanceLogSheet.count();
    const approvedLogsheets = await MaintenanceLogSheet.count({ where: { status_temuan: 'RESOLVED' } });
    const pendingLogsheets = totalLogsheets - approvedLogsheets;

    const totalActuals = await MaintenanceActual.count();
    const doneActuals = await MaintenanceActual.count({ where: { status: 'ACTUAL' } });
    const pendingActuals = await MaintenanceActual.count({ where: { status: 'PLAN' } });

    const totalAbnormals = await MaintenanceAbnormalLog.count();
    const openAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: 'OPEN' } });
    const inProgressAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: { [Op.notIn]: ['OPEN', 'RESOLVED'] } } });
    const resolvedAbnormals = await MaintenanceAbnormalLog.count({ where: { status_temuan: 'RESOLVED' } });

    // Latest Logsheets for table
    const latestLogs = await MaintenanceLogSheet.findAll({
      limit: 5,
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
            { model: Asset, as: 'asset', attributes: ['asset_name', 'hostname'] }
          ]
        }
      ]
    });

    // Latest Actuals for table
    const latestActuals = await MaintenanceActual.findAll({
      limit: 5,
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
            {
              model: StandardMaintenanceCheck,
              as: 'check',
              required: false,
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
                      attributes: ['namaPerangkat', 'subPerangkat'],
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
            latestRows: latestAbnormals.map(a => ({
              key: a.id,
              deskripsi: a.deskripsi_kerusakan || '-',
              tindakan: a.tindakan || '-',
              status: a.status_temuan,
              asset: getActualDeviceLabel(a.actual),
              resolvedBy: a.resolver?.full_name || '-',
            })),
          },
        }
      }
    });
  } catch (error) {
    console.error("Error fetching full summary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
