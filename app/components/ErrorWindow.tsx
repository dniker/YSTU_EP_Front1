'use client'

import React from 'react'
import errorWindow from '@/styles/ErrorWindow.module.css'

type ValidationItem = {
	message: string
	severity: 'blocking' | 'warning'
	details: Record<string, any>
}

type ValidationResultType = {
	isValid: boolean
	results: ValidationItem[]
}

interface ErrorWindowProps {
	setShowValidationTab: (value: boolean) => void
	handleMouseDown: (e: React.MouseEvent) => void
	handleResizeMouseDown: (e: React.MouseEvent) => void
	position: { x: number; y: number }
	size: { width: number; height: number }

	tabRef: React.RefObject<HTMLDivElement | null>

	validationResult: ValidationResultType | null

	// checkStudyPlan: () => void;
}

export const ErrorWindow = ({
	// checkStudyPlan,
	setShowValidationTab,
	handleMouseDown,
	handleResizeMouseDown,
	tabRef,
	position,
	size,
	validationResult,
}: ErrorWindowProps) => {
	return (
		<div
			ref={tabRef}
			className={errorWindow['validation-tab']}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				width: `${size.width}px`,
				height: `${size.height}px`,
				cursor: 'grab',
			}}
			onMouseDown={handleMouseDown}
		>
			<button
				onClick={e => {
					e.stopPropagation()
					setShowValidationTab(false)
				}}
				className={errorWindow['close-tab-button']}
			>
				x
			</button>
			<h3>Результаты проверки</h3>
			<div className={errorWindow['tab-content']}>
				{!validationResult ? (
					<p>Нет данных</p>
				) : (
					<>
						<div className={errorWindow['summary']}>
							{validationResult.isValid ? (
								<span className={errorWindow['valid']}>Всё корректно</span>
							) : (
								<span className={errorWindow['invalid']}>Найдены ошибки</span>
							)}
						</div>
						<div className={errorWindow['list']}>
						  {validationResult.results
							.filter((item) => item.severity !== 'warning')  // ← скрываем warning
							.map((item, index) => (
							  <div
								key={index}
								className={`${errorWindow['card']} ${
								  item.severity === 'blocking'
									? errorWindow['blocking']
									: errorWindow['warning']
								}`}
							  >
								<div className={errorWindow['card-header']}>
								  {item.severity === 'blocking' ? 'Ошибка' : 'Предупреждение'}
								</div>
								<div className={errorWindow['card-message']}>{item.message}</div>
							  </div>
							))}
						</div>
						{/* <div className={errorWindow['list']}>
							{validationResult.results.map((item, index) => (
								<div
									key={index}
									className={`${errorWindow['card']} ${
										item.severity === 'blocking'
											? errorWindow['blocking']
											: errorWindow['warning']
									}`}
								>
									<div className={errorWindow['card-header']}>
										{item.severity === 'blocking' ? 'Ошибка' : 'Предупреждение'}
									</div>

									<div className={errorWindow['card-message']}>
										{item.message}
									</div>
								</div>
							))}
						</div> */}
					</>
				)}
			</div>
			<div
				className={errorWindow['resize-handle']}
				onMouseDown={handleResizeMouseDown}
			/>
		</div>
	)
}
