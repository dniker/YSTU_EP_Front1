'use client';

import { useCalendarPlans } from '../hooks/useCalendarPlans';
import { CalendarPlanForm } from './CalendarPlanForm';
import { CalendarPlanGrid } from './CalendarPlanGrid';
import '../../styles/CalendarPlan.css';

type Props = {
  educationalPlanId: number;
  onBeforeCreate?: () => Promise<string[]>;
};

export function CalendarPlansTable({ educationalPlanId, onBeforeCreate }: Props) {
  const { plans, loading, error, createPlan, updatePlan, deletePlan } =
    useCalendarPlans(educationalPlanId);

  console.log('CalendarPlansTable render:', { educationalPlanId, plans, loading, error });

  return (
    <div>
      <h3
          style={{
            marginBottom: 16,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Календарный учебный график
        </h3>

      <CalendarPlanForm onSave={createPlan} onBeforeCreate={onBeforeCreate} />

      {error && (
        <div style={{ 
          color: '#d32f2f', 
          fontSize: 14, 
          marginTop: 8, 
          padding: 8,
          background: '#ffebee',
          borderRadius: 4
        }}>
          Ошибка: {error}
        </div>
      )}

      {loading && <div>Загрузка...</div>}

      {!loading && plans.length === 0 && !error && (
        <div style={{ color: '#999', fontSize: 14, marginTop: 8 }}>
          Нет календарных планов. Создайте новый план выше.
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} style={{ marginTop: 24 }}>
          <CalendarPlanGrid
            plan={plan}
            onSave={(data) => updatePlan(plan.id, data)}
          />

          <div className="calendar-plan__actions">
            <button 
              className="calendar-plan__actions" 
              onClick={() => {
                if (window.confirm('Вы уверены?')) {
                  deletePlan(plan.id);
                }
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
