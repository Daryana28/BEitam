import { statfs } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { hostname } from "node:os";

export async function getFileSharingOverview(req, res) {
  try {
    const configured = JSON.parse(process.env.FILE_SHARING_DRIVES || "[]");
    if (!Array.isArray(configured) || configured.some((drive) =>
      !drive || typeof drive.path !== "string" || !isAbsolute(drive.path)
    )) {
      throw new Error("FILE_SHARING_DRIVES must contain absolute drive paths");
    }

    const drives = await Promise.all(configured.map(async (drive, index) => {
      const identity = {
        id: String(index),
        name: drive.name || drive.path,
        server: drive.server || hostname(),
        path: drive.path,
      };
      try {
        const stats = await statfs(drive.path);
        const totalBytes = stats.blocks * stats.bsize;
        const freeBytes = stats.bfree * stats.bsize;
        if (!Number.isFinite(totalBytes) || totalBytes <= 0 ||
            !Number.isFinite(freeBytes) || freeBytes < 0 || freeBytes > totalBytes) {
          throw new Error("Invalid filesystem capacity");
        }
        return {
          ...identity,
          status: "online",
          totalBytes,
          freeBytes,
          usedBytes: totalBytes - freeBytes,
          usedPercent: Math.round((totalBytes - freeBytes) / totalBytes * 1000) / 10,
          capturedAt: new Date().toISOString(),
        };
      } catch {
        return { ...identity, status: "unavailable" };
      }
    }));
    return res.json({ success: true, drives });
  } catch (error) {
    console.error("File sharing monitoring configuration error:", error.message);
    return res.status(500).json({ success: false, message: "Konfigurasi monitoring drive tidak valid. Hubungi administrator." });
  }
}
