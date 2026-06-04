'use client'

import React, { useState } from 'react'
import header from '@/styles/Header.module.css'
import { ReferenceForm } from './ReferenceForm'

interface HeaderProps {
	onNewOpenItemClick: () => void
	onSaveItemClick: () => void
	onExportExcelClick: () => void // <-- добавили
	onExportPdfClick: () => void
	onToggleCompetenceMatrix: () => void
	showCompetenceMatrix: boolean
	directionInfo?: string
}

export const Header = ({
	onNewOpenItemClick,
	onSaveItemClick,
	onExportExcelClick, // <-- добавили
	onExportPdfClick,
	onToggleCompetenceMatrix,
	showCompetenceMatrix,
	directionInfo,
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
								<button onClick={onExportExcelClick}>Экспорт в Excel</button>
								<button onClick={onExportPdfClick}>Экспорт в PDF</button>
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
				</div>
			</div>

			{showReferences && (
				<ReferenceForm onClose={() => setShowReferences(false)} />
			)}
		</header>
	)
}
