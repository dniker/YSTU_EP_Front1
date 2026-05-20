'use client'

import React, { useEffect, useState } from 'react'
import modal from '@/styles/Modal.module.css'
import modalContent from '@/styles/ModalContent.module.css'
import sidebar from '@/styles/Sidebar.module.css'
import {
	DirectionData,
	EducationalLevel,
	EducationalForm,
	InitialModalProps,
} from '@/app/types'

interface Direction {
	id: number
	name: string
	educational_level_id?: number // Добавляем
	educational_form_id?: number // Добавляем
	semester_count: number
}

interface ReferenceItem {
	id: number
	name: string
}

export const InitialModal = ({
	handleInitialModalClose,
	onClose,
	educationalLevels,
	educationalForms,
}: InitialModalProps) => {
	const [directions, setDirections] = useState<Direction[]>([])
	const [selectedDirection, setSelectedDirection] = useState<Direction | null>(
		null
	)
	const [isLoading, setIsLoading] = useState(true)
	const [mode, setMode] = useState<'open' | 'create'>('open')
	const [formData, setFormData] = useState({
		name: '',
		educational_level_id: '',
		educational_form_id: '',
		semester_count: 8,
	})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			try {
				// Только загрузка направлений
				const dirResponse = await fetch('http://localhost:8001/directions/')
				if (!dirResponse.ok) throw new Error('Ошибка загрузки направлений')
				const dirData = await dirResponse.json()
				setDirections(dirData)
				if (dirData.length > 0) setSelectedDirection(dirData[0])
			} catch (err) {
				console.error('Error loading data:', err)
				setError(
					`Ошибка загрузки: ${err instanceof Error ? err.message : String(err)}`
				)
			} finally {
				setIsLoading(false)
			}
		}
		fetchData()
	}, [])

	const handleSubmit = async () => {
		if (mode === 'open' && selectedDirection) {
			try {
				setIsLoading(true)
				const response = await fetch(
					`http://localhost:8001/directions/${selectedDirection.id}/maps/unload`
				)

				if (!response.ok)
					throw new Error('Ошибка загрузки карты учебного плана')

				const mapData = await response.json()
				console.log('Загруженные данные карты:', mapData)

				// Передаем данные в родительский компонент
				handleInitialModalClose({
					directionData: {
						id: selectedDirection.id,
						name: selectedDirection.name,
						level:
							educationalLevels.find(
								l => l.id === selectedDirection.educational_level_id
							)?.name || '',
						form:
							educationalForms.find(
								f => f.id === selectedDirection.educational_form_id
							)?.name || '',
						semesters: selectedDirection.semester_count,
					},
					mapData, // Добавляем данные карты
				})
			} catch (err) {
				console.error('Ошибка при загрузке карты:', err)
				setError(err instanceof Error ? err.message : 'Ошибка загрузки карты')
			} finally {
				setIsLoading(false)
			}
		}
	}

	const handleCreateDirection = async () => {
		// Валидация полей
		if (!formData.name.trim()) {
			setError('Название направления обязательно')
			return
		}
		if (!formData.educational_level_id) {
			setError('Уровень образования обязателен')
			return
		}
		if (!formData.educational_form_id) {
			setError('Форма обучения обязательна')
			return
		}
		if (!formData.semester_count || formData.semester_count < 1 || formData.semester_count > 12) {
			setError('Количество семестров должно являться целым числом в пределах от 1 до 12')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('http://localhost:8001/directions/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name.trim(),
					educational_level_id: Number(formData.educational_level_id),
					educational_form_id: Number(formData.educational_form_id),
					semester_count: Number(formData.semester_count),
				}),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => null)
				throw new Error(errorData?.detail || 'Ошибка сохранения направления')
			}

			const newDirection = await response.json()

			// Обновляем список направлений
			const updatedRes = await fetch(
				'http://localhost:8001/directions/?expand=educational_level,educational_form'
			)
			if (updatedRes.ok) {
				const updatedData = await updatedRes.json()
				setDirections(updatedData)
				setSelectedDirection(newDirection)
				setMode('open')
				setFormData({
					name: '',
					educational_level_id: '',
					educational_form_id: '',
					semester_count: 8,
				})
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Ошибка сохранения направления'
			)
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value,
		}))
	}

	return (
		<div className={modal['modal']}>
			<div className={modalContent['modalContent']} style={{ width: '800px' }}>
				<div className={modalContent['modalHeader']}>
					<h3>Открыть/создать...</h3>
					<button onClick={onClose} className={modalContent.closeButton}>
						×
					</button>
				</div>

				{error && <div className={modalContent.errorMessage}>{error}</div>}

				{/* Кнопки выбора режима */}
				<div className={modalContent.modeButtons}>
					<button
						className={`${modalContent.modeButton} ${
							mode === 'open' ? modalContent.active : ''
						}`}
						onClick={() => setMode('open')}
					>
						Открыть
					</button>
					<button
						className={`${modalContent.modeButton} ${
							mode === 'create' ? modalContent.active : ''
						}`}
						onClick={() => setMode('create')}
					>
						Создать
					</button>
				</div>

				<div className={modalContent.contentContainer}>
					{mode === 'open' ? (
						<>
							{/* Список направлений */}
							<div className={modalContent.listColumn}>
								<div className={modalContent.scrollContainer}>
									{isLoading ? (
										<p>Загрузка направлений...</p>
									) : directions.length > 0 ? (
										directions.map(direction => (
											<div
												key={direction.id}
												className={`${modalContent.item} ${
													selectedDirection?.id === direction.id
														? modalContent.selected
														: ''
												}`}
												onClick={() => setSelectedDirection(direction)}
											>
												{direction.name}
											</div>
										))
									) : (
										<p className={modalContent.emptyState}>
											Нет доступных направлений
										</p>
									)}
								</div>
							</div>

							{/* Описание направления */}
							<div className={modalContent.descriptionColumn}>
								<h4>Информация о направлении</h4>
								{selectedDirection ? (
									<div className={modalContent.descriptionContent}>
										<p>
											<strong>Название:</strong> {selectedDirection.name}
										</p>
										<p>
											<strong>Уровень образования:</strong>{' '}
											{selectedDirection?.educational_level_id
												? educationalLevels.find(
														l => l.id === selectedDirection.educational_level_id
												  )?.name
												: 'Не указан'}
										</p>
										<p>
											<strong>Форма обучения:</strong>{' '}
											{selectedDirection?.educational_form_id
												? educationalForms.find(
														f => f.id === selectedDirection.educational_form_id
												  )?.name
												: 'Не указана'}
										</p>
										<p>
											<strong>Количество семестров:</strong>{' '}
											{selectedDirection.semester_count}
										</p>
									</div>
								) : (
									<p className={modalContent.emptyState}>
										Выберите направление
									</p>
								)}
								<button
									className={sidebar.addButton}
									onClick={handleSubmit}
									disabled={isLoading || !selectedDirection}
								>
									Открыть
								</button>
							</div>
						</>
					) : (
						/* Форма создания */
						<div className={modalContent.createForm}>
							<div className={modalContent.formGroup}>
								<label>Название:</label>
								<input
									type='text'
									name='name'
									value={formData.name}
									onChange={handleInputChange}
									placeholder='Введите название направления'
								/>
							</div>
							<div className={modalContent.formGroup}>
								<label>Уровень образования:</label>
								<select
									name='educational_level_id'
									value={formData.educational_level_id}
									onChange={handleInputChange}
								>
									<option value=''>Выберите уровень</option>
									{educationalLevels.map(level => (
										<option key={level.id} value={level.id}>
											{level.name}
										</option>
									))}
								</select>
							</div>
							<div className={modalContent.formGroup}>
								<label>Форма обучения:</label>
								<select
									name='educational_form_id'
									value={formData.educational_form_id}
									onChange={handleInputChange}
								>
									<option value=''>Выберите форму</option>
									{educationalForms.map(form => (
										<option key={form.id} value={form.id}>
											{form.name}
										</option>
									))}
								</select>
							</div>
							<div className={modalContent.formGroup}>
								<label>Количество семестров:</label>
								<input
									type='number'
									name='semester_count'
									min='1'
									value={formData.semester_count}
									onChange={handleInputChange}
								/>
							</div>
							<button
								className={modalContent.saveButton}
								onClick={handleCreateDirection}
								disabled={isLoading}
							>
								{isLoading ? 'Сохранение...' : 'Сохранить'}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
