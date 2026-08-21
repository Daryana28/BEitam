import "dotenv/config";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    dialect: "mssql",
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
  }
);

const queries = {
  counts: `
    SELECT 'assets' AS src, COUNT(*) AS total FROM assets
    UNION ALL
    SELECT 'assets_backup_20260806' AS src, COUNT(*) AS total FROM assets_backup_20260806
  `,
  backupSample: `
    SELECT TOP 20
      asset_id,
      asset_code,
      asset_name,
      category_id,
      purchase_date,
      depreciation_date,
      created_at
    FROM assets_backup_20260806
    ORDER BY created_at DESC
  `,
  currentSample: `
    SELECT TOP 30
      a.asset_id,
      a.asset_code,
      a.asset_name,
      a.category_id,
      c.category_name,
      a.purchase_date,
      a.depreciation_date,
      a.created_at
    FROM assets a
    LEFT JOIN asset_categories c ON c.category_id = a.category_id
    ORDER BY a.created_at DESC
  `,
  overlapCounts: `
    SELECT
      (SELECT COUNT(*) FROM assets a INNER JOIN assets_backup_20260806 b ON b.asset_id = a.asset_id) AS same_asset_id,
      (SELECT COUNT(*) FROM assets a INNER JOIN assets_backup_20260806 b ON b.asset_code = a.asset_code AND ISNULL(b.purchase_date, '1900-01-01') = ISNULL(a.purchase_date, '1900-01-01')) AS same_code_and_purchase,
      (SELECT COUNT(*) FROM assets a WHERE a.category_id IN ('175','188')) AS current_root_rows
  `,
  assetColumns: `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'assets'
    ORDER BY ORDINAL_POSITION
  `,
  backupColumns: `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'assets_backup_20260806'
    ORDER BY ORDINAL_POSITION
  `,
};

try {
  const [counts] = await sequelize.query(queries.counts);
  const [backupSample] = await sequelize.query(queries.backupSample);
  const [currentSample] = await sequelize.query(queries.currentSample);
  const [overlapCounts] = await sequelize.query(queries.overlapCounts);
  const [assetColumns] = await sequelize.query(queries.assetColumns);
  const [backupColumns] = await sequelize.query(queries.backupColumns);

  console.log(
    JSON.stringify(
      {
        counts,
        overlapCounts,
        assetColumns,
        backupColumns,
        backupSample,
        currentSample,
      },
      null,
      2
    )
  );
} finally {
  await sequelize.close();
}
