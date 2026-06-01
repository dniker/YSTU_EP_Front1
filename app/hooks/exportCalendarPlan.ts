import * as XLSX from 'xlsx-js-style';
import { WEEK_AUTUMN, WEEK_SPRING, WEEK_COUNT, MAX_COURSES, generateWeekDateRanges } from '../common/CalendarPlanCommon';


// Установить границы у клетки только на те стороны, которые указаны в style
function combineBorderStyles(worksheet: any, cellAddress: any, style: any)
{
  let s;
  if (!worksheet[cellAddress].s)
  {
    worksheet[cellAddress].s = {};
  }
  if (!worksheet[cellAddress].s.border)
  {
    worksheet[cellAddress].s.border = {};
  }
  s = worksheet[cellAddress].s;

  for (let key of Object.keys(style.border))
  {
    s.border[key] = style.border[key];
  }

  return s;
}

function combineAlignment(worksheet: any, cellAddress: any, alignment: any)
{
  let s;
  if (!worksheet[cellAddress].s)
  {
    worksheet[cellAddress].s = {};
  }
  if (!worksheet[cellAddress].s.alignment)
  {
    worksheet[cellAddress].s.alignment = {};
  }
  s = worksheet[cellAddress].s;

  for (let key of Object.keys(alignment.alignment))
  {
    s.alignment[key] = alignment.alignment[key];
  }

  return s;
}

function combineFont(worksheet: any, cellAddress: any, font: any)
{
  let s;
  if (!worksheet[cellAddress].s)
  {
    worksheet[cellAddress].s = {};
  }
  if (!worksheet[cellAddress].s.font)
  {
    worksheet[cellAddress].s.font = {};
  }
  s = worksheet[cellAddress].s;

  for (let key of Object.keys(font.font))
  {
    s.font[key] = font.font[key];
  }

  return s;
}



