import * as XLSX from 'xlsx-js-style';

const WEEK_COUNT = 52;

export function importCalendarPlan(
  file: File,
  onLoad: (data: any) => void
) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const buffer = e.target?.result;
    if (!buffer) return;

    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
    });

    const meta: any = {
      title: '',
      academic_year: '',
      group: '',
      profile: '',
      reg_number: '',
    };

    rows.forEach((row) => {
      if (!row[0] || typeof row[0] !== 'string') return;

      const value = row[0];

      if (value.startsWith('Название:')) {
          meta.title = value.replace('Название:', '').trim();
      }

      if (value.startsWith('Учебный год:')) {
        meta.academic_year = value.replace('Учебный год:', '').trim();
      }

      if (value.startsWith('Группа:')) {
        meta.group = value.replace('Группа:', '').trim();
      }

      if (value.startsWith('Профиль:')) {
        meta.profile = value.replace('Профиль:', '').trim();
      }

      if (value.startsWith('Регистрационный номер:')) {
        meta.reg_number = value
          .replace('Регистрационный номер:', '')
          .trim();
      }
    });

    const headerIndex = rows.findIndex(
      (r) => r[0] === 'Курс'
    );

    if (headerIndex === -1) {
      alert('Не найдена таблица календарного графика');
      return;
    }

    /** ---------- курсы ---------- */
    const courses: any[] = [];

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row[0] === 'Итого') break;

      const courseNumber = Number(row[0]);
      if (!courseNumber) continue;

      const weeks = row
        .slice(1, 1 + WEEK_COUNT)
        .map((v) =>
          typeof v === 'string' ? v.trim().toUpperCase() : ''
        );

      courses.push({
        course: courseNumber,
        weeks,
      });
    }

    if (!courses.length) {
      alert('Курсы не найдены');
      return;
    }

    /** ---------- результат ---------- */
    onLoad({
      ...meta,
      courses,
    });
  };

  reader.readAsArrayBuffer(file);
}
