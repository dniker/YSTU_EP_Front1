'use client';

import { useState } from 'react';
import { WEEK_AUTUMN, WEEK_SPRING, WEEK_COUNT, MAX_COURSES, generateWeekDateRanges } from '../common/CalendarPlanCommon';
import { exportCalendarPlan } from '../hooks/exportCalendarPlan';
import { importCalendarPlan } from '../hooks/importCalendarPlan';

import '../../styles/CalendarPlan.css';

type Course = {
  course: number;
  weeks: string[];
};

type PlanData = {
  title: string;
  academic_year: string;
  group: string;
  profile: string;
  reg_number: string;
  start_date: string;
  end_date: string;
  courses: Course[];
};

type Props = {
  plan: any;
  onSave: (data: PlanData) => void;
};


const ALLOWED_WEEK_CODES = new Set(['', 'С', 'У', 'П', 'Д', 'Г', '=', 'Н']);
const isAllowedWeekCode = (code: string) =>
  ALLOWED_WEEK_CODES.has(String(code).toUpperCase());

function normalizePlanData(raw: any): PlanData {
  if (raw && Array.isArray(raw.courses)) {
    return {
      title: raw.title ?? '',
      academic_year: raw.academic_year ?? '',
      group: raw.group ?? '',
      profile: raw.profile ?? '',
      reg_number: raw.reg_number ?? '',
      start_date: raw.start_date ?? '',
      end_date: raw.end_date ?? '',
      courses: raw.courses.map((c: any, i: number) => ({
        course: c.course ?? i + 1,
        weeks: Array.isArray(c.weeks)
          ? c.weeks
          : Array(WEEK_COUNT).fill(''),
      })),
    };
  }

  return {
    title: '',
    academic_year: '',
    group: '',
    profile: '',
    reg_number: '',
    start_date: '',
    end_date: '',
    courses: [{ course: 1, weeks: Array(WEEK_COUNT).fill('') }],
  };
}

const count = (weeks: string[], codes: string[]) =>
  weeks.filter((w) => codes.includes(w)).length;


