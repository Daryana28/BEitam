IF NOT EXISTS (
  SELECT 1
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'standard_maintenance_checks'
    AND COLUMN_NAME = 'cycle_time_minutes'
)
BEGIN
  ALTER TABLE dbo.standard_maintenance_checks
  ADD cycle_time_minutes INT NULL;
END;
