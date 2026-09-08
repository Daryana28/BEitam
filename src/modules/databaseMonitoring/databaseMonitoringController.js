import databaseMonitoringService from "./databaseMonitoringService.js";

export async function getOverview(req, res) {
 try {
  const result = await databaseMonitoringService.getOverview(req.query);

  return res.status(200).json({
   success: true,
   ...result,
  });
 } catch (error) {
  console.error("Error fetching database monitoring overview:", error);

  return res.status(500).json({
   success: false,
   message: error.message || "Gagal memuat monitoring database",
  });
 }
}

export async function getCurrentSizes(req, res) {
 try {
  const data = await databaseMonitoringService.getCurrentSizes(req.query);

  return res.status(200).json({
   success: true,
   data,
  });
 } catch (error) {
  console.error("Error fetching database sizes:", error);

  return res.status(500).json({
   success: false,
   message: error.message || "Gagal memuat ukuran database",
  });
 }
}

export async function getGrowthHistory(req, res) {
 try {
  const result = await databaseMonitoringService.getGrowthHistory(req.query);

  return res.status(200).json({
   success: true,
   ...result,
  });
 } catch (error) {
  console.error("Error fetching database growth history:", error);

  return res.status(500).json({
   success: false,
   message: error.message || "Gagal memuat riwayat pertumbuhan database",
  });
 }
}

export async function captureSnapshot(req, res) {
 try {
  const result = await databaseMonitoringService.captureWeeklySnapshot(req.query);

  return res.status(result.skipped ? 200 : 201).json({
   success: true,
   message: result.message || "Snapshot monitoring database berhasil disimpan",
   ...result,
  });
 } catch (error) {
  console.error("Error capturing database snapshot:", error);

  return res.status(500).json({
   success: false,
   message: error.message || "Gagal menyimpan snapshot monitoring database",
  });
 }
}
