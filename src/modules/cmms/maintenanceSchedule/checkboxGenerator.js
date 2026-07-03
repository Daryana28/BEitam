import { Holiday } from "../../../models/index.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(isoWeek);

/**
 * Normalizes periodik string to type, frequency, and unit
 * @param {string} periodik 
 * @returns {object} { type, freq, unit }
 */
export const parsePeriodik = (periodik) => {
  if (!periodik) {
    return { type: "monthly", freq: 1, unit: "m" };
  }
  const str = periodik.toLowerCase().trim();

  if (str.includes("daily") || str.includes("harian")) {
    return { type: "daily", freq: 1, unit: "d" };
  }
  if (str.includes("2x/minggu") || str.includes("biweekly")) {
    return { type: "biweekly", freq: 1, unit: "w" };
  }
  if (str.includes("1x/minggu") || str.includes("1x/w") || str.includes("minggu") || str.includes("week")) {
    return { type: "weekly", freq: 1, unit: "w" };
  }
  if (str.includes("3x/bulan") || str.includes("3 bulan") || str.includes("quarter")) {
    return { type: "quarterly", freq: 1, unit: "q" };
  }
  if (str.includes("6x/bulan") || str.includes("6 bulan") || str.includes("half")) {
    return { type: "half_yearly", freq: 1, unit: "h" };
  }
  if (str.includes("1x/tahun") || str.includes("1 tahun") || str.includes("tahun") || str.includes("year")) {
    return { type: "yearly", freq: 1, unit: "y" };
  }
  // Default/fallback is monthly (1x/bulan)
  return { type: "monthly", freq: 1, unit: "m" };
};

/**
 * Cache per-year holidays to avoid repeated DB queries
 */
const holidayCache = new Map();

/**
 * Gets all holidays as a Set of YYYY-MM-DD strings (cached per year)
 * @param {number} year 
 * @returns {Promise<Set<string>>}
 */
const getHolidaysSet = async (year) => {
  if (holidayCache.has(year)) {
    return holidayCache.get(year);
  }

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  
  const holidayRows = await Holiday.findAll({
    where: {
      holiday_date: {
        [Op.between]: [start, end]
      }
    },
    raw: true
  });

  const set = new Set();
  holidayRows.forEach(h => {
    const dateStr = dayjs(h.holiday_date).format("YYYY-MM-DD");
    set.add(dateStr);
  });

  holidayCache.set(year, set);
  return set;
};

/**
 * Pre-load holidays for a year (call once before batch processing)
 */
export const warmHolidayCache = async (year) => {
  await getHolidaysSet(year);
};

/**
 * Clear holiday cache (call after mutations)
 */
export const clearHolidayCache = () => {
  holidayCache.clear();
};

/**
 * Checks if a given dayjs date is a working day (Mon-Fri and not holiday)
 * @param {dayjs.Dayjs} dateObj 
 * @param {Set<string>} holidaysSet 
 * @returns {boolean}
 */
const isWorkingDay = (dateObj, holidaysSet) => {
  const day = dateObj.day(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  
  const dateStr = dateObj.format("YYYY-MM-DD");
  return !holidaysSet.has(dateStr);
};

/**
 * Generates an array of date strings for a specific year and periodic configuration
 * @param {number} year 
 * @param {string} periodik 
 * @returns {Promise<Array<string>>} Array of YYYY-MM-DD strings
 */
export const generateCheckboxDates = async (year, periodik) => {
  const { type, freq } = parsePeriodik(periodik);
  const holidaysSet = await getHolidaysSet(year);
  const dates = [];

  if (type === "daily") {
    let current = dayjs().year(year).startOf("year");
    const endOfYear = dayjs(`${year}-12-31`);
    while (current.isBefore(endOfYear) || current.isSame(endOfYear, "day")) {
      if (isWorkingDay(current, holidaysSet)) {
        dates.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }
  } else if (type === "weekly" || type === "biweekly") {
    const totalIsoWeeks = dayjs(`${year}-12-28`).isoWeek();
    const step = type === "biweekly" ? 2 : 1;
    for (let w = 1; w <= totalIsoWeeks; w += step) {
      let current = dayjs(`${year}-01-04`).isoWeek(w).startOf('isoWeek');
      let found = false;
      for (let i = 0; i < 5; i++) {
        let testDay = current.add(i, 'day');
        if (testDay.year() === year && isWorkingDay(testDay, holidaysSet)) {
          dates.push(testDay.format("YYYY-MM-DD"));
          found = true;
          break;
        }
      }
      if (!found) {
        let testDay = current.add(3, 'day');
        if (testDay.year() === year) {
          dates.push(testDay.format("YYYY-MM-DD"));
        } else {
          dates.push(testDay.year() < year ? `${year}-01-01` : `${year}-12-31`);
        }
      }
    }
  } else if (type === "monthly") {
    // 12 months
    for (let month = 0; month < 12; month++) {
      let current = dayjs().year(year).month(month).startOf("month");
      let found = false;
      // Loop first 15 days of the month to find a working day
      for (let i = 0; i < 15; i++) {
        const testDate = current.add(i, "day");
        if (isWorkingDay(testDate, holidaysSet)) {
          dates.push(testDate.format("YYYY-MM-DD"));
          found = true;
          break;
        }
      }
      if (!found) {
        dates.push(current.format("YYYY-MM-DD")); // fallback
      }
    }
  } else if (type === "quarterly") {
    // Jan (0), Apr (3), Jul (6), Oct (9)
    const targetMonths = [0, 3, 6, 9];
    for (const month of targetMonths) {
      let current = dayjs().year(year).month(month).startOf("month");
      let found = false;
      for (let i = 0; i < 15; i++) {
        const testDate = current.add(i, "day");
        if (isWorkingDay(testDate, holidaysSet)) {
          dates.push(testDate.format("YYYY-MM-DD"));
          found = true;
          break;
        }
      }
      if (!found) {
        dates.push(current.format("YYYY-MM-DD")); // fallback
      }
    }
  } else if (type === "half_yearly") {
    // Jan (0), Jul (6)
    const targetMonths = [0, 6];
    for (const month of targetMonths) {
      let current = dayjs().year(year).month(month).startOf("month");
      let found = false;
      for (let i = 0; i < 15; i++) {
        const testDate = current.add(i, "day");
        if (isWorkingDay(testDate, holidaysSet)) {
          dates.push(testDate.format("YYYY-MM-DD"));
          found = true;
          break;
        }
      }
      if (!found) {
        dates.push(current.format("YYYY-MM-DD")); // fallback
      }
    }
  } else if (type === "yearly") {
    // Jan (0)
    let current = dayjs().year(year).month(0).startOf("month");
    let found = false;
    for (let i = 0; i < 15; i++) {
      const testDate = current.add(i, "day");
      if (isWorkingDay(testDate, holidaysSet)) {
        dates.push(testDate.format("YYYY-MM-DD"));
        found = true;
        break;
      }
    }
    if (!found) {
      dates.push(current.format("YYYY-MM-DD")); // fallback
    }
  }

  return dates;
};
