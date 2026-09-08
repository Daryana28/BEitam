import databaseMonitoringService from "../modules/databaseMonitoring/databaseMonitoringService.js";

const TARGET_DAY = 1;
const TARGET_HOUR = 8;
const TARGET_MINUTE = 0;
const TARGET_SECOND = 0;
let schedulerStarted = false;
let snapshotRunning = false;
let schedulerTimer = null;

async function runSnapshot(reason = "scheduled") {
 if (snapshotRunning) return;

 snapshotRunning = true;

 try {
  const result = await databaseMonitoringService.captureWeeklySnapshot();
  if (result.skipped) {
   console.log(`[database-monitoring] ${reason} snapshot skipped: weekly data already exists`);
   return;
  }

  console.log(`[database-monitoring] ${reason} weekly snapshot captured at ${result.captured_at}`);
 } catch (error) {
  console.error(
   `[database-monitoring] ${reason} snapshot failed:`,
   error.message
  );
 } finally {
  snapshotRunning = false;
 }
}

export function startDatabaseMonitoringScheduler() {
 if (schedulerStarted) return;

 schedulerStarted = true;
 scheduleNextSnapshot();
}

function getNextMondayAtEight(fromDate = new Date()) {
 const nextRun = new Date(fromDate);
 nextRun.setHours(TARGET_HOUR, TARGET_MINUTE, TARGET_SECOND, 0);

 const currentDay = nextRun.getDay();
 let daysUntilTarget = (TARGET_DAY - currentDay + 7) % 7;

 if (daysUntilTarget === 0 && nextRun <= fromDate) {
  daysUntilTarget = 7;
 }

 nextRun.setDate(nextRun.getDate() + daysUntilTarget);

 return nextRun;
}

function scheduleNextSnapshot() {
 const nextRun = getNextMondayAtEight();
 const delayMs = Math.max(nextRun.getTime() - Date.now(), 1000);

 console.log(`[database-monitoring] next weekly snapshot scheduled at ${nextRun.toString()}`);

 schedulerTimer = setTimeout(async () => {
  await runSnapshot("scheduled");
  scheduleNextSnapshot();
 }, delayMs);

 if (typeof schedulerTimer.unref === "function") {
  schedulerTimer.unref();
 }
}
