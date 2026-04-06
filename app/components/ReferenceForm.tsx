'use client'

import React, { useState, useEffect } from 'react'
import styles from '@/styles/ReferenceForm.module.css'

interface ReferenceItem {
	id: number
	name: string

	[key: string]: any
}

interface ReferenceField {
	key: string
	label: string
	type?: 'text' | 'select'
	reference?: string
}

interface ReferenceConfig {
	name: string
	path: string
	displayName: string
	listField?: string
	titleField?: string
	fields: ReferenceField[]
}

const REFERENCES_CONFIG: ReferenceConfig[] = [
	{
		name: 'competence',
		path: '/competencies',
		displayName: 'Компетенции',
		listField: 'code',
		titleField: 'code',
		fields: [
			{ key: 'code', label: 'Код компетенции' },
			{ key: 'name', label: 'Название' },
			{ key: 'description', label: 'Описание' },
			{
				key: 'competency_group_id',
				label: 'Группа компетенций',
				type: 'select',
				reference: 'competency-group', // Указываем, что поле ссылается на справочник department
			},
		],
	},
	{
		name: 'competency-group',
		path: '/competency-groups',
		displayName: 'Группы компетенций',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'discipline',
		path: '/disciplines',
		displayName: 'Дисциплины',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{ key: 'short_name', label: 'Короткое название', type: 'text' },
			{
				key: 'department_id',
				label: 'Кафедра',
				type: 'select',
				reference: 'department', // Указываем, что поле ссылается на справочник department
			},
		],
	},
	{
		name: 'direction',
		path: '/directions',
		displayName: 'Направления подготовки',
		fields: [
			{ key: 'name', label: 'Название', type: 'text' },
			{
				key: 'educational_level_id',
				label: 'Уровень образования',
				type: 'select',
				reference: 'educational-level', // Новый справочник
			},
			{
				key: 'educational_form_id',
				label: 'Форма обучения',
				type: 'select',
				reference: 'educational-form', // Новый справочник
			},
			{ key: 'semester_count', label: 'Количество семестров', type: 'text' },
		],
	},
	{
		name: 'department',
		path: '/departments',
		displayName: 'Кафедры',
		fields: [
			{ key: 'name', label: 'Название' },
			{ key: 'short_name', label: 'Краткое название' },
		],
	},
	{
		name: 'activity-type',
		path: '/activity-types',
		displayName: 'Виды занятий',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'control-type',
		path: '/control-types',
		displayName: 'Виды контроля',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'indicator',
		path: '/indicators',
		displayName: 'Индикаторы',
		fields: [{ key: 'name', label: 'Название' }],
	},
	{
		name: 'educational-level',
		path: '/educational-levels',
		displayName: 'Уровни образования',
		fields: [{ key: 'name', label: 'Название', type: 'text' }],
	},
	{
		name: 'educational-form',
		path: '/educational-forms',
		displayName: 'Формы обучения',
		fields: [{ key: 'name', label: 'Название', type: 'text' }],
	},
]

