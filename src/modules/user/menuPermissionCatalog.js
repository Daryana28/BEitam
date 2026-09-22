export const MENU_PERMISSION_TREE = [
  { key: "dashboard", label: "Dashboard" },
  {
    key: "asm",
    label: "Asset Management",
    children: [
      {
        key: "assetHardware",
        label: "Hardware",
        children: [
          { key: "assetHardwareAll", label: "All" },
          { key: "assetHardwareDepreciation", label: "History Depresiasi" },
        ],
      },
      {
        key: "assetSoftwareHardware",
        label: "Software Hardware",
        children: [
          { key: "assetSoftwareHardwareAll", label: "All" },
          { key: "assetSoftwareHardwareRenewal", label: "History Renewal" },
        ],
      },
    ],
  },
  {
    key: "budget",
    label: "Budget",
    children: [
      {
        key: "budgetAsset",
        label: "Asset",
        children: [
          { key: "budgetAssetList", label: "Schedule" },
          { key: "budgetAssetSchedule", label: "Monitoring Progress" },
        ],
      },
      {
        key: "budgetRepairMaintenance",
        label: "Operational",
        children: [
          { key: "budgetOpList", label: "Schedule" },
          { key: "budgetOpSchedule", label: "Monitoring Progress" },
        ],
      },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    children: [
      {
        key: "maintenanceHardware",
        label: "Hardware",
        children: [
          { key: "mHardwareStandard", label: "Standard Maintenance" },
          { key: "mHardwareSchedule", label: "Schedule" },
          { key: "mHardwareLogSheet", label: "Logsheet" },
        ],
      },
      {
        key: "maintenanceSoftwareHardware",
        label: "Software Hardware",
        children: [
          { key: "mSoftwareHardwareStandard", label: "Standard Maintenance" },
          { key: "mSoftwareHardwareSchedule", label: "Schedule" },
          { key: "mSoftwareHardwareLogSheet", label: "Logsheet" },
        ],
      },
      {
        key: "maintenanceApplication",
        label: "Application",
        children: [
          { key: "mApplicationStandard", label: "Standard Maintenance" },
          { key: "mApplicationSchedule", label: "Schedule" },
          { key: "mApplicationLogSheet", label: "Logsheet" },
        ],
      },
      {
        key: "maintenanceNetworkCyber",
        label: "Network & Cybersecurity",
        children: [
          { key: "mNetworkCyberStandard", label: "Standard Maintenance" },
          { key: "mNetworkCyberSchedule", label: "Schedule" },
          { key: "mNetworkCyberLogSheet", label: "Logsheet" },
        ],
      },
    ],
  },
  { key: "databaseMonitoring", label: "Storage" },
  { key: "vulnerability", label: "Vulnerability" },
  { key: "phishingMonitoring", label: "Phishing" },
  { key: "summary", label: "Summary" },
  { key: "users", label: "User Management" },
];

export function flattenMenuPermissions(items = MENU_PERMISSION_TREE) {
  return items.flatMap((item) => [
    { key: item.key, label: item.label },
    ...flattenMenuPermissions(item.children || []),
  ]);
}
