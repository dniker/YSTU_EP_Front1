'use client';

import { useState } from 'react';
import '../../styles/CalendarPlan.css';


interface CalendarPlanFormProps {
  onSave: (data: any) => void;
  onBeforeCreate?: () => Promise<string[]>;
}

export function CalendarPlanForm({ onSave, onBeforeCreate }: CalendarPlanFormProps) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [group, setGroup] = useState('');
  const [profile, setProfile] = useState('');
  const [reg, setReg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();

    if (!title.trim() || !year.trim() || !group.trim() || !profile.trim() || !reg.trim()) {
      alert('Заполните все поля');
      return;
    }

    if (onBeforeCreate) {
      const problematic = await onBeforeCreate();
      if (problematic.length > 0) {
        alert(
          'Невозможно сформировать учебный план. Следующие дисциплины относятся к неактуальным кафедрам:\n\n' +
          problematic.join('\n')
        );
        return;
      }
    }

    setIsSubmitting(true);
    console.log('CalendarPlanForm: submitting form...');

    try {
      await onSave({
        title,
        academic_year: year,
        group,
        profile,
        reg_number: reg,
        courses: [
          { course: 1, weeks: Array(52).fill('') }
        ]
      });

      console.log('CalendarPlanForm: form submitted successfully');
      
      setTitle('');
      setYear('');
      setGroup('');
      setProfile('');
      setReg('');
    } catch (error) {
      console.error('CalendarPlanForm: submission error:', error);
      alert('Ошибка при создании плана');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input 
        placeholder="Название" 
        value={title} 
        onChange={e => setTitle(e.target.value)}
        disabled={isSubmitting}
      />
      <input 
        placeholder="Учебный год" 
        value={year} 
        onChange={e => setYear(e.target.value)}
        disabled={isSubmitting}
      />
      <input 
        placeholder="Группа" 
        value={group} 
        onChange={e => setGroup(e.target.value)}
        disabled={isSubmitting}
      />
      <input 
        placeholder="Профиль" 
        value={profile} 
        onChange={e => setProfile(e.target.value)}
        disabled={isSubmitting}
      />
      <input 
        placeholder="Рег. №" 
        value={reg} 
        onChange={e => setReg(e.target.value)}
        disabled={isSubmitting}
      />
      <button 
        className="calendar-plan__actions" 
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
