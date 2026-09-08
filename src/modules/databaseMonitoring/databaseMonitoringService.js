import { QueryTypes } from "sequelize";

import { sequelize } from "../../models/index.js";

const DEFAULT_HISTORY_DAYS = 30;
const MAX_HISTORY_DAYS = 365;
const SYSTEM_DATABASE_NAMES = ["master", "model", "msdb", "tempdb"];

let ensureTablePromise = null;

function normalizeBoolean(value) {
 return ["1", "true", "yes", "y"].includes(String(value || "").toLowerCase());
}

function normalizeDays(value) {
 const days = Number(value || DEFAULT_HISTORY_DAYS);

 if (!Number.isFinite(days)) return DEFAULT_HISTORY_DAYS;

 return Math.min(Math.max(Math.floor(days), 1), MAX_HISTORY_DAYS);
}

function buildUserDatabaseFilter(includeSystem = false) {
 if (includeSystem) return "";

 return `
WHERE d.name NOT IN (${SYSTEM_DATABASE_NAMES.map((name) => `N'${name}'`).join(", ")})
`;
}

async function ensureSnapshotTable() {
 const query = `
IF NOT EXISTS (
 SELECT 1
 FROM sys.objects
 WHERE object_id = OBJECT_ID(N'[dbo].[database_size_snapshots]')
  AND type = N'U'
)
BEGIN
 CREATE TABLE [dbo].[database_size_snapshots] (
  [snapshot_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [database_name] NVARCHAR(256) NOT NULL,
  [state_desc] NVARCHAR(60) NOT NULL,
  [recovery_model_desc] NVARCHAR(60) NULL,
  [data_mb] DECIMAL(18,2) NOT NULL,
  [log_mb] DECIMAL(18,2) NOT NULL,
  [total_mb] DECIMAL(18,2) NOT NULL,
  [file_count] INT NOT NULL,
  [captured_at] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_database_size_snapshots_captured_at] DEFAULT SYSDATETIMEOFFSET()
 );

 CREATE INDEX [IX_database_size_snapshots_database_captured_at]
  ON [dbo].[database_size_snapshots] ([database_name], [captured_at] DESC);

 CREATE INDEX [IX_database_size_snapshots_captured_at]
  ON [dbo].[database_size_snapshots] ([captured_at] DESC);
END
`;

 await sequelize.query(query);
}

async function ensureSnapshotTableReady() {
 if (!ensureTablePromise) {
  ensureTablePromise = ensureSnapshotTable().catch((error) => {
   ensureTablePromise = null;
   throw error;
  });
 }

 return ensureTablePromise;
}

async function getCurrentSizes(options = {}) {
 const includeSystem = normalizeBoolean(options.includeSystem);
 const filter = buildUserDatabaseFilter(includeSystem);

 const query = `
SELECT
 d.name AS database_name,
 d.state_desc,
 d.recovery_model_desc,
 CAST(SUM(CASE WHEN mf.type = 0 THEN mf.size ELSE 0 END) * 8.0 / 1024 AS DECIMAL(18,2)) AS data_mb,
 CAST(SUM(CASE WHEN mf.type = 1 THEN mf.size ELSE 0 END) * 8.0 / 1024 AS DECIMAL(18,2)) AS log_mb,
 CAST(SUM(ISNULL(mf.size, 0)) * 8.0 / 1024 AS DECIMAL(18,2)) AS total_mb,
 COUNT(mf.file_id) AS file_count
FROM sys.databases d
LEFT JOIN sys.master_files mf ON d.database_id = mf.database_id
${filter}
GROUP BY d.name, d.state_desc, d.recovery_model_desc
ORDER BY total_mb DESC, database_name ASC;
`;

 return sequelize.query(query, { type: QueryTypes.SELECT });
}

async function captureSnapshot(options = {}) {
 await ensureSnapshotTableReady();

 const includeSystem = normalizeBoolean(options.includeSystem);
 const filter = buildUserDatabaseFilter(includeSystem);

 const query = `
INSERT INTO [dbo].[database_size_snapshots] (
 [database_name],
 [state_desc],
 [recovery_model_desc],
 [data_mb],
 [log_mb],
 [total_mb],
 [file_count],
 [captured_at]
)
SELECT
 d.name AS database_name,
 d.state_desc,
 d.recovery_model_desc,
 CAST(SUM(CASE WHEN mf.type = 0 THEN mf.size ELSE 0 END) * 8.0 / 1024 AS DECIMAL(18,2)) AS data_mb,
 CAST(SUM(CASE WHEN mf.type = 1 THEN mf.size ELSE 0 END) * 8.0 / 1024 AS DECIMAL(18,2)) AS log_mb,
 CAST(SUM(ISNULL(mf.size, 0)) * 8.0 / 1024 AS DECIMAL(18,2)) AS total_mb,
 COUNT(mf.file_id) AS file_count,
 SYSDATETIMEOFFSET()
FROM sys.databases d
LEFT JOIN sys.master_files mf ON d.database_id = mf.database_id
${filter}
GROUP BY d.name, d.state_desc, d.recovery_model_desc;
`;

 await sequelize.query(query);

 const [latest] = await sequelize.query(
  `
SELECT TOP 1 [captured_at]
FROM [dbo].[database_size_snapshots]
ORDER BY [captured_at] DESC;
`,
  { type: QueryTypes.SELECT }
 );

 return {
  captured_at: latest?.captured_at || new Date(),
 };
}

