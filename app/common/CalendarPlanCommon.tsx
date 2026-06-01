export const WEEK_AUTUMN = 23;
export const WEEK_SPRING = 29;
export const WEEK_COUNT = 52;
export const MAX_COURSES = 6;


export function parseDateStr(dateStr: string)
{
  return dateStr.split('-').map(Number);
}

export function generateWeekDateRanges(startDateStr: string, endDateStr: string): string[] {
  const weekRanges: string[] = [];
  
  // Парсим дату правильно (игнорируя timezone issues)
  let [year, month, day] = parseDateStr(startDateStr);
  const firstDay = new Date(year, month - 1, day); // месяцы считаются с 0
  const dayOfWeekOfStartDay = firstDay.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
  [year, month, day] = parseDateStr(endDateStr);
  let lastDay = new Date(year, month - 1, day); // месяцы считаются с 0
  let dayOfWeekOfLastDay = lastDay.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
  
  const formatDate = (date: Date): string => {
    const d = date.getDate();
    let m = date.toLocaleDateString('ru-RU', { month: 'short' });
    m = m.slice(0, 3);
    return `${d} ${m}`;
  };

  const DAY_MS = 24 * 60 * 60 * 1000;
  
  //console.log(`DEBUG: startDateStr=${startDateStr}, dayOfWeek=${dayOfWeek} (0=вс, 1=пн, 2=вт)`);
  
  let lastWeekStartDay;

  // Если 1 число - суббота (6) или воскресенье (0), начинаем с понедельника
  if (dayOfWeekOfStartDay === 0 || dayOfWeekOfStartDay === 6) {
    // Пропускаем выходной день, начинаем с понедельника
    const daysToMonday = dayOfWeekOfStartDay === 0 ? 1 : 2;
    const firstMonday = new Date(firstDay.getTime() + daysToMonday * DAY_MS);
    
    // Все недели, кроме последней - полные недели пн-вс
    for (let i = 0; i < WEEK_COUNT - 1; i++) {
      const weekStart = new Date(firstMonday.getTime() + i * 7 * DAY_MS);
      const weekEnd = new Date(firstMonday.getTime() + (i * 7 + 6) * DAY_MS);
      weekRanges.push(`${formatDate(weekStart)} - ${formatDate(weekEnd)}`);
    }
    lastWeekStartDay = new Date(firstMonday.getTime() + ((WEEK_COUNT - 2) * 7 + 7) * DAY_MS);
  } else {
    // Будний день - начинаем с этого дня
    // Первая неделя: от startDate до ближайшего воскресенья
    // Дней в первой неделе: (7 - dayOfWeek + 1) или просто (8 - dayOfWeek)
    // Например: вторник (dayOfWeek=2) -> 8-2=6 дней -> до вс 7 дня включительно
    const daysToNextSunday = 8 - dayOfWeekOfStartDay; // это количество дней, включая воскресенье
    const firstWeekEnd = new Date(firstDay.getTime() + (daysToNextSunday - 1) * DAY_MS);
    
    console.log(`DEBUG: daysToNextSunday=${daysToNextSunday}, firstDay=${formatDate(firstDay)}, firstWeekEnd=${formatDate(firstWeekEnd)}`);
    
    weekRanges.push(`${formatDate(firstDay)} - ${formatDate(firstWeekEnd)}`);
    
    // Остальные недели, кроме последней - полные недели пн-вс
    const firstMonday = new Date(firstDay.getTime() + daysToNextSunday * DAY_MS);
    
    for (let i = 0; i < WEEK_COUNT - 2; i++) {
      const weekStart = new Date(firstMonday.getTime() + i * 7 * DAY_MS);
      const weekEnd = new Date(firstMonday.getTime() + (i * 7 + 6) * DAY_MS);
      weekRanges.push(`${formatDate(weekStart)} - ${formatDate(weekEnd)}`);
    }
    lastWeekStartDay = new Date(firstMonday.getTime() + ((WEEK_COUNT - 3) * 7 + 7) * DAY_MS);
  }

  let lastWeekLastDay = new Date(lastWeekStartDay.getTime() + 6 * DAY_MS);

  // Если дата окончания внутри последней недели, то последняя неделя обрежется 
  // до даты окончания. Если дата окончания снаружи последней недели, ничего
  // не произойдёт
  if (lastWeekStartDay.getTime() <= lastDay.getTime() &&
      lastDay.getTime() <= lastWeekLastDay.getTime() + DAY_MS - 1)
  {
    let lastWeekCutLastDay = lastDay;
    
    weekRanges.push(`${formatDate(lastWeekStartDay)} - ${formatDate(lastWeekCutLastDay)}`);
  }
  else
  {
    weekRanges.push(`${formatDate(lastWeekStartDay)} - ${formatDate(lastWeekLastDay)}`);
  }

  console.log(`DEBUG: первые 3 недели: ${weekRanges.slice(0, 3).join(' | ')}`);
  return weekRanges;
}