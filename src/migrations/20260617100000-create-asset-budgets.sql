IF OBJECT_ID('asset_budgets', 'U') IS NOT NULL
BEGIN
    DROP TABLE asset_budgets;
END
GO

CREATE TABLE asset_budgets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    budget_code VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    initial_plan DECIMAL(18, 2),
    review DECIMAL(18, 2),
    item_no VARCHAR(100),
    item_name VARCHAR(255),
    factory VARCHAR(100),
    vehicle_type VARCHAR(100),
    qty INT,
    purpose VARCHAR(100),
    sale VARCHAR(100),
    currency VARCHAR(50),
    price_pengajuan DECIMAL(18, 2),
    purchase_price DECIMAL(18, 2),
    rate VARCHAR(50),
    budget DECIMAL(18, 2),
    po_date VARCHAR(10),
    ship_date VARCHAR(10),
    acceptance_month VARCHAR(10),
    payment_condition VARCHAR(255),
    payment_date_1 VARCHAR(10),
    payment_rate_1 VARCHAR(50),
    payment_amount_1 DECIMAL(18, 2),
    payment_date_2 VARCHAR(10),
    payment_rate_2 VARCHAR(50),
    payment_amount_2 DECIMAL(18, 2),
    payment_date_3 VARCHAR(10),
    payment_rate_3 VARCHAR(50),
    payment_amount_3 DECIMAL(18, 2),
    mass_pro_timing VARCHAR(10),
    capitalized_month VARCHAR(10),
    created_at DATETIMEOFFSET DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIMEOFFSET DEFAULT CURRENT_TIMESTAMP
);
GO
