import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Op } from "sequelize";

import db from "../../../models/index.js";

const { sequelize, Asset, PhishingMonitoringLog, User, Role, Department } = db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_NAME = "Peringatan Kena Phishing.png";
const CAMPAIGN_KEY = "phishing-warning";
const IMAGE_PATH = path.resolve(__dirname, "../../../../images", IMAGE_NAME);

let ensureTablePromise = null;

function normalizeIp(rawValue = "") {
 const ip = String(rawValue || "").split(",")[0].trim();

 if (!ip) return "";
 if (ip === "::1") return "127.0.0.1";
 if (ip.startsWith("::ffff:")) return ip.slice(7);

 return ip;
}

function isRootAdmin(req) {
 const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
 return roles.some((role) =>
  ["SUPERADMIN", "SUPERADMINISTRATOR"].includes(String(role).toUpperCase())
 );
}

function collectAccessMarkers(user = {}, rawRoles = []) {
 const roleValues = Array.isArray(rawRoles)
  ? rawRoles
  : [];

 const baseRoles = roleValues.map((role) => String(role).toUpperCase());
 const markers = [
  user?.username,
  user?.full_name,
  user?.email,
  user?.Department?.department_name,
 ]
  .filter(Boolean)
  .map((value) => String(value).toUpperCase());

 return { baseRoles, markers };
}

function resolveEffectiveRoles(user = {}, rawRoles = []) {
 const { baseRoles, markers } = collectAccessMarkers(user, rawRoles);
 const effectiveRoles = new Set(baseRoles);

 if (!effectiveRoles.has("MAINTENANCE_STAFF")) {
  return Array.from(effectiveRoles);
 }

 const hasCyberMarker = markers.some((value) =>
  /(CYBER|NETWORK|NETWORKING|NETWORL)/.test(value)
 );
 const hasAppMarker = markers.some((value) =>
  /(APP|APPLICATION)/.test(value)
 );
 const hasHardwareMarker = markers.some((value) =>
  /(HARDWARE|INFRA|DEVICE)/.test(value)
 );
 const hasSpecializedMarker =
  hasCyberMarker || hasAppMarker || hasHardwareMarker;

 if (hasCyberMarker) {
  effectiveRoles.add("MTCCYBER");
 }

 if (hasAppMarker) {
  effectiveRoles.add("MTCAPP");
 }

 if (hasHardwareMarker) {
  effectiveRoles.add("MTCHARDWARE");
 }

 if (!hasSpecializedMarker) {
  effectiveRoles.add("MTCHARDWARE");
  effectiveRoles.add("MTCAPP");
  effectiveRoles.add("MTCCYBER");
 }

 return Array.from(effectiveRoles);
}

async function canViewMonitoring(req) {
 if (!req.user?.id) {
  return false;
 }

 if (isRootAdmin(req)) {
  return true;
 }

 const user = await User.findByPk(req.user.id, {
  attributes: ["user_id", "username", "full_name", "email"],
  include: [
   { model: Role, as: "roles", attributes: ["role_name"], through: { attributes: [] } },
   { model: Department, attributes: ["department_name"] },
  ],
 });

 if (!user) {
  return false;
 }

 const roleNames = Array.isArray(user.roles)
  ? user.roles.map((role) => role?.role_name).filter(Boolean)
  : [];
 const effectiveRoles = resolveEffectiveRoles(user, roleNames);

 return effectiveRoles.includes("MTCCYBER");
}

async function ensureTable() {
 const query = `
IF NOT EXISTS (
 SELECT 1
 FROM sys.objects
 WHERE object_id = OBJECT_ID(N'[dbo].[phishing_monitoring_logs]')
  AND type = N'U'
)
BEGIN
 CREATE TABLE [dbo].[phishing_monitoring_logs] (
  [log_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [campaign_key] NVARCHAR(100) NOT NULL,
  [image_name] NVARCHAR(255) NOT NULL,
  [ip_address] NVARCHAR(64) NOT NULL,
  [user_agent] NVARCHAR(1000) NULL,
  [asset_id] UNIQUEIDENTIFIER NULL,
  [asset_code] NVARCHAR(50) NULL,
  [owner_name] NVARCHAR(200) NULL,
  [nik] NVARCHAR(30) NULL,
  [department] NVARCHAR(200) NULL,
  [division] NVARCHAR(200) NULL,
  [hostname] NVARCHAR(100) NULL,
  [match_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_phishing_monitoring_logs_match_status] DEFAULT N'UNMATCHED',
  [clicked_at] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_phishing_monitoring_logs_clicked_at] DEFAULT SYSDATETIMEOFFSET()
 );
 CREATE INDEX [IX_phishing_monitoring_logs_clicked_at] ON [dbo].[phishing_monitoring_logs] ([clicked_at] DESC);
 CREATE INDEX [IX_phishing_monitoring_logs_ip_address] ON [dbo].[phishing_monitoring_logs] ([ip_address]);
END
`;

 await sequelize.query(query);
}

