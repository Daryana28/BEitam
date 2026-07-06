IF COL_LENGTH('asset_budget_schedule_items', 'item_no') IS NULL
BEGIN
    ALTER TABLE asset_budget_schedule_items
    ADD item_no VARCHAR(50) NULL;
END
GO
