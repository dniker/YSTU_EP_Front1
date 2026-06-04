import { useState } from 'react'
import { DirectionData, TableRow, Discipline } from '@/app/types'

type SaveMapResult = { ok: true; data?: any } | { ok: false; error: string }

export const useSaveMap = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const saveMap = async (
		currentDirection: DirectionData,
		rows: TableRow[]
	): Promise<SaveMapResult> => {
		if (!currentDirection) {
			throw new Error('Направление не выбрано')
		}

		setIsLoading(true)
		setError(null)
		setSuccess(null)

		try {
			const mapCors = rows.map(row => ({
				id: row.id || null,
				name: row.name,
				semesters_count: currentDirection.semesters,
				discipline_blocks: transformRowDataToBlocks(row),
			}))

			const response = await fetch(
				`http://localhost:8001/directions/${currentDirection.id}/maps/load`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						direction_id: currentDirection.id,
						map_cors: mapCors,
					}),
				}
			)

			if (!response.ok) {
				const msg = `Ошибка сохранения: ${response.status} ${response.statusText}`
				setError(msg)
				return { ok: false, error: msg }
			}

			// 204 No Content => тело ответа отсутствует, это успех
			if (response.status === 204) {
				setSuccess('Успешно сохранено')
				return { ok: true }
			}

			// На всякий случай: если тело пустое, тоже не падаем на json()
			const text = await response.text()
			const data = text ? JSON.parse(text) : null

			setSuccess('Успешно сохранено')
			return { ok: true, data }
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Неизвестная ошибка'
			setError(msg)
			throw err
		} finally {
			setIsLoading(false)
		}
	}

	const transformRowDataToBlocks = (row: TableRow) => {
		const blocks: any[] = []

		row.data.forEach((semesterDisciplines, semesterIndex) => {
			semesterDisciplines.forEach((discipline: Discipline) => {
				blocks.push({
					discipline_id: discipline.id,
					credit_units: discipline.credits,
					control_type_id: discipline.controlTypeId,
					lecture_hours: discipline.lectureHours,
					practice_hours: discipline.practicalHours,
					lab_hours: discipline.labHours,
					semester_number: semesterIndex + 1,
					has_course_project: discipline.hasCourseProject || false,
					has_course_work: discipline.hasCourseWork || false,
					has_rz: discipline.hasRZ ?? discipline.hasCourseRZ ?? false,
					has_rgr: discipline.hasRGR ?? discipline.hasCourseRGR ?? false,
					has_referat: discipline.hasReferat ?? discipline.hasCourseReferat ?? false,
					competencies: discipline.competenceCodes?.map(id => ({ id })) || [],
				})
			})
		})

		return blocks
	}

	return { saveMap, isLoading, error, success }
}
