'use client'

import React, { useEffect, useRef, useState } from 'react'
import attributes from '@/styles/Attributes.module.css'
import { Discipline } from '@/app/types'
import { CompetenciesSetting } from '@/app/components/CompetenciesSetting'

interface AttributesPanelProps {
	selectedDiscipline: Discipline | null
	handleAttributeChange: (field: keyof Discipline, value: any) => void
	onClose: () => void
}

interface ControlType {
	id: number
	name: string
}

export const AttributesPanel = ({
	selectedDiscipline,
	handleAttributeChange,
	onClose,
}: AttributesPanelProps) => {
	const searchInputRef = useRef<HTMLDivElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const [isResizing, setIsResizing] = useState(false)
	const [panelWidth, setPanelWidth] = useState(300)
	const [controlTypes, setControlTypes] = useState<ControlType[]>([])
	const [loadingControlTypes, setLoadingControlTypes] = useState(false)
	const [creditsError, setCreditsError] = useState<string | null>(null)
	const [showCompetenciesModal, setShowCompetenciesModal] = useState(false)

	const handleNumberChange = (
		field: keyof Discipline,
		value: string,
		min: number = 0
	) => {
		const numericValue = Number(value)
		const finalValue = isNaN(numericValue) ? min : Math.max(numericValue, min)
		handleAttributeChange(field, finalValue)
	}

	const startResizing = (e: React.MouseEvent) => {
		e.preventDefault()
		setIsResizing(true)
	}

	const calculateCredits = (
		lecture: number,
		practical: number,
		lab: number
	) => {
		const totalHours = lecture + practical + lab
		// +1 делаем поскольку количество зачетных единиц не должно быть меньше 1
		const calculatedCredits = Math.floor((totalHours / 36) + 1)
		const exactValue = totalHours / 36

		if (totalHours <= 0) {
			setCreditsError('Общее количество часов должно быть больше 0')
			return false
		} else if (totalHours % 36 !== 0) {
			setCreditsError(
				`Зачетные единицы рассчитаны как ${calculatedCredits} (${exactValue.toFixed(
					2
				)} до округления)`
			)
			return false
		} else {
			setCreditsError(null)
			return true
		}
	}

	const handleHoursChange = (field: keyof Discipline, value: string) => {
		if (!selectedDiscipline) return

		const numericValue = Number(value)
		const finalValue = isNaN(numericValue) ? 0 : Math.max(numericValue, 0)

		handleAttributeChange(field, finalValue)

		const lecture =
			field === 'lectureHours' ? finalValue : selectedDiscipline.lectureHours
		const practical =
			field === 'practicalHours'
				? finalValue
				: selectedDiscipline.practicalHours
		const lab = field === 'labHours' ? finalValue : selectedDiscipline.labHours

		const isValid = calculateCredits(lecture, practical, lab)
		if (isValid) {
			const newCredits = Math.floor((lecture + practical + lab) / 36)
			handleAttributeChange('credits', newCredits)
		}
	}

	useEffect(() => {
		const fetchControlTypes = async () => {
			setLoadingControlTypes(true)
			try {
				const response = await fetch('http://localhost:8001/control-types')
				if (!response.ok) {
					throw new Error('Ошибка загрузки видов контроля')
				}
				const data: ControlType[] = await response.json()
				setControlTypes(data)
			} catch (error) {
				console.error('Ошибка при загрузке видов контроля:', error)
			} finally {
				setLoadingControlTypes(false)
			}
		}

		fetchControlTypes()
	}, [])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing || !panelRef.current) return

			const newWidth = window.innerWidth - e.clientX
			if (newWidth > 250 && newWidth < 450) {
				setPanelWidth(newWidth)
				panelRef.current.style.width = `${newWidth}px`
			}
		}

		const handleMouseUp = () => {
			setIsResizing(false)
		}

		if (isResizing) {
			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('mouseup', handleMouseUp)
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isResizing])

	useEffect(() => {
		if (selectedDiscipline) {
			const { lectureHours, labHours, practicalHours } = selectedDiscipline
			calculateCredits(lectureHours, labHours, practicalHours)
		} else {
			setCreditsError(null)
		}
	}, [selectedDiscipline]) // Зависимость от selectedDiscipline

	const isInvalidHours = selectedDiscipline
		? selectedDiscipline.lectureHours +
				selectedDiscipline.labHours +
				selectedDiscipline.practicalHours <=
		  0
		: false

	const isInvalidCredits = false

	const isInvalidCompetences = selectedDiscipline
		? selectedDiscipline.competenceCodes.length === 0
		: false

	const isInvalidDepartment = selectedDiscipline
		? !selectedDiscipline.department_name
		: false

	const getShortExamType = (name: string): string => {
		if (!name) return ''
		const normalized = name.replace(/ё/g, 'е').replace(/Ё/g, 'Е').toUpperCase()
		const result = normalized
			.split(' ')
			.map(word => word.charAt(0))
			.join('')
		return result
	}

	return (
		<aside
			className={attributes.attributes}
			ref={panelRef}
			style={{ width: `${panelWidth}px` }}
		>
			<div
				className={attributes['resize-handle']}
				onMouseDown={startResizing}
			/>

			<div className={attributes.title}>
				{selectedDiscipline
					? `Атрибуты: ${selectedDiscipline.name}`
					: 'Атрибуты дисциплин'}

				<button
					className={attributes['close-button']}
					onClick={onClose}
					aria-label='Закрыть панель атрибутов'
				>
					×
				</button>
			</div>

			<label>Виды контроля</label>

            <div>
                {controlTypes.map(type => (
                    <label
                        key={type.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                        }}
                    >
                        <input
                            type='checkbox'
                            checked={
                                selectedDiscipline?.controlTypeIds?.includes(type.id) ||
                                false
                            }
                            onChange={e => {
                                if (!selectedDiscipline) return

                                let updatedIds =
                                    selectedDiscipline.controlTypeIds || []

                                if (e.target.checked) {
                                    updatedIds = [...updatedIds, type.id]
                                } else {
                                    updatedIds = updatedIds.filter(
                                        id => id !== type.id
                                    )
                                }

                                handleAttributeChange(
                                    'controlTypeIds',
                                    updatedIds
                                )

                                const shortNames = updatedIds
                                    .map(id => {
                                        const typeObj = controlTypes.find(
                                            t => t.id === id
                                        )

                                        return getShortExamType(
                                            typeObj?.name || ''
                                        )
                                    })
                                    .join('/')

                                handleAttributeChange(
                                    'examType',
                                    shortNames
                                )
                            }}
                        />

                        {type.name}
                    </label>
                ))}
            </div>

			<label>Курсовая работа</label>
			<select
				value={selectedDiscipline?.hasCourseWork ? 'Да' : 'Нет'}
				onChange={e => {
					const hasCourseWork = e.target.value === 'Да'
					handleAttributeChange('hasCourseWork', hasCourseWork)
				}}
				disabled={!selectedDiscipline}
			>
				<option value='Нет'>Нет</option>
				<option value='Да'>Да</option>
			</select>

			<label>Часы лекционные</label>
			<input
				type='number'
				className={isInvalidHours ? attributes.invalid : ''}
				value={selectedDiscipline?.lectureHours ?? 0}
				onChange={e => handleHoursChange('lectureHours', e.target.value)}
				disabled={!selectedDiscipline}
				min='0'
			/>

			<label>Часы практические</label>
			<input
				type='number'
				className={isInvalidHours ? attributes.invalid : ''}
				value={selectedDiscipline?.practicalHours ?? 0}
				onChange={e => handleHoursChange('practicalHours', e.target.value)}
				disabled={!selectedDiscipline}
				min='0'
			/>

			<label>Часы лабораторные</label>
			<input
				type='number'
				className={isInvalidHours ? attributes.invalid : ''}
				value={selectedDiscipline?.labHours ?? 0}
				onChange={e => handleHoursChange('labHours', e.target.value)}
				disabled={!selectedDiscipline}
				min='0'
			/>

			<label>Зачётные единицы</label>
			<input
				type='number'
				className={creditsError ? attributes.invalid : ''}
				value={selectedDiscipline?.credits ?? 1}
				onChange={e => {
					const value = Math.max(1, Math.min(10, Number(e.target.value)))
					handleAttributeChange('credits', value)
					// Перепроверяем часы после ручного изменения ЗЕ
					if (selectedDiscipline) {
						const { lectureHours, labHours, practicalHours } =
							selectedDiscipline
						calculateCredits(lectureHours, labHours, practicalHours)
					}
				}}
				disabled={!selectedDiscipline}
				min='1'
				max='10'
			/>
			{creditsError && (
				<div className={attributes.errorMessage}>{creditsError}</div>
			)}

			<button
				className={attributes['competencies-button']}
				onClick={() => setShowCompetenciesModal(true)}
				disabled={!selectedDiscipline}
			>
				Компетенции
			</button>

			{showCompetenciesModal && (
				<CompetenciesSetting
					initialCompetenceIds={selectedDiscipline?.competenceCodes || []}
					onSave={competenceIds => {
						handleAttributeChange('competenceCodes', competenceIds)
						setShowCompetenciesModal(false)
					}}
					onClose={() => setShowCompetenciesModal(false)}
				/>
			)}

			{
				<button
					className={attributes['competencies-button']}
					onClick={e => {
						console.log(selectedDiscipline)
					}}
				>
					Info (console out)
				</button>
			}
		</aside>
	)
}
