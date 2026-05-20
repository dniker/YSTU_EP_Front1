// app/page.tsx - обновленный
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import container from '@/styles/Container.module.css'
import mainContent from '@/styles/MainContent.module.css'
import table from '@/styles/Table.module.css'
import { Alert } from '@/app/components/Alert'
import { InitialModal } from '@/app/components/InitialModal'
import { Header } from '@/app/components/Header'
import { Sidebar } from '@/app/components/Sidebar'
import { SemesterTable } from '@/app/components/SemesterTable'
import { AttributesPanel } from '@/app/components/AttributesPanel'
import { CoreModal } from '@/app/components/CoreModal'
import { SaveMapModal } from '@/app/components/SaveMapModal'
import { CalendarPlansTable } from '@/app/components/CalendarPlansTable'
import { CompetenceMatrix } from '@/app/components/CompetenceMatrix'
import { ErrorWindow } from '@/app/components/ErrorWindow'

import { useDisciplines } from '@/app/hooks/useDisciplines'
import { useTableState } from '@/app/hooks/useTableState'
import { useAlert } from '@/app/hooks/useAlert'
import { useDragAndDrop } from '@/app/hooks/useDragAndDrop'
import { useDiscDelete } from './hooks/useDiscDelete'
import { useModals } from '@/app/hooks/useModals'
import { useFileOperations } from '@/app/hooks/useFileOperations'
import { useSaveMap } from '@/app/hooks/useSaveMap'
import { useDownloadMap } from '@/app/hooks/useDownloadMap'
import {
	Discipline,
	DirectionData,
	EducationalLevel,
	EducationalForm,
	DisciplineBlock,
} from '@/app/types'