export const ReferenceForm = ({ onClose }: { onClose: () => void }) => {
	const [selectedReference, setSelectedReference] =
		useState<ReferenceConfig | null>(null)
	const [items, setItems] = useState<ReferenceItem[]>([])
	const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null)
	const [formData, setFormData] = useState<Record<string, any>>({})
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')

	const [referenceData, setReferenceData] = useState<
		Record<string, ReferenceItem[]>
	>({})

	const fetchReferenceData = async (referenceName: string) => {
		const refConfig = REFERENCES_CONFIG.find(r => r.name === referenceName)
		if (!refConfig) return

		try {
			const response = await fetch(`http://localhost:8001${refConfig.path}/`)
			if (!response.ok)
				throw new Error(`Ошибка загрузки: ${response.statusText}`)
			const data = await response.json()
			setReferenceData(prev => ({
				...prev,
				[referenceName]: data,
			}))
		} catch (err) {
			console.error(`Error fetching ${referenceName}:`, err)
			setError(`Ошибка загрузки данных для ${refConfig.displayName}`)
		}
	}

	// Загрузка данных при выборе справочника
	useEffect(() => {
		if (!selectedReference) return

		selectedReference.fields.forEach(field => {
			if (field.type === 'select' && field.reference) {
				fetchReferenceData(field.reference)
			}
		})

		const fetchData = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await fetch(
					`http://localhost:8001${selectedReference.path}/`
				)
				if (!response.ok)
					throw new Error(`Ошибка загрузки: ${response.statusText}`)
				const data = await response.json()

				setItems(data)

				if (data.length > 0) {
					// Загружаем полные данные первого элемента
					const itemResponse = await fetch(
						`http://localhost:8001${selectedReference.path}/${data[0].id}/`
					)
					if (!itemResponse.ok)
						throw new Error(
							`Ошибка загрузки элемента: ${itemResponse.statusText}`
						)
					const itemData = await itemResponse.json()

					setSelectedItem(itemData)
					setFormData(itemData)
				} else {
					// Для пустого справочника инициализируем пустую форму
					const emptyForm = selectedReference.fields.reduce((acc, field) => {
						acc[field.key] = ''
						return acc
					}, {} as Record<string, any>)

					setSelectedItem(null)
					setFormData(emptyForm)
				}
			} catch (err) {
				console.error(`Error fetching ${selectedReference.name}:`, err)
				setError(
					`Ошибка загрузки: ${err instanceof Error ? err.message : String(err)}`
				)
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [selectedReference])

	// Обработчик выбора элемента или создания нового
	const handleItemClick = async (item: ReferenceItem | 'add') => {
		if (item === 'add') {
			// Создаем новый элемент с пустыми значениями
			const newItemData =
				selectedReference?.fields.reduce((acc, field) => {
					acc[field.key] = ''
					return acc
				}, {} as Record<string, any>) || {}

			setSelectedItem(null)
			setFormData(newItemData)
			return
		}

		setIsLoading(true)
		try {
			const response = await fetch(
				`http://localhost:8001${selectedReference!.path}/${item.id}/`
			)
			if (!response.ok) {
				const errorData = await response.json().catch(() => null)
				// Обработка 404 ошибки
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}
				throw new Error(
					errorData?.detail || `Ошибка загрузки: ${response.statusText}`
				)
			}
			const data = await response.json()

			setSelectedItem(data)
			setFormData(data)
		} catch (err) {
			console.error('Error loading item details:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		field: string
	) => {
		setFormData({
			...formData,
			[field]: e.target.value,
		})
	}

	const handleReferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const refName = e.target.value
		const ref = REFERENCES_CONFIG.find(r => r.name === refName)
		setSelectedReference(ref || null)
		setItems([])
		setSelectedItem(null)
		setFormData({})
		setSearchTerm('')
	}

	const handleSave = async () => {
		if (!selectedReference) return

		const nameValue = formData.name?.trim()
		if (!nameValue) {
			setError('Поле "Название" обязательно для заполнения')
			return
		}

		const dataToSend = { ...formData }
		Object.keys(dataToSend).forEach(key => {
			if (typeof dataToSend[key] === 'string') {
				dataToSend[key] = dataToSend[key].trim()
			}
		})

		setIsLoading(true)
		setError(null)

		try {
			let response: Response
			const url = selectedItem
				? `http://localhost:8001${selectedReference.path}/${selectedItem.id}/`
				: `http://localhost:8001${selectedReference.path}/`

			response = await fetch(url, {
				method: selectedItem ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => null)

				// Обработка 404 ошибки (для GET, PATCH, DELETE)
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}

				// Обработка 409 ошибки (конфликт)
				if (response.status === 409) {
					throw new Error(errorData?.detail || 'Конфликт данных')
				}

				// Общая обработка ошибок
				if (errorData?.detail) {
					if (Array.isArray(errorData.detail)) {
						const messages = errorData.detail.map((e: any) => e.msg).join(', ')
						throw new Error(messages)
					} else {
						throw new Error(errorData.detail)
					}
				}

				throw new Error(`Ошибка ${response.status}: ${response.statusText}`)

				//old error handling:
				// throw new Error(
				// 	errorData?.detail ||
				// 		`Ошибка ${response.status}: ${response.statusText}`
				// )
			}

			const savedItem = await response.json()
			console.log('Сохранённый элемент:', savedItem)

			// Обновляем локальное состояние
			if (selectedItem) {
				setItems(
					items.map(item => (item.id === selectedItem.id ? savedItem : item))
				)
			} else {
				// После создания нового элемента обновляем список
				const listResponse = await fetch(
					`http://localhost:8001${selectedReference.path}/`
				)
				if (listResponse.ok) {
					const updatedList = await listResponse.json()
					setItems(updatedList)
				}
			}

			setSelectedItem(savedItem)
			setFormData(savedItem)
			setSearchTerm('')
		} catch (err) {
			console.error('Error saving reference:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!selectedReference || !selectedItem) return

		if (!confirm(`Удалить выбранный элемент?`)) return

		setIsLoading(true)
		setError(null)
		try {
			const response = await fetch(
				`http://localhost:8001${selectedReference.path}/${selectedItem.id}/`,
				{
					method: 'DELETE',
				}
			)

			if (!response.ok) {
				const errorData = await response.json().catch(() => null)
				// Обработка 404 ошибки
				if (response.status === 404) {
					throw new Error(errorData?.detail || 'Элемент не найден')
				}
				throw new Error(
					errorData?.detail || `Ошибка удаления: ${response.statusText}`
				)
			}

			// Обновляем список
			const listResponse = await fetch(
				`http://localhost:8001${selectedReference.path}/`
			)
			if (listResponse.ok) {
				const updatedList = await listResponse.json()
				setItems(updatedList)

				if (updatedList.length > 0) {
					// Выбираем первый элемент из обновленного списка
					const itemResponse = await fetch(
						`http://localhost:8001${selectedReference.path}/${updatedList[0].id}/`
					)
					if (itemResponse.ok) {
						const itemData = await itemResponse.json()
						setSelectedItem(itemData)
						setFormData(itemData)
					}
				} else {
					// Если список пустой, сбрасываем состояние
					const emptyForm = selectedReference.fields.reduce((acc, field) => {
						acc[field.key] = ''
						return acc
					}, {} as Record<string, any>)

					setSelectedItem(null)
					setFormData(emptyForm)
				}
			}
		} catch (err) {
			console.error('Error deleting reference:', err)
			setError(
				`Ошибка удаления: ${err instanceof Error ? err.message : String(err)}`
			)
		} finally {
			setIsLoading(false)
		}
	}

	const filteredItems = items.filter(item =>
		item.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<>
			<div className={styles['reference-form-backdrop']} onClick={onClose} />

			<div className={styles['reference-form']}>
				<div className={styles['form-header']}>
					<h3>Редактирование справочников</h3>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div
							className={`${styles['loading-spinner']} ${
								isLoading ? styles['active'] : ''
							}`}
						/>
						<button onClick={onClose} className={styles['close-button']}>
							×
						</button>
					</div>
				</div>

				{error && <div className={styles['error-message']}>{error}</div>}

				<div className={styles['form-group']}>
					<label>Справочник:</label>
					<select
						value={selectedReference?.name || ''}
						onChange={handleReferenceChange}
						disabled={isLoading}
					>
						<option value=''>Выберите справочник</option>
						{REFERENCES_CONFIG.map(ref => (
							<option key={ref.name} value={ref.name}>
								{ref.displayName}
							</option>
						))}
					</select>
				</div>

				{selectedReference && (
					<div className={styles['form-content']}>
						<div className={styles['items-container']}>
							<div className={styles['search-container']}>
								<input
									type='text'
									placeholder='Поиск по названию...'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className={styles['search-input']}
								/>
							</div>
							<div className={styles['items-list']}>
								<div
									className={`${styles['item']} ${styles['add-item']} ${
										!selectedItem ? styles['selected'] : ''
									}`}
									onClick={() => handleItemClick('add')}
								></div>
								{filteredItems.map(item => (
									<div
										key={item.id}
										className={`${styles['item']} ${
											selectedItem?.id === item.id ? styles['selected'] : ''
										}`}
										onClick={() => handleItemClick(item)}
									>
										{item[selectedReference?.listField || 'name']}
									</div>
								))}
							</div>
						</div>

						<div className={styles['fields-container']}>
							<h4>
								{selectedItem
									? `${selectedItem[selectedReference?.titleField || 'name']}`
									: 'Новый элемент'}
							</h4>

							{selectedReference.fields.map(field => (
								<div key={field.key} className={styles['field-group']}>
									<label>{field.label}:</label>
									{field.type === 'select' && field.reference ? (
										<div className={styles['form-group']}>
											<select
												value={formData[field.key] || ''}
												onChange={e => handleInputChange(e, field.key)}
												disabled={isLoading}
											>
												<option value=''>Выберите...</option>
												{referenceData[field.reference]?.map(item => (
													<option key={item.id} value={item.id}>
														{item.name}
													</option>
												))}
											</select>
										</div>
									) : (
										<input
											type='text'
											value={formData[field.key] || ''}
											onChange={e => handleInputChange(e, field.key)}
											disabled={isLoading}
										/>
									)}
								</div>
							))}

							<div className={styles['form-actions']}>
								<button
									onClick={handleSave}
									className={styles['save-button']}
									disabled={isLoading}
								>
									{isLoading ? 'Сохранение...' : 'Сохранить'}
								</button>
								{selectedItem && (
									<button
										onClick={handleDelete}
										className={styles['delete-button']}
										disabled={isLoading}
									>
										{isLoading ? 'Удаление...' : 'Удалить'}
									</button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
