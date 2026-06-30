-- ============================================================
-- FILE  : fix-asset-category.sql
-- TUJUAN: Perbaikan data asset & kategori yang tidak sesuai
-- DB    : Samit (MSSQL)
-- TANGGAL: 2026-06-09
-- 
-- INSTRUKSI:
--   1. Jalankan bagian VERIFIKASI dulu (SELECT only)
--   2. Review hasilnya
--   3. Jalankan UPDATE/NONAKTIFKAN sesuai kebutuhan
-- ============================================================


-- ============================================================
-- [BAGIAN 1] VERIFIKASI SEBELUM UPDATE
-- ============================================================

-- 1a. Cek 4 asset STORAGE yg berada di kategori parent (level 2)
SELECT 
    a.asset_id, a.asset_code, a.asset_name,
    a.category_id, ac.category_name, ac.level_no
FROM assets a
JOIN asset_categories ac ON a.category_id = ac.category_id
WHERE a.asset_id IN (816, 1100, 1101, 1103);

-- 1b. Cek kategori leaf yang tidak digunakan (jumlah_asset = 0)
SELECT 
    ac.category_id, ac.category_name, ac.parent_id, 
    ac.level_no, ac.is_active,
    COUNT(a.asset_id) AS jumlah_asset
FROM asset_categories ac
LEFT JOIN assets a ON a.category_id = ac.category_id
GROUP BY ac.category_id, ac.category_name, ac.parent_id, ac.level_no, ac.is_active
HAVING COUNT(a.asset_id) = 0
ORDER BY ac.level_no, ac.category_name;


-- ============================================================
-- [BAGIAN 2] OPSI A — Pindahkan 4 asset STORAGE
--            dari STORAGE/parent (id:32, level 2)
--            ke   Storage Device  (id:53, level 4)
--
-- !! Pilih OPSI A atau OPSI B, jangan keduanya !!
--
-- Gunakan jika storage tersebut adalah perangkat fisik
-- (NAS/SAN) yang memang perlu dikategorikan lebih spesifik.
-- ============================================================

-- [PREVIEW OPSI A] — lihat dulu sebelum eksekusi
SELECT asset_id, asset_code, asset_name, category_id AS dari
FROM assets
WHERE asset_id IN (816, 1100, 1101, 1103);

-- [EKSEKUSI OPSI A] — uncomment jika yakin
/*
UPDATE assets
SET category_id = 53   -- Storage Device (level 4, parent: PANEL RACK > NETWORKING)
WHERE asset_id IN (816, 1100, 1101, 1103);
*/


-- ============================================================
-- [BAGIAN 2] OPSI B — Biarkan 4 asset di STORAGE (id:32)
--            Tetapi pindahkan ke kategori STORAGE baru
--            di bawah SERVER (id:29), bukan di level 2
--
-- Gunakan jika STORAGE (id:32) dimaksudkan sebagai
-- kategori sendiri yang valid dan bukan turunan NETWORKING.
-- ============================================================
-- (Tidak ada perubahan data — hanya dokumentasi keputusan)


-- ============================================================
-- [BAGIAN 3] NONAKTIFKAN kategori leaf yang tidak digunakan
--
-- Kategori ini tetap ada di DB (tidak dihapus), hanya 
-- disembunyikan dari dropdown frontend (is_active = false).
-- Data aman, bisa diaktifkan kembali kapan saja.
-- ============================================================

-- [PREVIEW] Kategori yang akan dinonaktifkan
SELECT category_id, category_name, level_no, is_active
FROM asset_categories
WHERE category_id IN (
    51,  -- ROUTER           (level 3)
    23,  -- FIREWALL         (level 3)
    26,  -- L3               (level 4)
    50,  -- NVR              (level 4)
    53,  -- Storage Device   (level 4) ← skip jika pakai OPSI A
    31,  -- VIRTUAL          (level 3)
    62,  -- TELECOMUNICATION (level 4)
    68,  -- PC INDUSTRIAL    (level 3)
    85,  -- SCANNERS         (level 3)
    94,  -- WIRELESS DISPLAY TRANSMITER (level 3)
    40,  -- ACCES DOOR       (level 2)
    60,  -- Face Attendance  (level 2)
    57,  -- ADAPTOR          (level 3)
    56,  -- CAMERA           (level 3)
    66,  -- Telephone Cable  (level 3)
    67,  -- Telephone Unit   (level 3)
    65,  -- TELECOMUNICATIONS(level 2)
    43,  -- TELECONFERENCE   (level 2)
    42,  -- CAMERA POCKET    (level 2)
    47,  -- PODCAST          (level 2)
    46,  -- TABLET           (level 2) ← skip jika masih pakai sebagai parent
    36,  -- Personal Computer(level 2)
    35,  -- SOFTWARE         (level 2)
    33,  -- UTILITY          (level 2)
    44,  -- TELEVISI         (level 2)
    52,  -- PANEL RACK       (level 3)
    20,  -- NETWORKING       (level 2) ← hati-hati, ini parent dari banyak kategori aktif
    29,  -- SERVER           (level 2) ← hati-hati, ini parent
    37,  -- CCTV             (level 2) ← hati-hati, ini parent
    19,  -- CLIENT           (level 1) ← hati-hati, ini root
    18   -- UTAMA            (level 1) ← hati-hati, ini root
);

-- [EKSEKUSI] Nonaktifkan HANYA leaf yang pasti tidak dipakai
-- (exclude parent/header agar struktur tree tidak rusak)
-- uncomment jika yakin
/*
UPDATE asset_categories
SET is_active = 0
WHERE category_id IN (
    51,  -- ROUTER
    23,  -- FIREWALL
    26,  -- L3
    50,  -- NVR
    31,  -- VIRTUAL
    62,  -- TELECOMUNICATION
    68,  -- PC INDUSTRIAL
    85,  -- SCANNERS
    94,  -- WIRELESS DISPLAY TRANSMITER
    57,  -- ADAPTOR
    56,  -- CAMERA
    66,  -- Telephone Cable
    67,  -- Telephone Unit
    42,  -- CAMERA POCKET
    44   -- TELEVISI
);
*/


-- ============================================================
-- [BAGIAN 4] VERIFIKASI SESUDAH UPDATE
-- ============================================================

-- Cek ulang distribusi setelah perubahan
SELECT 
    ac.category_id,
    ac.category_name,
    ac.level_no,
    ac.is_active,
    COUNT(a.asset_id) AS jumlah_asset
FROM asset_categories ac
LEFT JOIN assets a ON a.category_id = ac.category_id
GROUP BY ac.category_id, ac.category_name, ac.level_no, ac.is_active
ORDER BY ac.level_no, COUNT(a.asset_id) DESC;
