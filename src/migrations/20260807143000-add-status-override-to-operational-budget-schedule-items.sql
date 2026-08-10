IF COL_LENGTH('operational_budget_schedule_items', 'status_override') IS NULL
BEGIN
    ALTER TABLE operational_budget_schedule_items
    ADD status_override VARCHAR(50) NULL;
END
GO

IF COL_LENGTH('operational_budget_schedule_items', 'status_note') IS NULL
BEGIN
    ALTER TABLE operational_budget_schedule_items
    ADD status_note VARCHAR(255) NULL;
END
GO