export function CalendarPlanGrid({ plan, onSave }: Props) {
  const [data, setData] = useState<PlanData>(
    normalizePlanData(plan?.data)
  );
  const [startDate, setStartDate] = useState(() => {
    if (data?.start_date) return data.start_date;
    let year = data?.academic_year || new Date().getFullYear();
    let default_date = `${year}-09-01`;
    if (data)
    {
      data.start_date = default_date;
    }
    return default_date;
  });
  const [endDate, setEndDate] = useState(() => {
    if (data?.end_date) return data.end_date;
    const year = data?.academic_year || new Date().getFullYear();
    const nextYear = parseInt(year) + 1;
    let default_date = `${nextYear}-08-31`;
    if (data)
    {
      data.end_date = default_date;
    }
    return default_date;
  });
  const weekDateRanges = generateWeekDateRanges(startDate, endDate);

  const courses = Array.isArray(data.courses) ? data.courses : [];

  const setCoursesCount = (n: number) => {
    const next: Course[] = [];
    for (let i = 1; i <= n; i++) {
      next.push({
        course: i,
        weeks: courses[i - 1]?.weeks ?? Array(WEEK_COUNT).fill(''),
      });
    }
    setData({ ...data, courses: next });
  };

  const updateWeek = (ci: number, wi: number, v: string) => {
    const next = courses.map((c, i) =>
      i === ci
        ? { ...c, weeks: c.weeks.map((w, j) => (j === wi ? v : w)) }
        : c
    );
    setData({ ...data, courses: next });
  };

  const handleSave = () => {
    if (!(data.title &&
          data.academic_year &&
          data.group &&
          data.profile &&
          data.reg_number &&
          data.start_date &&
          data.end_date))
    {
      alert('Заполните все обязательные поля');
      return;
    }

    onSave(data);
  };

  const totals = (() => {
  let tAutumn = 0;
  let tSpring = 0;
  let tTotal = 0;
  let exams = 0;
  let study = 0;
  let other = 0;
  let pre = 0;
  let nir = 0;
  let gia = 0;
  let holidays = 0;
  let total = 0;

  data.courses.forEach((course) => {
    const weeks = course.weeks ?? Array(WEEK_COUNT).fill('');
    const autumn = weeks.slice(0, 23);
    const spring = weeks.slice(23);

    const isTheory = (w: string) => w === '' || w === 'С';
    const count = (v: string) => weeks.filter((w) => w === v).length;

    const a = autumn.filter(isTheory).length;
    const s = spring.filter(isTheory).length;
    const th = a + s;

    const ex = count('С');
    const st = count('У');
    const ot = count('П');
    const pr = count('Д');
    const n = count('Н');
    const g = count('Г');
    const h = count('=');

    const sum =
      th + st + ot + pr + n + g + h;

    tAutumn += a;
    tSpring += s;
    tTotal += th;
    exams += ex;
    study += st;
    other += ot;
    pre += pr;
    nir += n;
    gia += g;
    holidays += h;
    total += sum;
  });

  return {
    tAutumn,
    tSpring,
    tTotal,
    exams,
    study,
    other,
    pre,
    nir,
    gia,
    holidays,
    total,
  };
})();

function calculateCourseStats(weeks: string[]) {
  const autumn = weeks.slice(0, 23);
  const spring = weeks.slice(23);

  const isTheory = (w: string) => w === '' || w === 'С';
  const count = (v: string) => weeks.filter((w) => w === v).length;

  const theoryAutumn = autumn.filter(isTheory).length;
  const theorySpring = spring.filter(isTheory).length;
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

  return {
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
  };
}

// On new date input synchronize data.start_date and state variable startDate
// for correct save and export
const handleStartDateChange = (e) =>
{
  setStartDate(e.target.value);
  setData({...data, start_date: e.target.value});
}

const handleEndDateChange = (e) =>
{
  setEndDate(e.target.value);
  setData({...data, end_date: e.target.value});
}


  return (
    <div className="calendar-plan">
      <h3>Календарный учебный график</h3>

      {/* ШАПКА */}
      <div className="calendar-plan__header">
        <label>
          Название:
          <input placeholder="Название" value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })} />
        </label>
        <label>
          Учебный год:
        <input 
          placeholder="Учебный год" 
          value={data.academic_year}
          onChange={(e) => {
            setData({ ...data, academic_year: e.target.value });
            if (e.target.value) {
              setStartDate(`${e.target.value}-09-01`);
            }
          }} 
        />
        </label>
        <label>
          Группа:
        <input placeholder="Группа" value={data.group}
          onChange={(e) => setData({ ...data, group: e.target.value })} />
        </label>
        <label>
          Профиль:
        <input placeholder="Профиль" value={data.profile}
          onChange={(e) => setData({ ...data, profile: e.target.value })} />
        </label>
        <label>
          Рег. номер:
        <input placeholder="Рег. номер" value={data.reg_number}
          onChange={(e) => setData({ ...data, reg_number: e.target.value })} />
        </label>

        <label>
          Дата начала обучения:
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => { handleStartDateChange(e); }}
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '12px' }}>
            (Если выходной день - начнётся с ближайшего понедельника)
          </small>
        </label>

        <label>
          Дата окончания обучения:
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => { handleEndDateChange(e); }}
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '12px' }}>
            (Если выходной день - обучение закончится в пятницу)
          </small>
        </label>

        <label>
          Количество курсов:
          <select value={courses.length}
            onChange={(e) => setCoursesCount(+e.target.value)}>
            {Array.from({ length: MAX_COURSES }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ТАБЛИЦА */}
      <table className="calendar-plan__table">
        <thead>
          <tr>
            <th rowSpan={2}>Курс</th>
            <th colSpan={WEEK_AUTUMN}>Осенний семестр</th>
            <th colSpan={WEEK_SPRING}>Весенний семестр</th>
            <th colSpan={3}>Теория</th>
            <th rowSpan={2}>Экз.</th>
            <th rowSpan={2}>Уч.</th>
            <th rowSpan={2}>Друг.</th>
            <th rowSpan={2}>Предд.</th>
            <th rowSpan={2}>НИР</th>
            <th rowSpan={2}>ГИА</th>
            <th rowSpan={2}>Каник.</th>
            <th rowSpan={2}>Всего</th>
          </tr>
          <tr>
            {Array.from({ length: WEEK_COUNT }, (_, i) => (
              <th key={i} title={weekDateRanges[i]} style={{ padding: '5px', writingMode: 'sideways-lr' }}>
                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.1', letterSpacing: '0.5px', fontSize: '12px' }}>
                  {weekDateRanges[i]}
                </div>
              </th>
            ))}
            <th>О</th><th>В</th><th>Σ</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((c, ci) => {
            const autumn = c.weeks.slice(0, WEEK_AUTUMN);
            const spring = c.weeks.slice(WEEK_AUTUMN);

            const theoryO = count(autumn, ['', 'С']);
            const theoryV = count(spring, ['', 'С']);

            return (
              <tr key={c.course}>
                <td>{c.course}</td>
                {c.weeks.map((w, wi) => {
                  const isInvalidWeek = w && !isAllowedWeekCode(w);
                  return (
                    <td key={wi}>
                      <input
                        className={`calendar-plan__week-input${
                          isInvalidWeek ? ' calendar-plan__week-input_invalid' : ''
                        }`}
                        value={w}
                        maxLength={1}
                        onChange={(e) =>
                          updateWeek(ci, wi, e.target.value.toUpperCase())
                        }
                      />
                    </td>
                  );
                })}
                <td className="calendar-plan__summary">{theoryO}</td>
                <td className="calendar-plan__summary">{theoryV}</td>
                <td className="calendar-plan__summary">{theoryO + theoryV}</td>
                <td>{count(c.weeks, ['С'])}</td>
                <td>{count(c.weeks, ['У'])}</td>
                <td>{count(c.weeks, ['П'])}</td>
                <td>{count(c.weeks, ['Д'])}</td>
                <td>{count(c.weeks, ['Н'])}</td>
                <td>{count(c.weeks, ['Г'])}</td>
                <td>{count(c.weeks, ['='])}</td>
                <td className="calendar-plan__summary">{WEEK_COUNT}</td>
              </tr>
            );
          })}

           <tr style={{ fontWeight: 'bold', background: '#f3f3f3' }}>
              <td>Итого</td>

              {/* пропускаем 52 недели */}
              {Array.from({ length: WEEK_COUNT }).map((_, i) => (
                <td key={i}></td>
              ))}

              <td>{totals.tAutumn}</td>
              <td>{totals.tSpring}</td>
              <td>{totals.tTotal}</td>
              <td>{totals.exams}</td>
              <td>{totals.study}</td>
              <td>{totals.other}</td>
              <td>{totals.pre}</td>
              <td>{totals.nir}</td>
              <td>{totals.gia}</td>
              <td>{totals.holidays}</td>
              <td>{totals.total}</td>
            </tr>

        </tbody>
      </table>

      {/* ЛЕГЕНДА */}
      <div className="calendar-plan__legend">
        <div>С — экзаменационная сессия</div>
        <div>У — учебная практика</div>
        <div>П — другие практики</div>
        <div>Д — преддипломная практика</div>
        <div>Н — НИР</div>
        <div>Г — ГИА</div>
        <div>= — каникулы</div>
        <div>(пусто) — теоретическое обучение</div>
      </div>

      <div className="calendar-plan__actions">
        <button onClick={() => { handleSave(); }}>
          Сохранить календарный план
        </button>
      </div>

      <div className="calendar-plan__actions">
          <button onClick={() => exportCalendarPlan({ data })}>
            Экспорт в Excel
          </button>
      </div>

      <div className="calendar-plan__actions">
          <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                importCalendarPlan(file, (importedData) => {
                  setData(importedData);
                });
              }}
            />
      </div>
    </div>
  );
}