export function exportCalendarPlan(plan: any) {
  const data = plan.data;
  if (!data || !Array.isArray(data.courses)) {
    alert('Нет данных для экспорта');
    return;
  }

  // Генерируем даты для недель
  const startDate = data.start_date || `${data.academic_year}-09-01`;
  let next_academic_year = parseInt(data.academic_year) + 1;
  const endDate = data.end_date || `${next_academic_year}-08-31`;
  const weekDateRanges = generateWeekDateRanges(startDate, endDate);

  const rows: any[][] = [];

  /* ---------- Заголовок документа ---------- */
  rows.push(['КАЛЕНДАРНЫЙ УЧЕБНЫЙ ГРАФИК']);
  rows.push([`Название: ${data.title}`]);
  rows.push([`Учебный год: ${data.academic_year}`]);
  rows.push([`Группа: ${data.group}`]);
  rows.push([`Профиль: ${data.profile}`]);
  rows.push([`Регистрационный номер: ${data.reg_number}`]);
  rows.push([`Дата начала обучения: ${startDate}`]);
  rows.push([`Дата окончания обучения: ${endDate}`]);
  rows.push([]);

  let tableBeginRow = rows.length;
  /* ---------- Заголовки таблицы ---------- */
  rows.push([
    'Курс',
    'Осенний семестр',
    ...Array(WEEK_AUTUMN - 1).fill(''),
    'Весенний семестр',
    ...Array(WEEK_SPRING - 1).fill(''),
    'Теоретическое обучение, включая сессии',
    '',
    '',
    'Экзаменационные сессии',
    'Учебная практика',
    'Другие практики',
    'Преддипломная практика',
    'НИР',
    'Гос. Итог. Атт.',
    'Каникулы',
    'Всего'
  ]);
  rows.push([
    '',
    ...weekDateRanges,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  let numbersWeekAutumn = new Array(WEEK_AUTUMN);
  for (let i = 0; i < WEEK_AUTUMN; i++)
  {
    numbersWeekAutumn[i] = i + 1;
  }

  let numbersWeekSpring = new Array(WEEK_SPRING);
  for (let i = 0; i < WEEK_SPRING; i++)
  {
    numbersWeekSpring[i] = i + 1;
  }

  rows.push([
    '',
    ...numbersWeekAutumn,
    ...numbersWeekSpring,
    'О',
    'В',
    '∑',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  /* ---------- Итоги ---------- */
  const totals = {
    theoryAutumn: 0,
    theorySpring: 0,
    theoryTotal: 0,
    exams: 0,
    study: 0,
    other: 0,
    pre: 0,
    nir: 0,
    gia: 0,
    holidays: 0,
    total: 0,
  };

  /* ---------- Строки курсов ---------- */
  data.courses.forEach((course: any) => {
    const weeks = course.weeks ?? Array(WEEK_COUNT).fill('');

    const autumnWeeks = weeks.slice(0, 23);
    const springWeeks = weeks.slice(23);

    const isTheory = (w: string) => w === '' || w === 'С';
    const count = (v: string) => weeks.filter((w: string) => w === v).length;

    const theoryAutumn = autumnWeeks.filter(isTheory).length;
    const theorySpring = springWeeks.filter(isTheory).length;
    const theoryTotal = theoryAutumn + theorySpring;

    const exams = count('С');
    const study = count('У');
    const other = count('П');
    const pre = count('Д');
    const nir = count('Н');
    const gia = count('Г');
    const holidays = count('=');

    const total =
      theoryTotal + study + other + pre + nir + gia + holidays;

    // строка курса
    rows.push([
      course.course,
      ...weeks,
      theoryAutumn,
      theorySpring,
      theoryTotal,
      exams,
      study,
      other,
      pre,
      nir,
      gia,
      holidays,
      total,
    ]);

    // накопление итогов
    totals.theoryAutumn += theoryAutumn;
    totals.theorySpring += theorySpring;
    totals.theoryTotal += theoryTotal;
    totals.exams += exams;
    totals.study += study;
    totals.other += other;
    totals.pre += pre;
    totals.nir += nir;
    totals.gia += gia;
    totals.holidays += holidays;
    totals.total += total;
  });

  /* ---------- Итоговая строка ---------- */
  rows.push([
    '',
    ...Array(WEEK_COUNT).fill(''),
    totals.theoryAutumn,
    totals.theorySpring,
    totals.theoryTotal,
    totals.exams,
    totals.study,
    totals.other,
    totals.pre,
    totals.nir,
    totals.gia,
    totals.holidays,
    totals.total,
  ]);

  /* ---------- Пустая строка ---------- */
  rows.push([]);

  /* ---------- Легенда ---------- */
  rows.push(['Условные обозначения:']);
  rows.push(['С — экзаменационная сессия']);
  rows.push(['У — учебная практика']);
  rows.push(['П — производственная практика']);
  rows.push(['Д — преддипломная практика']);
  rows.push(['Г — государственная итоговая аттестация']);
  rows.push(['= — каникулы']);
  rows.push(['Н — НИР']);
  rows.push(['(пусто) — теоретическое обучение']);

  /* ---------- Excel ---------- */
  const ws = XLSX.utils.aoa_to_sheet(rows);

  let tableSpanHorizontal = 1 + WEEK_COUNT + 11;
  let tableSpanVertical = 3 + data.courses.length + 1;
  let bottomTotalColumn = tableSpanHorizontal - 11;
  let coursesCount = data.courses.length;
  let R, C;

  /* --- Изменение ширины колонок --- */

  if(!ws["!cols"]) ws["!cols"] = [];
  for (C = 0; C < tableSpanHorizontal; C++) {
    ws["!cols"][C] = {wch: 2.2};
  }
  ws["!cols"][bottomTotalColumn + 0] = {wch: 3.2};
  ws["!cols"][bottomTotalColumn + 1] = {wch: 3.2};
  ws["!cols"][bottomTotalColumn + 2] = {wch: 3.2};
  ws["!cols"][tableSpanHorizontal - 1] = {wch: 3.2};

  /* --- Изменение высоты строк --- */

  if(!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][tableBeginRow + 1] = {hpx: 100};

  /* --- Изменение выравнивания --- */

  let horizontalCenterAlignment = {
    alignment: {
      horizontal: 'center',
      wrapText: true
    }
  };
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical - 1; R++) {
    for (C = 0; C < tableSpanHorizontal; C++) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      ws[cell_address].s = combineAlignment(ws, cell_address, horizontalCenterAlignment);
    }
  }

  R = tableBeginRow + tableSpanVertical - 1;
  for (C = bottomTotalColumn; C < tableSpanHorizontal; C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, horizontalCenterAlignment);
  }

  let verticalCenterAlignment = {
    alignment: {
      vertical: 'center',
      wrapText: true
    }
  };

  R = tableBeginRow;
  C = 0;
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, verticalCenterAlignment);
  }
  for (C = WEEK_COUNT + 1; C < tableSpanHorizontal; C++)
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, verticalCenterAlignment);
  }

  R = tableBeginRow + 1;
  for (C = 1; C < WEEK_COUNT + 1; C++)
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, verticalCenterAlignment);
  }

  /* --- Поворот текста --- */

  let alignmentRotate90Degrees = {
    alignment: {
      textRotation: 90
    }
  }

  R = tableBeginRow;
  C = 0;
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, alignmentRotate90Degrees);
  }
  for (C = WEEK_COUNT + 1; C < tableSpanHorizontal; C++)
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, alignmentRotate90Degrees);
  }

  R = tableBeginRow + 1;
  for (C = 1; C < WEEK_COUNT + 1; C++)
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineAlignment(ws, cell_address, alignmentRotate90Degrees);
  }

  /* --- Изменение фонта --- */
  let smallerFont = {
    font: {
      sz: 9
    }
  };

  R = tableBeginRow;
  C = bottomTotalColumn + 3;
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineFont(ws, cell_address, smallerFont);
  }
  C = bottomTotalColumn + 6;
  {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineFont(ws, cell_address, smallerFont);
  }

  /* ---- Объединение ячеек --- **/
  // Массив диапазонов, которые нужно объединить
  // [1, 2, 3, 4],
  // 1, 2 - начальная клетка, строка 2, колонка 3 (индексы с 0),
  // 3, 4 - конечная клетка, строка 4, колонка 5
  // Координаты относительно первой ячейки таблицы - tableBeginRow, 0
  let merge = [
    [0, 0, 2, 0],
    [0, 1, 0, WEEK_AUTUMN],
    [0, WEEK_AUTUMN + 1, 0, WEEK_COUNT],
    [0, WEEK_COUNT + 1, 1, WEEK_COUNT + 3],
    [0, 4 + WEEK_COUNT, 2, 4 + WEEK_COUNT],
    [0, 5 + WEEK_COUNT, 2, 5 + WEEK_COUNT],
    [0, 6 + WEEK_COUNT, 2, 6 + WEEK_COUNT],
    [0, 7 + WEEK_COUNT, 2, 7 + WEEK_COUNT],
    [0, 8 + WEEK_COUNT, 2, 8 + WEEK_COUNT],
    [0, 9 + WEEK_COUNT, 2, 9 + WEEK_COUNT],
    [0, 10 + WEEK_COUNT, 2, 10 + WEEK_COUNT],
    [0, 11 + WEEK_COUNT, 2, 11 + WEEK_COUNT]
  ];
  let mergeJson = [];
  for (let i = 0; i < merge.length; i++)
  {
    let m = merge[i];
    let jsonInterval = { s: { r: m[0] + tableBeginRow, c: m[1] }, e: { r: m[2] + tableBeginRow, c: m[3] } };
    mergeJson.push(jsonInterval);
  }

  ws["!merges"] = mergeJson;

  /* ----- Границы у клеток ---- */
  /* Тонкие границы */
  let borderStyle = {
    border: {
      right: {
        style: "thin",
        color: { rgb: "#000000" }
      },
      left: {
        style: "thin",
        color: { rgb: "#000000" }
      },
      top: {
        style: "thin",
        color: { rgb: "#000000" }
      },
      bottom: {
        style: "thin",
        color: { rgb: "#000000" }
      }
    }
  };

  // Установить границы у всей таблицы, кроме секции "Итого" внизу
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical - 1; R++) {
    for (C = 0; C < tableSpanHorizontal; C++) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      ws[cell_address].s = combineBorderStyles(ws, cell_address, borderStyle);
    }
  }

  // Установить границы у секции "Итого" внизу
  R = tableBeginRow + tableSpanVertical - 1;
  for (C = bottomTotalColumn; C < tableSpanHorizontal; C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, borderStyle);
  }
  
  /* Толстые границы */
  let thickness = "medium";
  let thickOuterTop = {
    border: {
      top: {
        style: thickness,
        color: { rgb: "#000000" }
      }
    }
  };
  let thickOuterRight = {
    border: {
      right: {
        style: thickness,
        color: { rgb: "#000000" }
      }
    }
  };
  let thickOuterBottom = {
    border: {
      bottom: {
        style: thickness,
        color: { rgb: "#000000" }
      }
    }
  };
  let thickOuterLeft = {
    border: {
      left: {
        style: thickness,
        color: { rgb: "#000000" }
      }
    }
  };

  // Верхний край таблицы
  R = tableBeginRow;
  for (C = 0; C < tableSpanHorizontal; C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterTop);
  }

  // Правый край таблицы
  C = tableSpanHorizontal - 1;
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical; R++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterRight);
  }

  // Нижние границы
  R = tableBeginRow + tableSpanVertical - 2;
  for (C = 0; C < tableSpanHorizontal; C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterBottom);
  }

  // Нижние границы секции "Итого"
  R = tableBeginRow + tableSpanVertical - 1;
  for (C = bottomTotalColumn; C < tableSpanHorizontal; C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterBottom);
  }
  
  // Левая граница у одной клетки
  {
    const cell_address = XLSX.utils.encode_cell({
      r: tableBeginRow + tableSpanVertical - 1,
      c: bottomTotalColumn
    });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterLeft);
  }
  
  // Левые границы таблицы
  C = 0;
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical - 2; R++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterLeft);
  }

  // Граница разделения осеннего и весеннего семестров
  C = WEEK_AUTUMN;
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical - 1; R++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterRight);
  }

  // Граница разделения весеннего семестров и части с итогами
  C = WEEK_COUNT;
  for (R = tableBeginRow; R < tableBeginRow + tableSpanVertical - 1; R++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    ws[cell_address].s = combineBorderStyles(ws, cell_address, thickOuterRight);
  }

  let defaultFontStyle = {
    font: {
      name: "Arial",
      sz: 12
    }
  }

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, ws, 'Календарный график');
  XLSX.writeFile(
    workbook,
    `${'Календарный_учебный_график_' + data.group + '_' + data.academic_year || 'calendar_plan'}.xlsx`,
    { defaultCellStyle: defaultFontStyle }
  );
}
