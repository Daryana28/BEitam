IF OBJECT_ID('asset_budget_schedule_items', 'U') IS NULL
BEGIN
    CREATE TABLE asset_budget_schedule_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        client_key VARCHAR(100) NOT NULL UNIQUE,
        display_order INT NOT NULL DEFAULT 0,
        budget_code VARCHAR(100) NOT NULL,
        subject VARCHAR(255),
        item_name VARCHAR(255) NOT NULL,
        budget_plan_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        actual_budget_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        borrowed_from_budget_code VARCHAR(100),
        borrowed_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        transfer_date VARCHAR(20),
        borrow_purpose VARCHAR(255),
        borrow_remark VARCHAR(255),
        po_time VARCHAR(20),
        allocation VARCHAR(100),
        budget_year VARCHAR(10) NOT NULL,
        current_stage VARCHAR(50) NOT NULL DEFAULT 'All',
        stages_json NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        created_at DATETIMEOFFSET DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIMEOFFSET DEFAULT CURRENT_TIMESTAMP
    );
END
GO
