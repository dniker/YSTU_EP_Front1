'use client'

import React, { useState } from 'react'
import header from '@/styles/Header.module.css'
import { ReferenceForm } from './ReferenceForm'

interface HeaderProps {
	onNewOpenItemClick: () => void
	onSaveItemClick: () => void
	onExportEducationalPlanExcelClick: () => void // <-- добавили
	onExportEducationalPlanPdfClick: () => void
	onToggleCompetenceMatrix: () => void
	showCompetenceMatrix: boolean
	directionInfo?: string
	onExportIndicatorsTableExcelClick: () => void
}

export const Header = ({
	onNewOpenItemClick,
	onSaveItemClick,
	onExportEducationalPlanExcelClick: onExportEducationalPlanExcelClick, // <-- добавили
	onExportEducationalPlanPdfClick: onExportEducationalPlanPdfClick,
	onToggleCompetenceMatrix,
	showCompetenceMatrix,
	directionInfo,
	onExportIndicatorsTableExcelClick: onExportIndicatorsTableExcelClick
}: HeaderProps) => {
	const [showReferences, setShowReferences] = useState(false)
	const [isFileMenuHovered, setIsFileMenuHovered] = useState(false)
	const [isViewMenuHovered, setIsViewMenuHovered] = useState(false)

	return (
		<header className={header['header']}>
			<img src='/images/logo.png' alt='Логотип' className={header.logo} />

			<div className={header['file-info']}>
				<div className={header['file-name']}>
					{directionInfo || 'Новый файл...'}
				</div>

				<div className={header['file-buttons']}>
					<div
						className={header['file-menu-container']}
						onMouseEnter={() => setIsFileMenuHovered(true)}
						onMouseLeave={() => setIsFileMenuHovered(false)}
					>
						<button>Файл</button>

						{isFileMenuHovered && (
							<div className={header['file-menu']}>
								<button onClick={onNewOpenItemClick}>Открыть/создать</button>
								<button onClick={onSaveItemClick}>Сохранить</button>

								{/* <-- исправили: вызываем проп */}
								<button onClick={onExportEducationalPlanExcelClick}>Экспорт в Excel</button>
								<button onClick={onExportEducationalPlanPdfClick}>Экспорт в PDF</button>
							</div>
						)}
					</div>

					<div
						className={header['file-menu-container']}
						onMouseEnter={() => setIsViewMenuHovered(true)}
						onMouseLeave={() => setIsViewMenuHovered(false)}
					>
						<button>Вид</button>

						{isViewMenuHovered && (
							<div className={header['file-menu']}>
								<button onClick={onToggleCompetenceMatrix}>
									{showCompetenceMatrix ? 'Скрыть' : 'Показать'} матрицу компетенций
								</button>
							</div>
						)}
					</div>

					<button onClick={() => setShowReferences(!showReferences)}>
						Справочники
					</button>

					<div
						className={header['file-menu-container']}
						onMouseEnter={() => setIsFileMenuHovered(true)}
						onMouseLeave={() => setIsFileMenuHovered(false)}
					>
						<button>Индикаторы</button>

						{isFileMenuHovered && (
							<div className={header['file-menu']}>
								<button onClick={onExportIndicatorsTableExcelClick}>Экспорт в Excel</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{showReferences && (
				<ReferenceForm onClose={() => setShowReferences(false)} />
			)}
		</header>
	)
}