async function hasSnapshotThisWeek() {
 await ensureSnapshotTableReady();

 const [row] = await sequelize.query(
  `
SELECT TOP 1 [captured_at]
FROM [dbo].[database_size_snapshots]
WHERE [captured_at] >= DATEADD(day, 1 - DATEPART(weekday, SYSDATETIMEOFFSET()), CAST(CAST(SYSDATETIMEOFFSET() AS date) AS datetimeoffset))
ORDER BY [captured_at] DESC;
`,
  { type: QueryTypes.SELECT }
 );

 return Boolean(row?.captured_at);
}

async function captureWeeklySnapshot(options = {}) {
 const force = normalizeBoolean(options.force);

 if (!force && (await hasSnapshotThisWeek())) {
  return {
   captured: false,
   skipped: true,
   message: "Snapshot minggu ini sudah tersedia",
  };
 }

 const result = await captureSnapshot(options);

 return {
  ...result,
  captured: true,
  skipped: false,
 };
}

async function getGrowthHistory(options = {}) {
 await ensureSnapshotTableReady();

 const days = normalizeDays(options.days);
 const databaseName = String(options.database || "").trim();
 const replacements = { days };

 let databaseFilter = "";

 if (databaseName) {
  replacements.databaseName = databaseName;
  databaseFilter = "AND database_name = :databaseName";
 }

 const snapshots = await sequelize.query(
  `
SELECT
 [snapshot_id],
 [database_name],
 [state_desc],
 [recovery_model_desc],
 [data_mb],
 [log_mb],
 [total_mb],
 [file_count],
 [captured_at]
FROM [dbo].[database_size_snapshots]
WHERE [captured_at] >= DATEADD(day, -1 * :days, SYSDATETIMEOFFSET())
${databaseFilter}
ORDER BY [captured_at] ASC, [database_name] ASC;
`,
  { replacements, type: QueryTypes.SELECT }
 );

 const growth = await sequelize.query(
  `
WITH filtered AS (
 SELECT
  *,
  ROW_NUMBER() OVER (PARTITION BY [database_name] ORDER BY [captured_at] ASC, [snapshot_id] ASC) AS rn_first,
  ROW_NUMBER() OVER (PARTITION BY [database_name] ORDER BY [captured_at] DESC, [snapshot_id] DESC) AS rn_last
 FROM [dbo].[database_size_snapshots]
 WHERE [captured_at] >= DATEADD(day, -1 * :days, SYSDATETIMEOFFSET())
 ${databaseFilter}
),
pairs AS (
 SELECT
  [database_name],
  MAX(CASE WHEN rn_first = 1 THEN [captured_at] END) AS first_captured_at,
  MAX(CASE WHEN rn_first = 1 THEN [data_mb] END) AS first_data_mb,
  MAX(CASE WHEN rn_first = 1 THEN [log_mb] END) AS first_log_mb,
  MAX(CASE WHEN rn_first = 1 THEN [total_mb] END) AS first_total_mb,
  MAX(CASE WHEN rn_last = 1 THEN [captured_at] END) AS last_captured_at,
  MAX(CASE WHEN rn_last = 1 THEN [data_mb] END) AS last_data_mb,
  MAX(CASE WHEN rn_last = 1 THEN [log_mb] END) AS last_log_mb,
  MAX(CASE WHEN rn_last = 1 THEN [total_mb] END) AS last_total_mb,
  COUNT(*) AS sample_count
 FROM filtered
 GROUP BY [database_name]
)
SELECT
 [database_name],
 [sample_count],
 [first_captured_at],
 [last_captured_at],
 CAST([first_data_mb] AS DECIMAL(18,2)) AS first_data_mb,
 CAST([last_data_mb] AS DECIMAL(18,2)) AS last_data_mb,
 CAST([first_log_mb] AS DECIMAL(18,2)) AS first_log_mb,
 CAST([last_log_mb] AS DECIMAL(18,2)) AS last_log_mb,
 CAST([first_total_mb] AS DECIMAL(18,2)) AS first_total_mb,
 CAST([last_total_mb] AS DECIMAL(18,2)) AS last_total_mb,
 CAST([last_data_mb] - [first_data_mb] AS DECIMAL(18,2)) AS data_growth_mb,
 CAST([last_log_mb] - [first_log_mb] AS DECIMAL(18,2)) AS log_growth_mb,
 CAST([last_total_mb] - [first_total_mb] AS DECIMAL(18,2)) AS total_growth_mb,
 CAST(([last_total_mb] - [first_total_mb]) / NULLIF(DATEDIFF(day, [first_captured_at], [last_captured_at]), 0) AS DECIMAL(18,2)) AS avg_growth_mb_per_day
FROM pairs
ORDER BY total_growth_mb DESC, last_total_mb DESC;
`,
  { replacements, type: QueryTypes.SELECT }
 );

 return {
  days,
  snapshots,
  growth,
 };
}

async function getOverview(options = {}) {
 await ensureSnapshotTableReady();

 const [current, history] = await Promise.all([
  getCurrentSizes(options),
  getGrowthHistory(options),
 ]);

 const totalSizeMb = current.reduce((sum, row) => sum + Number(row.total_mb || 0), 0);
 const totalDataMb = current.reduce((sum, row) => sum + Number(row.data_mb || 0), 0);
 const totalLogMb = current.reduce((sum, row) => sum + Number(row.log_mb || 0), 0);
 const topGrowth = history.growth[0] || null;

 return {
  summary: {
   database_count: current.length,
   total_size_mb: totalSizeMb,
   total_data_mb: totalDataMb,
   total_log_mb: totalLogMb,
   top_growth_database: topGrowth?.database_name || null,
   top_growth_mb: Number(topGrowth?.total_growth_mb || 0),
  },
  current,
  history,
 };
}

export default {
 ensureSnapshotTableReady,
 getCurrentSizes,
 captureSnapshot,
 captureWeeklySnapshot,
 hasSnapshotThisWeek,
 getGrowthHistory,
 getOverview,
};
