// app/types/index.ts
export interface Discipline {
  block_id: number;
  table_id: number;
  id: number;
  name: string;
  credits: number;
  examType: string; // Будет хранить "Э", "З", "Д" и т.д.
  examTypeId: number | null; // Добавляем для хранения ID
  controlTypeId: number | null;
  hasCourseProject: boolean;
  hasCourseWork: boolean;
  hasCourseRZ: boolean;
  hasCourseRGR: boolean;
  hasCourseReferat: boolean;
  hasPracticalWork: boolean;
  department_name: string;
  department_id: number;
  department: string;
  competenceCodes: number[];
  competences?: number[]; // Массив ID компетенций (добавлено)
  lectureHours: number;
  labHours: number;
  practicalHours: number;
  semester?: number; // Добавлено
  core?: string; // Добавлено
  sourcePosition?: {
    rowIndex: number;
    colIndex: number;
  };
}

export interface TableRow {
  id?: number;
  name: string;
  color: string;
  data: Discipline[][];
}

export interface EducationalLevel {
  id: number;
  name: string;
}

export interface EducationalForm {
  id: number;
  name: string;
}

export interface DirectionData {
  id: number;
  name: string;
  level: string;
  form: string;
  semesters: number;
}

export interface InitialModalProps {
  handleInitialModalClose: (data: {
    directionData: DirectionData;
    mapData: any;
  }) => void;
  onClose: () => void;
  educationalLevels: EducationalLevel[];
  educationalForms: EducationalForm[];
}

// Новые типы для компетенций
export interface Competence {
  id: number;
  code: string;
  name: string;
  description: string;
  competency_group_id: number;
}

// Тип для группы компетенций
export interface CompetencyGroup {
  id: number;
  name: string;
}

// Тип для блока дисциплин (из бэкенда)
export interface DisciplineBlock {
  id: number;
  discipline_id: number;
  credit_units: number;
  control_type_id: number;
  lecture_hours: number;
  practice_hours: number;
  lab_hours: number;
  semester_number: number;
  map_core_id: number;
  discipline?: {
    id: number;
    name: string;
    short_name: string;
  } | null;
}

// Тип для связи блока дисциплин и компетенции
export interface DisciplineBlockCompetency {
  id: number;
  discipline_block_id: number;
  competency_id: number;
}

// Тип для агрегированных данных (фронтенд)
export interface DisciplineWithBlocks extends Discipline {
  blocks?: DisciplineBlock[];
  competence_ids?: number[];
}

// Тип для отображения матрицы компетенций
export interface CompetenceMatrixRow {
  disciplineBlockId: number;
  disciplineName: string;
  disciplineShortName: string;
  semesterNumber: number;
  creditUnits: number;
  competences: number[]; // массив ID компетенций
}

// Тип для ответа валидации
export interface ValidationResult {
  isValid: boolean;
  errors?: Array<{
    disciplineId: number;
    message: string;
  }>;
  warnings?: Array<{
    disciplineId: number;
    message: string;
  }>;
}