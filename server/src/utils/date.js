const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseDateValue = (value = new Date()) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

const startOfDay = (value = new Date()) => {
  const date = parseDateValue(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = parseDateValue(value);
  date.setDate(date.getDate() + days);
  return date;
};

const addMonths = (value, months) => {
  const date = parseDateValue(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

const diffInDays = (laterValue, earlierValue) => {
  const later = startOfDay(laterValue).getTime();
  const earlier = startOfDay(earlierValue).getTime();
  return Math.ceil((later - earlier) / MS_PER_DAY);
};

module.exports = {
  parseDateValue,
  startOfDay,
  addDays,
  addMonths,
  diffInDays
};
