import { QueryTypes } from "sequelize";

import { sequelize } from "../../models/index.js";

const DEFAULT_HISTORY_DAYS = 30;
const MAX_HISTORY_DAYS = 3650;

let ensureTablePromise = null;

function normalizeDays(value) {
 const days = Number(value || DEFAULT_HISTORY_DAYS);

 if (!Number.isFinite(days)) return DEFAULT_HISTORY_DAYS;

 return Math.min(Math.max(Math.floor(days), 1), MAX_HISTORY_DAYS);
}

function normalizeText(value, fallback = "") {
 const text = String(value ?? "").trim();

 return text || fallback;
}

function normalizeBytes(value) {
 const number = Number(value);

 if (!Number.isFinite(number) || number < 0) return null;

 return Math.round(number);
}

async function ensureServerStorageTable() {
 const query = `
IF NOT EXISTS (
 SELECT 1
 FROM sys.objects
 WHERE object_id = OBJECT_ID(N'[dbo].[server_storage_snapshots]')
  AND type = N'U'
)
BEGIN
 CREATE TABLE [dbo].[server_storage_snapshots] (
  [snapshot_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [server_name] NVARCHAR(128) NOT NULL,
  [drive_letter] NVARCHAR(16) NOT NULL,
  [volume_name] NVARCHAR(256) NULL,
  [total_bytes] BIGINT NOT NULL,
  [used_bytes] BIGINT NOT NULL,
  [free_bytes] BIGINT NOT NULL,
  [used_percent] DECIMAL(6,2) NOT NULL,
  [captured_at] DATETIMEOFFSET NOT NULL
 );

 CREATE INDEX [IX_server_storage_snapshots_server_drive_captured_at]
  ON [dbo].[server_storage_snapshots] ([server_name], [drive_letter], [captured_at] DESC);

 CREATE INDEX [IX_server_storage_snapshots_captured_at]
  ON [dbo].[server_storage_snapshots] ([captured_at] DESC);
END

IF NOT EXISTS (
 SELECT 1
 FROM sys.objects
 WHERE object_id = OBJECT_ID(N'[dbo].[server_storage_notes]')
  AND type = N'U'
)
BEGIN
 CREATE TABLE [dbo].[server_storage_notes] (
  [server_name] NVARCHAR(128) NOT NULL PRIMARY KEY,
  [note] NVARCHAR(256) NOT NULL,
  [updated_at] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
 );
END
`;

 await sequelize.query(query);
}

async function ensureServerStorageTableReady() {
 if (!ensureTablePromise) {
  ensureTablePromise = ensureServerStorageTable().catch((error) => {
   ensureTablePromise = null;
   throw error;
  });
 }

 return ensureTablePromise;
}

function validateAgentToken(token) {
 const expectedToken = normalizeText(process.env.SERVER_STORAGE_AGENT_TOKEN);

 if (!expectedToken) {
  const error = new Error("SERVER_STORAGE_AGENT_TOKEN belum dikonfigurasi");
  error.statusCode = 503;
  throw error;
 }

 if (!token || token !== expectedToken) {
  const error = new Error("Token agent tidak valid");
  error.statusCode = 401;
  throw error;
 }
}

function normalizeDrivePayload(drive) {
 const driveLetter = normalizeText(drive?.drive || drive?.driveLetter || drive?.deviceId);
 const totalBytes = normalizeBytes(drive?.totalBytes);
 const freeBytes = normalizeBytes(drive?.freeBytes);
 const usedBytes = normalizeBytes(
  drive?.usedBytes ?? (totalBytes != null && freeBytes != null ? totalBytes - freeBytes : null)
 );

 if (!driveLetter || totalBytes == null || freeBytes == null || usedBytes == null || totalBytes <= 0) {
  return null;
 }

 const usedPercent = Number.isFinite(Number(drive?.usedPercent))
  ? Number(drive.usedPercent)
  : (usedBytes / totalBytes) * 100;

 return {
  driveLetter,
  volumeName: normalizeText(drive?.label || drive?.volumeName, null),
  totalBytes,
  usedBytes,
  freeBytes,
  usedPercent: Math.min(Math.max(Number(usedPercent.toFixed(2)), 0), 100),
 };
}

async function saveAgentSnapshot(payload = {}, token) {
 validateAgentToken(token);
 await ensureServerStorageTableReady();

 const serverName = normalizeText(payload.serverName || payload.hostname);
 const capturedAt = payload.capturedAt ? new Date(payload.capturedAt) : new Date();
 const drives = Array.isArray(payload.drives)
  ? payload.drives.map(normalizeDrivePayload).filter(Boolean)
  : [];

 if (!serverName || Number.isNaN(capturedAt.getTime()) || drives.length === 0) {
  const error = new Error("Payload snapshot storage tidak valid");
  error.statusCode = 400;
  throw error;
 }

 for (const drive of drives) {
  await sequelize.query(
   `
INSERT INTO [dbo].[server_storage_snapshots] (
 [server_name],
 [drive_letter],
 [volume_name],
 [total_bytes],
 [used_bytes],
 [free_bytes],
 [used_percent],
 [captured_at]
) VALUES (
 :serverName,
 :driveLetter,
 :volumeName,
 :totalBytes,
 :usedBytes,
 :freeBytes,
 :usedPercent,
 :capturedAt
);
`,
   {
    replacements: {
     serverName,
     driveLetter: drive.driveLetter,
     volumeName: drive.volumeName,
     totalBytes: drive.totalBytes,
     usedBytes: drive.usedBytes,
     freeBytes: drive.freeBytes,
     usedPercent: drive.usedPercent,
     capturedAt,
    },
   }
  );
 }

 return {
  serverName,
  capturedAt,
  saved: drives.length,
 };
}

