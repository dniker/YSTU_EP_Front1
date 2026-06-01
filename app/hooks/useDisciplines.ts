// app/hooks/useDisciplines.ts
import { useEffect, useState, useCallback } from 'react'
import { Discipline, DisciplineBlock } from '@/app/types'

export const useDisciplines = (setRows: (rows: any) => void) => {
	const [disciplines, setDisciplines] = useState<Discipline[]>([])
	const [selectedDiscipline, setSelectedDiscipline] =
		useState<Discipline | null>(null)
	const [disciplineBlocks, setDisciplineBlocks] = useState<Record<number, DisciplineBlock[]>>({})
	const [loadingBlocks, setLoadingBlocks] = useState(false)

	useEffect(() => {
		const fetchDisciplines = async () => {
			try {
				const response = await fetch('http://localhost:8001/disciplines', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				})

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const data = await response.json()

				const departmentCache = new Map<
					number,
					{ short_name: string; name: string }
				>()

				const fetchDepartmentData = async (departmentId: number) => {
					try {
						if (departmentCache.has(departmentId)) {
							return departmentCache.get(departmentId)!
						}

						const response = await fetch(
							`http://localhost:8001/departments/${departmentId}/`
						)
						if (!response.ok) {
							return {
								short_name: 'ИСТ',
								name: 'Информационные системы и технологии',
							}
						}

						const department = await response.json()
						const departmentData = {
							short_name: department.short_name || 'ИСТ',
							name: department.name || 'Информационные системы и технологии',
						}

						departmentCache.set(departmentId, departmentData)
						return departmentData
					} catch (error) {
						console.error('Ошибка получения кафедры:', error)
						return {
							short_name: 'ИСТ',
							name: 'Информационные системы и технологии',
						}
					}
				}

				const disciplinesWithDefaults = await Promise.all(
					data.map(async (discipline: Partial<Discipline>) => {
						let departmentData = {
							short_name: 'ИСТ',
							name: 'Информационные системы и технологии',
						}

						if (discipline.department_id) {
							departmentData = await fetchDepartmentData(
								discipline.department_id
							)
						}

						return {
							table_id: discipline.table_id,
							id: discipline.id,
							discipline_id: discipline.id,
							block_id: null,
							credits: 1,
							examType: '',
							examTypeId: null,
							hasCourseProject: false,
							hasCourseWork: false,
							hasCourseRZ: false,
							hasCourseRGR: false,
							hasCourseReferat: false,
							hasPracticalWork: false,
							department_id: discipline.department_id,
							department: departmentData.short_name,
							department_name: departmentData.name,
							competenceCodes: [],
							competences: [], // <-- добавляем поле для компетенций
							lectureHours: 1,
							labHours: 1,
							practicalHours: 1,
							name: discipline.name,
							// short_name: discipline.short_name, ????
							...discipline,
						}
					})
				)

				setDisciplines(disciplinesWithDefaults)
			} catch (err) {
				console.error('Ошибка получения дисциплин: ', err)
			}
		}

		fetchDisciplines()
	}, [setRows])

	// Загрузка блоков дисциплин для ядра
	const loadDisciplineBlocks = useCallback(async (mapCoreId: number) => {
		if (!mapCoreId) return []
		
		setLoadingBlocks(true)
		try {
			const response = await fetch(`http://localhost:8001/discipline-blocks/?map_core_id=${mapCoreId}`)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			
			const blocks: DisciplineBlock[] = await response.json()
			
			// Загружаем информацию о дисциплинах для каждого блока
			const blocksWithDisciplines = await Promise.all(
				blocks.map(async (block) => {
					try {
						const disciplineResponse = await fetch(`http://localhost:8001/disciplines/${block.discipline_id}`)
						if (disciplineResponse.ok) {
							const discipline = await disciplineResponse.json()
							return { ...block, discipline }
						}
						return { ...block, discipline: null }
					} catch (err) {
						console.error(`Ошибка загрузки дисциплины ${block.discipline_id}:`, err)
						return { ...block, discipline: null }
					}
				})
			)
			
			setDisciplineBlocks(prev => ({ ...prev, [mapCoreId]: blocksWithDisciplines }))
			return blocksWithDisciplines
		} catch (err) {
			console.error('Ошибка загрузки блоков дисциплин:', err)
			return []
		} finally {
			setLoadingBlocks(false)
		}
	}, [])

	// Получение блоков для конкретного ядра
	const getDisciplineBlocks = useCallback((mapCoreId: number) => {
		return disciplineBlocks[mapCoreId] || []
	}, [disciplineBlocks])

	const handleAttributeChange = (field: keyof Discipline, value: any) => {
		if (!selectedDiscipline) return

		const updatedDisciplines = disciplines.map(disc => {
			if (disc.table_id === selectedDiscipline.table_id) {
				return { ...disc, [field]: value }
			}
			return disc
		})
		console.log('Обновленные дисциплины:', updatedDisciplines)
		setDisciplines(updatedDisciplines)
		setSelectedDiscipline(prev => prev && { ...prev, [field]: value })

		setRows((prevRows: any[]) =>
			prevRows.map(row => ({
				...row,
				data: row.data.map((cell: Discipline[]) =>
					cell.map(d =>
						d.table_id === selectedDiscipline.table_id
							? { ...d, [field]: value }
							: d
					)
				),
			}))
		)
	}

	// Обновление компетенций дисциплины
	const updateDisciplineCompetences = useCallback(async (disciplineId: number, competenceIds: number[]) => {
		try {
			// Здесь можно добавить API вызов для сохранения компетенций
			// Пока просто обновляем локальное состояние
			const updatedDisciplines = disciplines.map(disc => {
				if (disc.id === disciplineId) {
					return { ...disc, competences: competenceIds }
				}
				return disc
			})
			setDisciplines(updatedDisciplines)
			
			if (selectedDiscipline?.id === disciplineId) {
				setSelectedDiscipline(prev => prev && { ...prev, competences: competenceIds })
			}
			
			return true
		} catch (err) {
			console.error('Ошибка обновления компетенций:', err)
			return false
		}
	}, [disciplines, selectedDiscipline])

	return {
		disciplines,
		selectedDiscipline,
		setSelectedDiscipline,
		handleAttributeChange,
		disciplineBlocks,
		loadingBlocks,
		loadDisciplineBlocks,
		getDisciplineBlocks,
		updateDisciplineCompetences,
		setDisciplines,
	}
}