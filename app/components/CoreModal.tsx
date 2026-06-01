'use client'

import React, { useState, useEffect } from 'react'
import modal from '@/styles/Modal.module.css'
import modalContent from '@/styles/ModalContent.module.css'
import { DirectionData, TableRow } from '@/app/types'

interface CoreModalProps {
	closeCoreModal: (e: React.MouseEvent) => void
	onAddExistingCore: (core: TableRow) => void
	onAddNewCore: (coreName: string) => void
	onAddBasedOnCore: (baseCore: TableRow, newName: string) => void // Новый обработчик
	currentDirection: DirectionData | null
}

interface Core {
	id: number
	name: string
	color?: string
	semesters_count: number
}

export const CoreModal = ({
	closeCoreModal,
	onAddExistingCore,
	onAddNewCore,
	onAddBasedOnCore, // Новый пропс
	currentDirection,
}: CoreModalProps) => {
	const [cores, setCores] = useState<Core[]>([])
	const [filteredCores, setFilteredCores] = useState<Core[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [newCoreName, setNewCoreName] = useState('')
	const [basedOnCoreName, setBasedOnCoreName] = useState('') // Новое состояние для имени нового ядра
	const [selectedCore, setSelectedCore] = useState<Core | null>(null)

	// Загрузка ядер из БД
	const fetchCores = async () => {
		setIsLoading(true)
		try {
			const response = await fetch('http://localhost:8001/map-cors/')
			if (!response.ok) throw new Error('Ошибка загрузки ядер')
			const data = await response.json()
			setCores(data)
		} catch (err) {
			console.error('Error loading cores:', err)
			setError(
				`Ошибка загрузки: ${err instanceof Error ? err.message : String(err)}`
			)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchCores()
	}, [])

	useEffect(() => {
		if (currentDirection && cores.length > 0) {
			const filtered = cores.filter(
				core => core.semesters_count === currentDirection.semesters
			)
			setFilteredCores(filtered)
		} else {
			setFilteredCores(cores)
		}
	}, [cores, currentDirection])

	const handleAddExisting = async () => {
		if (!selectedCore) return

		try {
			setIsLoading(true)
			const response = await fetch(
				`http://localhost:8001/map-cors/${selectedCore.id}/unload`
			)

			if (!response.ok) throw new Error('Ошибка загрузки данных ядра')

			const coreData = await response.json()
			onAddExistingCore(coreData) // Передаем полные данные в page.tsx
		} catch (err) {
			console.error('Ошибка загрузки ядра:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	const handleAddNew = async () => {
		if (!newCoreName.trim()) {
			setError('Введите название ядра')
			return
		}

		const exists = cores.some(
			core => core.name.toLowerCase() === newCoreName.trim().toLowerCase()
		)

		if (exists) {
			setError('Ядро с таким названием уже существует')
			return
		}

		onAddNewCore(newCoreName.trim())
		setNewCoreName('')
		await fetchCores()
		closeCoreModal({} as React.MouseEvent)
	}

	// Новый обработчик для создания на основании существующего ядра
	const handleAddBasedOn = async () => {
		if (!selectedCore || !basedOnCoreName.trim()) {
			setError('Выберите ядро и введите название')
			return
		}

		try {
			setIsLoading(true)
			const response = await fetch(
				`http://localhost:8001/map-cors/${selectedCore.id}/unload`
			)

			if (!response.ok) throw new Error('Ошибка загрузки данных ядра')

			const coreData = await response.json()
			onAddBasedOnCore(coreData, basedOnCoreName.trim())
			setBasedOnCoreName('')
			await fetchCores()
		} catch (err) {
			console.error('Ошибка загрузки ядра:', err)
			setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`)
		} finally {
			setIsLoading(false)
		}
	}

	const handleCloseClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		closeCoreModal(e)
	}

	return (
		<div className={modal['modal']}>
			<div className={modalContent['modalContent']} style={{ width: '800px' }}>
				<div className={modalContent['modalHeader']}>
					<h3>Добавить ядро</h3>
					<button
						onClick={handleCloseClick}
						className={modalContent.closeButton}
					>
						×
					</button>
				</div>

				{error && <div className={modalContent.errorMessage}>{error}</div>}

				<div className={modalContent.contentContainer}>
					{/* Раздел 1: Список существующих ядер */}
					<div className={modalContent.listColumn}>
						<div className={modalContent.scrollContainer}>
							{isLoading ? (
								<p>Загрузка ядер...</p>
							) : filteredCores.length > 0 ? (
								filteredCores.map(core => (
									<div
										key={core.id}
										className={`${modalContent.item} ${
											selectedCore?.id === core.id ? modalContent.selected : ''
										}`}
										onClick={() => setSelectedCore(core)}
									>
										{core.name}
									</div>
								))
							) : (
								<p className={modalContent.emptyState}>Нет доступных ядер</p>
							)}
						</div>
					</div>

					{/* Раздел 2: Создание нового ядра */}
					<div className={modalContent.descriptionColumn}>
						<h4>Создать новое ядро</h4>
						<div className={modalContent.formGroup}>
							<label>Название ядра:</label>
							<input
								type='text'
								value={newCoreName}
								onChange={e => setNewCoreName(e.target.value)}
								placeholder='Введите название ядра'
							/>
						</div>
						<button
							className={modalContent.addButton}
							onClick={handleAddNew}
							disabled={isLoading || !newCoreName.trim()}
						>
							Добавить новое
						</button>

						{/* Новый блок для создания на основании */}
						<div
							style={{
								marginTop: '20px',
								paddingTop: '20px',
								borderTop: '1px solid #ddd',
							}}
						>
							<h4>Создать на основании</h4>
							<div className={modalContent.formGroup}>
								<label>Название нового ядра:</label>
								<input
									type='text'
									value={basedOnCoreName}
									onChange={e => setBasedOnCoreName(e.target.value)}
									placeholder='Введите название нового ядра'
								/>
							</div>
							<button
								className={modalContent.addButton}
								onClick={handleAddBasedOn}
								disabled={isLoading || !selectedCore || !basedOnCoreName.trim()}
							>
								Создать на основании
							</button>
							<button
								className={modalContent.addButton}
								onClick={handleAddExisting}
								disabled={!selectedCore || isLoading}
								style={{ marginTop: '10px' }}
							>
								{isLoading ? 'Загрузка...' : 'Добавить из базы'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