async function ensureTableReady() {
 if (!ensureTablePromise) {
  ensureTablePromise = ensureTable().catch((error) => {
   ensureTablePromise = null;
   throw error;
  });
 }

 return ensureTablePromise;
}

async function ensureImageExists() {
 await fs.access(IMAGE_PATH);
 return IMAGE_PATH;
}

async function findAssetByIp(ipAddress) {
 if (!ipAddress) return null;

 return Asset.findOne({
  where: {
   [Op.or]: [
    { ip_main: ipAddress },
    { ip_backup: ipAddress },
   ],
  },
  attributes: [
   "asset_id",
   "asset_code",
   "owner_name",
   "nik",
   "department",
   "division",
   "hostname",
  ],
 });
}

async function recordClick(req) {
 await ensureTableReady();

 const ipAddress = normalizeIp(req.ip || req.headers["x-forwarded-for"]);
 const asset = await findAssetByIp(ipAddress);

 const payload = {
  campaign_key: CAMPAIGN_KEY,
  image_name: IMAGE_NAME,
  ip_address: ipAddress || "-",
  user_agent: req.headers["user-agent"] || null,
  asset_id: asset?.asset_id || null,
  asset_code: asset?.asset_code || null,
  owner_name: asset?.owner_name || null,
  nik: asset?.nik || null,
  department: asset?.department || null,
  division: asset?.division || null,
  hostname: asset?.hostname || null,
  match_status: asset ? "MATCHED" : "UNMATCHED",
  clicked_at: new Date(),
 };

 await PhishingMonitoringLog.create(payload);
}

async function getMonitoringData(query = {}) {
 await ensureTableReady();

 const page = Math.max(Number(query.page) || 1, 1);
 const pageSize = Math.max(Number(query.pageSize) || 10, 1);
 const offset = (page - 1) * pageSize;

 const where = {};

 if (query.search) {
  const keyword = `%${String(query.search).trim()}%`;
  where[Op.or] = [
   { ip_address: { [Op.like]: keyword } },
   { owner_name: { [Op.like]: keyword } },
   { nik: { [Op.like]: keyword } },
   { department: { [Op.like]: keyword } },
   { division: { [Op.like]: keyword } },
   { hostname: { [Op.like]: keyword } },
   { asset_code: { [Op.like]: keyword } },
  ];
 }

 if (query.match_status) {
  where.match_status = String(query.match_status).toUpperCase();
 }

 const result = await PhishingMonitoringLog.findAndCountAll({
  where,
  order: [["clicked_at", "DESC"], ["log_id", "DESC"]],
  limit: pageSize,
  offset,
 });

 const total = result.count;
 const rows = result.rows.map((row) => row.toJSON());

 const [detectedClicks, matchedAssets, unmatchedIps, trackedLinks] = await Promise.all([
  PhishingMonitoringLog.count(),
  PhishingMonitoringLog.count({ where: { match_status: "MATCHED" } }),
  PhishingMonitoringLog.count({ where: { match_status: "UNMATCHED" } }),
  PhishingMonitoringLog.count({
   distinct: true,
   col: "campaign_key",
  }),
 ]);

 return {
  rows,
  meta: {
   total,
   page,
   pageSize,
   totalPages: Math.ceil(total / pageSize),
  },
  summary: {
   trackedLinks,
   detectedClicks,
   matchedAssets,
   unmatchedIps,
  },
 };
}

function buildTrackingUrl(req) {
 return `${req.protocol}://${req.get("host")}/api/phishing-monitoring/view/${CAMPAIGN_KEY}`;
}

export default {
 isRootAdmin,
 canViewMonitoring,
 ensureImageExists,
 recordClick,
 getMonitoringData,
 buildTrackingUrl,
 IMAGE_NAME,
 IMAGE_PATH,
 CAMPAIGN_KEY,
};
