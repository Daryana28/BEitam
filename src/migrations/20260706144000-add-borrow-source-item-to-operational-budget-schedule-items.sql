IF COL_LENGTH('operational_budget_schedule_items', 'borrowed_from_item_name') IS NULL
BEGIN
    ALTER TABLE operational_budget_schedule_items
    ADD borrowed_from_item_name VARCHAR(255) NULL;
END
GO

IF COL_LENGTH('operational_budget_schedule_items', 'borrowed_from_item_no') IS NULL
BEGIN
    ALTER TABLE operational_budget_schedule_items
    ADD borrowed_from_item_no VARCHAR(50) NULL;
END
GO