async function getOverview(options = {}) {
 await ensureServerStorageTableReady();

 const days = normalizeDays(options.days);
 const replacements = { days };

 const snapshots = await sequelize.query(
  `
SELECT
 [snapshot_id],
 [server_name] AS serverName,
 [drive_letter] AS drive,
 [volume_name] AS label,
 [total_bytes] AS totalBytes,
 [used_bytes] AS usedBytes,
 [free_bytes] AS freeBytes,
 [used_percent] AS usedPercent,
 [captured_at] AS capturedAt
FROM [dbo].[server_storage_snapshots]
WHERE [captured_at] >= DATEADD(day, -1 * :days, SYSDATETIMEOFFSET())
ORDER BY [captured_at] ASC, [server_name] ASC, [drive_letter] ASC;
`,
  { replacements, type: QueryTypes.SELECT }
 );

 const latest = await sequelize.query(
  `
WITH ranked AS (
 SELECT
  *,
  ROW_NUMBER() OVER (
   PARTITION BY [server_name], [drive_letter]
   ORDER BY [captured_at] DESC, [snapshot_id] DESC
  ) AS rn
 FROM [dbo].[server_storage_snapshots]
)
SELECT
 [snapshot_id],
 [server_name] AS serverName,
 [drive_letter] AS drive,
 [volume_name] AS label,
 [total_bytes] AS totalBytes,
 [used_bytes] AS usedBytes,
 [free_bytes] AS freeBytes,
 [used_percent] AS usedPercent,
 [captured_at] AS capturedAt
FROM ranked
WHERE rn = 1
ORDER BY [server_name] ASC, [drive_letter] ASC;
`,
  { type: QueryTypes.SELECT }
 );

 const growth = await sequelize.query(
  `
WITH filtered AS (
 SELECT
  *,
  ROW_NUMBER() OVER (
   PARTITION BY [server_name], [drive_letter]
   ORDER BY [captured_at] ASC, [snapshot_id] ASC
  ) AS rn_first,
  ROW_NUMBER() OVER (
   PARTITION BY [server_name], [drive_letter]
   ORDER BY [captured_at] DESC, [snapshot_id] DESC
  ) AS rn_last
 FROM [dbo].[server_storage_snapshots]
 WHERE [captured_at] >= DATEADD(day, -1 * :days, SYSDATETIMEOFFSET())
),
pairs AS (
 SELECT
  [server_name],
  [drive_letter],
  MAX(CASE WHEN rn_first = 1 THEN [captured_at] END) AS first_captured_at,
  MAX(CASE WHEN rn_first = 1 THEN [used_bytes] END) AS first_used_bytes,
  MAX(CASE WHEN rn_last = 1 THEN [captured_at] END) AS last_captured_at,
  MAX(CASE WHEN rn_last = 1 THEN [used_bytes] END) AS last_used_bytes,
  COUNT(*) AS sample_count
 FROM filtered
 GROUP BY [server_name], [drive_letter]
)
SELECT
 [server_name] AS serverName,
 [drive_letter] AS drive,
 [sample_count] AS sampleCount,
 [first_captured_at] AS firstCapturedAt,
 [last_captured_at] AS lastCapturedAt,
 [first_used_bytes] AS firstUsedBytes,
 [last_used_bytes] AS lastUsedBytes,
 [last_used_bytes] - [first_used_bytes] AS growthBytes
FROM pairs
ORDER BY growthBytes DESC;
`,
 { replacements, type: QueryTypes.SELECT }
 );

 const notes = await sequelize.query(
  `
SELECT
 [server_name] AS serverName,
 [note] AS note
FROM [dbo].[server_storage_notes]
ORDER BY [server_name] ASC;
`,
  { type: QueryTypes.SELECT }
 );

 const serverNotes = notes.reduce((items, row) => {
  const serverName = normalizeText(row.serverName, null);
  const note = normalizeText(row.note, null);

  if (serverName && note) {
   items[serverName] = note;
  }

  return items;
 }, {});

 return {
  days,
  drives: latest,
  serverNotes,
  history: {
   snapshots,
   growth,
  },
 };
}

async function saveServerNote(payload = {}) {
 await ensureServerStorageTableReady();

 const serverName = normalizeText(payload.serverName, null);
 const note = normalizeText(payload.note, "");

 if (!serverName) {
  const error = new Error("Nama server wajib diisi.");
  error.statusCode = 400;
  throw error;
 }

 if (!note) {
  await sequelize.query(
   `
DELETE FROM [dbo].[server_storage_notes]
WHERE [server_name] = :serverName;
`,
   {
    replacements: { serverName },
   }
  );

  return { serverName, note: "" };
 }

 await sequelize.query(
  `
MERGE [dbo].[server_storage_notes] AS target
USING (SELECT :serverName AS [server_name], :note AS [note]) AS source
ON target.[server_name] = source.[server_name]
WHEN MATCHED THEN
 UPDATE SET
  [note] = source.[note],
  [updated_at] = SYSDATETIMEOFFSET()
WHEN NOT MATCHED THEN
 INSERT ([server_name], [note], [updated_at])
 VALUES (source.[server_name], source.[note], SYSDATETIMEOFFSET());
`,
  {
   replacements: {
    serverName,
    note: note.slice(0, 256),
   },
  }
 );

 return { serverName, note: note.slice(0, 256) };
}

export default {
 ensureServerStorageTableReady,
 saveAgentSnapshot,
 getOverview,
 saveServerNote,
};
