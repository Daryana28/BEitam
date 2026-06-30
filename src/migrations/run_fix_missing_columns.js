/**
 * Migration: Fix missing columns identified in audit
 * 
 * Tables affected:
 *   1. users              — add profile_picture, phone
 *   2. standard_maintenances — add source_file, imported_by, imported_at
 *   3. maintenance_actual — fix legend default '?' → '□'
 *
 * Usage:
 *   cd be && node src/migrations/run_fix_missing_columns.js
 */

import "dotenv/config";
import sequelize from "../config/db/db.js";

const q = (sql, opts) => sequelize.query(sql, opts);

const columnExists = async (table, column) => {
  const [[row]] = await q(`
    SELECT 1 AS found
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.${table}') AND name = '${column}'
  `);
  return Boolean(row);
};

const defaultExists = async (table, column, defaultValue) => {
  const [[row]] = await q(`
    SELECT dc.definition
    FROM sys.columns c
    JOIN sys.default_constraints dc
      ON c.default_object_id = dc.object_id
      AND c.object_id = dc.parent_object_id
    WHERE c.object_id = OBJECT_ID('dbo.${table}')
      AND c.name = '${column}'
  `);
  if (!row || !row.definition) return false;
  return row.definition.includes(defaultValue);
};

const run = async () => {
  try {
    console.log("Starting fix_missing_columns migration...\n");

    // ─── 1. users: profile_picture ─────────────────────────────────
    if (!(await columnExists("users", "profile_picture"))) {
      console.log("  + users.profile_picture");
      await q(`ALTER TABLE dbo.users ADD profile_picture NVARCHAR(500) NULL;`);
    } else {
      console.log("  = users.profile_picture already exists, skipping");
    }

    // ─── 2. users: phone ───────────────────────────────────────────
    if (!(await columnExists("users", "phone"))) {
      console.log("  + users.phone");
      await q(`ALTER TABLE dbo.users ADD phone NVARCHAR(30) NULL;`);
    } else {
      console.log("  = users.phone already exists, skipping");
    }

    // ─── 3. standard_maintenances: source_file ─────────────────────
    if (!(await columnExists("standard_maintenances", "source_file"))) {
      console.log("  + standard_maintenances.source_file");
      await q(`ALTER TABLE dbo.standard_maintenances ADD source_file NVARCHAR(255) NULL;`);
    } else {
      console.log("  = standard_maintenances.source_file already exists, skipping");
    }

    // ─── 4. standard_maintenances: imported_by ─────────────────────
    if (!(await columnExists("standard_maintenances", "imported_by"))) {
      console.log("  + standard_maintenances.imported_by");
      await q(`ALTER TABLE dbo.standard_maintenances ADD imported_by BIGINT NULL;`);
    } else {
      console.log("  = standard_maintenances.imported_by already exists, skipping");
    }

    // ─── 5. standard_maintenances: imported_at ─────────────────────
    if (!(await columnExists("standard_maintenances", "imported_at"))) {
      console.log("  + standard_maintenances.imported_at");
      await q(`ALTER TABLE dbo.standard_maintenances ADD imported_at DATETIMEOFFSET NULL;`);
    } else {
      console.log("  = standard_maintenances.imported_at already exists, skipping");
    }

    // ─── 6. maintenance_actual: fix legend default ─────────────────
    if (!(await defaultExists("maintenance_actual", "legend", "□"))) {
      console.log("  ~ maintenance_actual.legend default '?' → '□'");
      await q(`
        DECLARE @name NVARCHAR(128);
        SELECT @name = dc.name
        FROM sys.columns c
        JOIN sys.default_constraints dc
          ON c.default_object_id = dc.object_id
          AND c.object_id = dc.parent_object_id
        WHERE c.object_id = OBJECT_ID('dbo.maintenance_actual')
          AND c.name = 'legend';
        IF @name IS NOT NULL
          EXEC('ALTER TABLE dbo.maintenance_actual DROP CONSTRAINT ' + @name);
      `);
      await q(`
        ALTER TABLE dbo.maintenance_actual
          ADD CONSTRAINT DF_maintenance_actual_legend DEFAULT N'□' FOR legend;
      `);
    } else {
      console.log("  = maintenance_actual.legend default already '□', skipping");
    }

    console.log("\nAll migrations completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("\nMigration FAILED:", err.message);
    process.exit(1);
  }
};

run();
