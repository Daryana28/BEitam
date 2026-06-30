-- Tabel Induk Utama: Yearly Standard Maintenance
CREATE TABLE [dbo].[yearly_standard_maintenances] (
    [id] BIGINT IDENTITY(1,1) NOT NULL,
    [tahun] INT NOT NULL,
    [judul] NVARCHAR(255) NOT NULL,
    [status_approval] NVARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    [alasan_hapus] NVARCHAR(MAX) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_yearly_standard_maintenances] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- Tabel Perangkat (Child dari Yearly)
CREATE TABLE [dbo].[standard_maintenances] (
    [id] BIGINT IDENTITY(1,1) NOT NULL,
    [yearly_standard_id] BIGINT NOT NULL,
    [kategori] NVARCHAR(100) NOT NULL,
    [subKategori] NVARCHAR(100) NOT NULL,
    [namaPerangkat] NVARCHAR(100) NOT NULL,
    [tipePerangkat] NVARCHAR(100) NOT NULL,
    [subPerangkat] NVARCHAR(100) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_standard_maintenances] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- Tabel Kelompok/Fungsi (Child dari Perangkat)
CREATE TABLE [dbo].[standard_maintenance_details] (
    [id] BIGINT IDENTITY(1,1) NOT NULL,
    [standard_maintenance_id] BIGINT NOT NULL,
    [fungsi] NVARCHAR(255) NULL,
    [deskripsi] NVARCHAR(MAX) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_standard_maintenance_details] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO

-- Tabel Item Pengecekan (Child dari Detail)
CREATE TABLE [dbo].[standard_maintenance_checks] (
    [id] BIGINT IDENTITY(1,1) NOT NULL,
    [standard_maintenance_detail_id] BIGINT NOT NULL,
    [pengecekan] NVARCHAR(255) NULL,
    [standard] NVARCHAR(255) NULL,
    [periodik] NVARCHAR(100) NULL,
    [bagian] NVARCHAR(255) NULL,
    [metode] NVARCHAR(255) NULL,
    [alat] NVARCHAR(255) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_standard_maintenance_checks] PRIMARY KEY CLUSTERED ([id] ASC)
);
GO
