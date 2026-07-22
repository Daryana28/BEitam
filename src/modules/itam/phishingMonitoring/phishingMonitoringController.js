import phishingMonitoringService from "./phishingMonitoringService.js";

async function ensureMonitoringAccess(req, res) {
 if (!req.user) {
  res.status(401).json({
   success: false,
   message: "Unauthorized",
  });
  return false;
 }

 if (!(await phishingMonitoringService.canViewMonitoring(req))) {
  res.status(403).json({
   success: false,
   message: "Forbidden",
  });
  return false;
 }

 return true;
}

export async function viewTrackedImage(req, res) {
 try {
  await phishingMonitoringService.ensureImageExists();
  await phishingMonitoringService.recordClick(req);
  return res.sendFile(phishingMonitoringService.IMAGE_PATH);
 } catch (error) {
  console.error("Error serving phishing image:", error);
  return res.status(500).json({
   success: false,
   message: "Gagal memuat gambar tracking",
  });
 }
}

export async function getMonitoringRecords(req, res) {
 try {
  if (!(await ensureMonitoringAccess(req, res))) return;

  const result = await phishingMonitoringService.getMonitoringData(req.query);

  return res.status(200).json({
   success: true,
   data: result.rows,
   meta: result.meta,
   summary: result.summary,
   tracking_url: phishingMonitoringService.buildTrackingUrl(req),
   image_name: phishingMonitoringService.IMAGE_NAME,
  });
 } catch (error) {
  console.error("Error fetching phishing monitoring records:", error);
  return res.status(500).json({
   success: false,
   message: error.message || "Gagal memuat data phishing monitoring",
  });
 }
}
