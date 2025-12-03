// src/lib/revenue-utils.ts

export function calculateRevenueStats(records: any[]) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let todayTotal = 0;
  let monthTotal = 0;
  let allTimeTotal = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const r of records) {
    const date = new Date(r.date);
    const isToday = r.date.startsWith(today);
    const isThisMonth =
      date.getMonth() === currentMonth && date.getFullYear() === currentYear;

    allTimeTotal += r.amount;

    if (isToday) todayTotal += r.amount;
    if (isThisMonth) monthTotal += r.amount;
  }

  return {
    todayTotal,
    monthTotal,
    allTimeTotal,
  };
}
