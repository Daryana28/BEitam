IF COL_LENGTH('maintenance_actual', 'actual_note') IS NULL
BEGIN
    ALTER TABLE maintenance_actual
    ADD actual_note NVARCHAR(MAX) NULL;
END
GO