const Home = () => {
    const [hasStudyPlan, setHasStudyPlan] = useState(false);
	const [currentDirection, setCurrentDirection] =
		useState<DirectionData | null>(null)
	const [educationalLevels, setEducationalLevels] = useState<
		EducationalLevel[]
	>([])
	const [educationalForms, setEducationalForms] = useState<EducationalForm[]>(
		[]
	)
	const [disciplineBlocks, setDisciplineBlocks] = useState<DisciplineBlock[]>([])
	const [showCompetenceMatrix, setShowCompetenceMatrix] = useState(true)

	const { showInitialModal, openInitialModal, closeInitialModal } =
		useFileOperations()

	const {
		columns,
		rows,
		setColumns,
		setRows,
		initializeTable,
		calculateTotalCredits,
		calculateColumnCredits,
		addRow,
		handleRowDelete,
		loadCoreData,
		loadFullMap,
	} = useTableState(currentDirection?.semesters || 8)

	const {
		disciplines,
		selectedDiscipline,
		setSelectedDiscipline,
		handleAttributeChange,
		loadDisciplineBlocks,
	} = useDisciplines(setRows)

	const { alertMessage, showAlert, closeAlert } = useAlert()

	const { downloadExcel, isDownloading: isExporting } =
		useDownloadMap(showAlert)

	const { handleDragStart, handleDrop } = useDragAndDrop(
		rows,
		setRows,
		disciplines
	)

	const { handleDisciplineDelete } = useDiscDelete(rows, setRows, disciplines)

	const { initialModal, coreModal, saveMapModal } = useModals(setColumns)

	const {
		saveMap,
		isLoading: isSaving,
		error: saveError,
		success: saveSuccess,
	} = useSaveMap()

	useEffect(() => {
		const fetchReferences = async () => {
			const [levelsRes, formsRes] = await Promise.all([
				fetch('http://localhost:8001/educational-levels/'),
				fetch('http://localhost:8001/educational-forms/'),
			])
			if (levelsRes.ok) setEducationalLevels(await levelsRes.json())
			if (formsRes.ok) setEducationalForms(await formsRes.json())
		}
		fetchReferences()
	}, [])

	useEffect(() => {
		const fetchDisciplineBlocks = async () => {
			if (currentDirection?.id) {
				const blocks = await loadDisciplineBlocks(currentDirection.id)
				setDisciplineBlocks(blocks)
			} else {
				setDisciplineBlocks([])
			}
		}
		fetchDisciplineBlocks()
	}, [currentDirection, loadDisciplineBlocks])

	const handleInitialModalClose = (data: {
		directionData: DirectionData
		mapData: any
	}) => {
        setHasStudyPlan(true);
		setCurrentDirection(data.directionData)
		initializeTable(data.directionData.semesters)
		loadFullMap(data.mapData)
		closeInitialModal()
	}

	const [isAttributesPanelVisible, setIsAttributesPanelVisible] = useState(true)

	const [validationResult, setValidationResult] = useState<any>(null)
	const [showValidationTab, setShowValidationTab] = useState(false)

	const [position, setPosition] = useState({ x: 150, y: 150 })
	const [size, setSize] = useState({ width: 400, height: 500 })
	const [isDragging, setIsDragging] = useState(false)
	const [isResizing, setIsResizing] = useState(false)
	const tabRef = useRef<HTMLDivElement>(null)
	const dragStartPos = useRef({ x: 0, y: 0 })
	const resizeStartSize = useRef({ width: 0, height: 0 })
	const resizeStartPos = useRef({ x: 0, y: 0 })

	const handleDisciplineClick = (discipline: Discipline) => {
		const actualDiscipline =
			disciplines.find(d => d.table_id === discipline.table_id) || discipline
		setSelectedDiscipline(actualDiscipline)
		setIsAttributesPanelVisible(true)
	}

	const handleMouseDown = (e: React.MouseEvent) => {
		if (
			e.button !== 0 ||
			(e.target as HTMLElement).className.includes('resize-handle')
		)
			return
		setIsDragging(true)
		dragStartPos.current = {
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		}
		if (tabRef.current) {
			tabRef.current.style.cursor = 'grabbing'
		}
	}

	const handleMouseMove = (e: MouseEvent) => {
		if (isDragging) {
			setPosition({
				x: e.clientX - dragStartPos.current.x,
				y: e.clientY - dragStartPos.current.y,
			})
		} else if (isResizing) {
			const newWidth =
				resizeStartSize.current.width + (e.clientX - resizeStartPos.current.x)
			const newHeight =
				resizeStartSize.current.height + (e.clientY - resizeStartPos.current.y)
			setSize({
				width: Math.max(300, newWidth),
				height: Math.max(200, newHeight),
			})
		}
	}

	const handleMouseUp = () => {
		setIsDragging(false)
		setIsResizing(false)
		if (tabRef.current) {
			tabRef.current.style.cursor = 'default'
		}
	}

	const handleResizeMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsResizing(true)
		resizeStartSize.current = { ...size }
		resizeStartPos.current = { x: e.clientX, y: e.clientY }
		if (tabRef.current) {
			tabRef.current.style.cursor = 'nwse-resize'
		}
	}

	const checkStudyPlan = () => {
		// Проверяем, загружена ли карта и есть ли в ней ядра
		if (!rows || rows.length === 0) {
			showAlert('Нет данных для проверки. Откройте или создайте учебный план.');
			return;
		}

		// Проверяем, есть ли хотя бы одна дисциплина в строках
		const hasDisciplines = rows.some(row => row.data.some(cell => cell.length > 0));

		if (!hasDisciplines) {
			showAlert('Нет данных для проверки. Добавьте дисциплины в учебный план.');
			return;
		}
		fetch('http://localhost:8001/validations/validate-up', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(rows),
		})
			.then(response => response.json())
			.then(data => {
				showAlert(
					data.isValid
						? 'Данные валидны! Ошибок не найдено'
						: 'Данные не валидны! Найдены ошибки в плане обучения.'
				)

				setValidationResult(data)
				setShowValidationTab(true)
			})
			.catch(error => {
				showAlert(error)
				setValidationResult({ error: error.message })
				setShowValidationTab(true)
			})
	}

	useEffect(() => {
		if (isDragging || isResizing) {
			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('mouseup', handleMouseUp)
		} else {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging, isResizing])

	const handleSaveClick = () => {
		if (!currentDirection) {
			showAlert(
				'Для сохранения карты учебного плана необходимо выбрать направление подготовки'
			)
		} else {
			saveMapModal.openModal()
		}
	}

	const handleSaveMap = async () => {
		try {
			if (!currentDirection) {
				throw new Error('Направление не выбрано')
			}

			await saveMap(currentDirection, rows)
			saveMapModal.closeModal()
			showAlert(saveSuccess ?? 'Карта учебного плана успешно сохранена')
		} catch (err) {
			showAlert(err instanceof Error ? err.message : 'Ошибка сохранения')
		}
	}

	const handleSaveMapInfo = () => {
		showAlert(
			'Сохранение создает новую версию карты учебного плана для выбранного направления'
		)
	}

	return (
		<div className={container['container']}>
			<Head>
				<title>Учебный план</title>
			</Head>

			<Alert message={alertMessage} onClose={closeAlert} />

			{showInitialModal && (
				<InitialModal
					handleInitialModalClose={handleInitialModalClose}
					onClose={closeInitialModal}
					educationalLevels={educationalLevels}
					educationalForms={educationalForms}
				/>
			)}

			<Header
				onNewOpenItemClick={openInitialModal}
				onSaveItemClick={handleSaveClick}
				onExportExcelClick={() => downloadExcel(currentDirection)}
				onToggleCompetenceMatrix={() => setShowCompetenceMatrix(!showCompetenceMatrix)}
				showCompetenceMatrix={showCompetenceMatrix}
				directionInfo={
					currentDirection
						? `${currentDirection.name}, ${currentDirection.level}, ${currentDirection.form}, ${currentDirection.semesters} сем.`
						: undefined
				}
			/>

			<div className={mainContent['main-content']}>
				<Sidebar
                    hasStudyPlan={hasStudyPlan}
					checkStudyPlan={checkStudyPlan}
					disciplines={disciplines}
					selectedDiscipline={selectedDiscipline}
					handleDragStart={handleDragStart}
				/>

				{showValidationTab && (
					<ErrorWindow
						tabRef={tabRef}
						position={position}
						size={size}
						setShowValidationTab={setShowValidationTab}
						validationResult={validationResult}
						handleMouseDown={handleMouseDown}
						handleResizeMouseDown={handleResizeMouseDown}
					/>
				)}

				<div className={table['content-wrapper']}>
					<main className={table.main}>
						<SemesterTable
							columns={columns}
							rows={rows}
							selectedDiscipline={selectedDiscipline ?? undefined}
							handleDisciplineClick={handleDisciplineClick}
							handleDragStart={handleDragStart}
							handleDrop={handleDrop}
							calculateTotalCredits={calculateTotalCredits}
							calculateColumnCredits={calculateColumnCredits}
							openCoreModal={() => {
								if (!currentDirection) {
									showAlert(
										'Для работы с картой учебного плана необходимо выбрать направление подготовки'
									)
								} else {
									coreModal.openModal()
								}
							}}
							handleDisciplineDelete={handleDisciplineDelete}
							handleRowDelete={handleRowDelete}
						/>

						{currentDirection && (
							<div
								style={{
									marginTop: 24,
									width: '100%',
									padding: 24,
									background: '#ffffff',
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
									overflowX: 'auto',
								}}
							>
								<CalendarPlansTable educationalPlanId={currentDirection.id} />
							</div>
						)}

						{showCompetenceMatrix && currentDirection && disciplineBlocks.length >= 0 && (
							<CompetenceMatrix
								disciplineBlocks={disciplineBlocks}
								readOnly={false}
							/>
						)}
					</main>
				</div>

				{isAttributesPanelVisible && selectedDiscipline && (
					<AttributesPanel
						selectedDiscipline={selectedDiscipline}
						handleAttributeChange={handleAttributeChange}
						onClose={() => setIsAttributesPanelVisible(false)}
					/>
				)}
			</div>

			<button onClick={() => console.log(disciplines)} style={{ display: '' }}>
				кликкк
			</button>

			{saveMapModal.isOpen && (
				<SaveMapModal
					isOpen={saveMapModal.isOpen}
					onClose={saveMapModal.closeModal}
					onSave={handleSaveMap}
					onInfo={handleSaveMapInfo}
					isLoading={isSaving}
					error={saveError}
				/>
			)}

			{coreModal.isOpen && (
				<CoreModal
					closeCoreModal={e => coreModal.closeModal()}
					onAddExistingCore={coreData => {
						loadCoreData(coreData)
						coreModal.closeModal()
					}}
					onAddNewCore={coreName => {
						setRows(prev => [
							...prev,
							{
								id: undefined,
								name: coreName,
								color: '#FFFFFF',
								data: Array.from({ length: columns }, () => []),
							},
						])
						coreModal.closeModal()
					}}
					onAddBasedOnCore={(baseCore, newName) => {
						const newCore = {
							...baseCore,
							id: undefined,
							name: newName,
						}
						loadCoreData(newCore)
						coreModal.closeModal()
					}}
					currentDirection={currentDirection}
				/>
			)}
		</div>
	)
}

export default Home