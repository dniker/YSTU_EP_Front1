import { useState, useEffect } from "react";
import { TableRow } from "@/app/types";

export const useTableState = (initialColumns = 8) => {
  const [columns, setColumns] = useState(initialColumns);
  const [rows, setRows] = useState<TableRow[]>([]);

  const loadFullMap = (mapData: { map_cors: any[] }) => {
    // Очищаем текущие данные
    setRows([]);

    // Загружаем каждое ядро из ответа сервера
    mapData.map_cors.forEach(core => {
      const newRow: TableRow = {
        id: core.id,
        name: core.name,
        color: "#FFFFFF", // Можно добавить цвет из данных или оставить по умолчанию
        data: Array.from({ length: columns }, () => []),
      };

      // Генератор уникальных ID для текущего ядра
      const usedIds = new Set<number>();
      const generateUniqueId = () => {
        let id;
        do {
          id = Date.now() + Math.floor(Math.random() * 1000);
        } while (usedIds.has(id));
        usedIds.add(id);
        return id;
      };

      // Заполняем дисциплины по семестрам
      core.discipline_blocks.forEach((block: any) => {
        const semesterIndex = block.semester_number - 1;
        if (semesterIndex >= 0 && semesterIndex < columns) {
          newRow.data[semesterIndex].push({
            block_id: block.id,
            table_id: generateUniqueId(),
            id: block.discipline.id,
            name: block.discipline.name,
            credits: block.credit_units,
            controlTypeId: block.control_type_id ?? null,
            examType:
                block.control_types
                    ?.map((t: any) => t.name.charAt(0))
                    .join('/') || '',
            examTypeId:
                block.control_types?.[0]?.id || null,
            hasCourseProject: block.has_course_project || false,
            hasCourseWork: block.has_course_work || false,
            hasCourseRZ: block.has_rz || false,
            hasCourseRGR: block.has_rgr || false,
            hasCourseReferat: block.has__referat || false,
            hasPracticalWork: block.practice_hours > 0,
            department_id: block.discipline.department.id,
            department: block.discipline.department.short_name,
            department_name: block.discipline.department.name,
            competenceCodes: block.competencies?.map((c: any) => c.id) || [],
            lectureHours: block.lecture_hours || 0,
            labHours: block.lab_hours || 0,
            practicalHours: block.practice_hours || 0,
            semester: block.semester_number,
          });
        }
      });

      // Добавляем ядро в таблицу
      setRows(prev => [...prev, newRow]);
    });
  };

  const initializeTable = (semesters: number) => {
    setColumns(semesters);
  };

  useEffect(() => {
    setRows((prevRows) => {
      return prevRows.map((row) => ({
        ...row,
        data: Array.from({ length: columns }, (_, colIndex) =>
          colIndex < row.data.length ? row.data[colIndex] : []
        ),
      }));
    });
  }, [columns]);

  const calculateTotalCredits = () => {
    return rows.reduce((total, row) => {
      return (
        total +
        row.data.reduce((rowTotal, cell) => {
          return (
            rowTotal +
            cell.reduce(
              (cellTotal, discipline) => cellTotal + (discipline?.credits || 0),
              0
            )
          );
        }, 0)
      );
    }, 0);
  };

  const calculateColumnCredits = () => {
    return Array.from({ length: columns }, (_, colIndex) =>
      rows.reduce((total, row) => {
        const cellData = row.data[colIndex] || [];
        return (
          total +
          cellData.reduce(
            (cellTotal, discipline) => cellTotal + (discipline?.credits || 0),
            0
          )
        );
      }, 0)
    );
  };

  const addRow = () => {
    const newCoreName = (document.getElementById("newCoreName") as HTMLInputElement)?.value || "Новое ядро";
    const newCoreColor = (document.getElementById("newCoreColor") as HTMLInputElement)?.value || "#FFFFFF";

    setRows((prev) => [
      ...prev,
      {
        id: undefined, // Новое ядро
        name: newCoreName,
        color: newCoreColor,
        data: Array.from({ length: columns }, () => []),
      },
    ]);
  };

  const handleRowDelete = (rowIndex: number) =>   {
    setRows((prevRows) => prevRows.filter((_, index) => index !== rowIndex));
  };

  const loadCoreData = (coreData: any) => {
    const newRow: TableRow = {
      id: coreData.id,
      name: coreData.name,
      color: "#FFFFFF", // Можно добавить цвет из данных или оставить по умолчанию
      data: Array.from({ length: columns }, () => []),
    };

    const usedIds = new Set<number>();
    const generateUniqueId = () => {
      let id;
      do {
        id = Date.now() + Math.floor(Math.random() * 1000);
      } while (usedIds.has(id));
      usedIds.add(id);
      return id;
    };

    coreData.discipline_blocks.forEach((block: any) => {
      const semesterIndex = block.semester_number - 1;
      if (semesterIndex >= 0 && semesterIndex < columns) {
        newRow.data[semesterIndex].push({
          block_id: block.id,
          table_id: generateUniqueId(), // Временный ID, можно заменить на реальный
          id: block.discipline.id,
          name: block.discipline.name,
          credits: block.credit_units,
          controlTypeId: block.control_type_id ?? null,
          examType:
              block.control_types
                ?.map((t: any) => t.name.charAt(0))
                .join('/') || '',
          examTypeId:
              block.control_types?.[0]?.id || null,
          hasCourseProject: false,
          hasCourseWork: false, // Можно добавить в API
          hasCourseRZ: false,
          hasCourseRGR: false,
          hasCourseReferat: false,
          hasPracticalWork: block.practice_hours > 0,
          department_id: block.discipline.department.id,
          department: block.discipline.department.short_name,
          department_name: block.discipline.department.name,
          competenceCodes: block.competencies.map((c: any) => c.id),
          lectureHours: block.lecture_hours,
          labHours: block.lab_hours,
          practicalHours: block.practice_hours,
          semester: block.semester_number,
        });
      }
    });

    setRows((prev) => [...prev, newRow]);
  };

  return {
    columns,
    rows,
    setColumns,
    setRows,
    initializeTable, // Добавляем функцию инициализации
    calculateTotalCredits,
    calculateColumnCredits,
    addRow,
    handleRowDelete,
    loadCoreData,
    loadFullMap,
  };
};