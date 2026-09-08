import serverStorageService from "./serverStorageService.js";

export async function receiveServerStorageSnapshot(req, res) {
 try {
  const token = req.get("x-agent-token");
  const result = await serverStorageService.saveAgentSnapshot(req.body, token);

  return res.status(201).json({
   success: true,
   message: "Snapshot Server Storage berhasil disimpan",
   ...result,
  });
 } catch (error) {
  console.error("Error saving server storage snapshot:", error);

  return res.status(error.statusCode || 500).json({
   success: false,
   message: error.message || "Gagal menyimpan snapshot Server Storage",
  });
 }
}

export async function getServerStorageOverview(req, res) {
 try {
  const result = await serverStorageService.getOverview(req.query);

  return res.status(200).json({
   success: true,
   ...result,
  });
 } catch (error) {
  console.error("Error fetching server storage overview:", error);

  return res.status(500).json({
   success: false,
   message: error.message || "Gagal memuat monitoring Server Storage",
  });
 }
}
