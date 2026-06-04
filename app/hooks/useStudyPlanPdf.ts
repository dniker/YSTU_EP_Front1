import { useCallback, useState } from 'react'
import { DirectionData, Discipline, TableRow } from '@/app/types'

type ShowAlert = (message: string) => void

interface StudyPlanReportRow {
	name: string
	department: string
	semester: number
	credits: number
	totalHours: number
	exam: boolean
	credit: boolean
	diffCredit: boolean
	courseProject: boolean
	courseWork: boolean
	rz: boolean
	rgr: boolean
	referat: boolean
	lectureHours: number
	practicalHours: number
	labHours: number
	auditoriumHours: number
}

interface PdfPage {
	imageBytes: Uint8Array
	width: number
	height: number
}

const PAGE_WIDTH = 1754
const PAGE_HEIGHT = 1240
const PDF_WIDTH = 842
const PDF_HEIGHT = 595
const PAGE_MARGIN = 40
const HEADER_HEIGHT = 82
const TITLE_HEIGHT = 58
const BODY_FONT = 15
const SMALL_FONT = 13

const columns = [
	{ key: 'name', label: 'Название дисциплины', width: 360 },
	{ key: 'department', label: 'Кафедра', width: 128 },
	{ key: 'semester', label: 'Семестр', width: 72 },
	{ key: 'credits', label: 'Зачетные единицы', width: 82 },
	{ key: 'totalHours', label: 'Всего часов', width: 86 },
	{ key: 'exam', label: 'Экзамен', width: 58, group: 'Формы контроля' },
	{ key: 'credit', label: 'Зачет', width: 58, group: 'Формы контроля' },
	{ key: 'diffCredit', label: 'Дифф. зачет', width: 68, group: 'Формы контроля' },
	{ key: 'courseProject', label: 'КП', width: 48, group: 'Формы контроля' },
	{ key: 'courseWork', label: 'КР', width: 48, group: 'Формы контроля' },
	{ key: 'rz', label: 'РЗ', width: 48, group: 'Формы контроля' },
	{ key: 'rgr', label: 'РГР', width: 50, group: 'Формы контроля' },
	{ key: 'referat', label: 'Реф.', width: 56, group: 'Формы контроля' },
	{ key: 'lectureHours', label: 'Лекции', width: 72, group: 'Часы аудиторной работы' },
	{ key: 'practicalHours', label: 'Практические', width: 92, group: 'Часы аудиторной работы' },
	{ key: 'labHours', label: 'Лабораторные', width: 92, group: 'Часы аудиторной работы' },
	{ key: 'auditoriumHours', label: 'Всего ауд.', width: 82, group: 'Часы аудиторной работы' },
] as const

const textEncoder = new TextEncoder()

const toNumber = (value: unknown) => {
	const numberValue = Number(value)
	return Number.isFinite(numberValue) ? numberValue : 0
}

const hasControl = (discipline: Discipline, matcher: (value: string) => boolean) => {
	const value = `${discipline.examType ?? ''}`.trim().toLowerCase()
	return value
		.split(/[\/,; ]+/)
		.some(part => matcher(part.replace('ё', 'е')))
}

const getReportRows = (rows: TableRow[]): StudyPlanReportRow[] => {
	const result: StudyPlanReportRow[] = []

	rows.forEach(row => {
		row.data.forEach((cell, semesterIndex) => {
			cell.forEach(discipline => {
				const credits = toNumber(discipline.credits)
				const lectureHours = toNumber(discipline.lectureHours)
				const practicalHours = toNumber(discipline.practicalHours)
				const labHours = toNumber(discipline.labHours)

				result.push({
					name: discipline.name || '',
					department:
						discipline.department ||
						discipline.department_name ||
						'',
					semester: discipline.semester || semesterIndex + 1,
					credits,
					totalHours: credits * 36,
					exam: hasControl(
						discipline,
						value => value === 'э' || value.startsWith('экз')
					),
					credit: hasControl(
						discipline,
						value => value === 'з' || value.startsWith('зач')
					),
					diffCredit: hasControl(
						discipline,
						value => value === 'д' || value.startsWith('диф')
					),
					courseProject: Boolean(discipline.hasCourseProject),
					courseWork: Boolean(discipline.hasCourseWork),
					rz: Boolean(discipline.hasRZ ?? discipline.hasCourseRZ),
					rgr: Boolean(discipline.hasRGR ?? discipline.hasCourseRGR),
					referat: Boolean(discipline.hasReferat ?? discipline.hasCourseReferat),
					lectureHours,
					practicalHours,
					labHours,
					auditoriumHours: lectureHours + practicalHours + labHours,
				})
			})
		})
	})

	return result.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name))
}

const wrapText = (
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines = 3
) => {
	const normalized = `${text}`.replace(/\s+/g, ' ').trim()
	if (!normalized) return ['']

	const words = normalized.split(' ')
	const lines: string[] = []
	let currentLine = ''

	words.forEach(word => {
		const nextLine = currentLine ? `${currentLine} ${word}` : word
		if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
			currentLine = nextLine
			return
		}

		lines.push(currentLine)
		currentLine = word
	})

	if (currentLine) lines.push(currentLine)

	if (lines.length > maxLines) {
		const visibleLines = lines.slice(0, maxLines)
		let lastLine = visibleLines[maxLines - 1]
		while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 1) {
			lastLine = lastLine.slice(0, -1)
		}
		visibleLines[maxLines - 1] = `${lastLine}...`
		return visibleLines
	}

	return lines
}

const drawCell = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	text: string,
	options: {
		fill?: string
		align?: CanvasTextAlign
		font?: string
		maxLines?: number
		bold?: boolean
	} = {}
) => {
	ctx.save()
	ctx.fillStyle = options.fill || '#ffffff'
	ctx.fillRect(x, y, width, height)
	ctx.strokeStyle = '#222222'
	ctx.lineWidth = 1
	ctx.strokeRect(x, y, width, height)
	ctx.fillStyle = '#111111'
	ctx.font = options.font || `${options.bold ? '700 ' : ''}${BODY_FONT}px Arial, sans-serif`
	ctx.textAlign = options.align || 'center'
	ctx.textBaseline = 'middle'

	const lines = wrapText(ctx, text, width - 10, options.maxLines)
	const lineHeight = options.font?.includes(`${SMALL_FONT}px`) ? 15 : 17
	const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2
	const textX =
		options.align === 'left'
			? x + 7
			: options.align === 'right'
				? x + width - 7
				: x + width / 2

	lines.forEach((line, index) => {
		ctx.fillText(line, textX, startY + index * lineHeight)
	})

	ctx.restore()
}

const getColumnValue = (row: StudyPlanReportRow, key: keyof StudyPlanReportRow) => {
	const value = row[key]
	if (typeof value === 'boolean') return value ? '+' : ''
	return `${value}`
}

const calculateRowHeight = (ctx: CanvasRenderingContext2D, row: StudyPlanReportRow) => {
	ctx.font = `${BODY_FONT}px Arial, sans-serif`
	const nameLines = wrapText(ctx, row.name, columns[0].width - 10, 4).length
	const departmentLines = wrapText(ctx, row.department, columns[1].width - 10, 3).length
	return Math.max(38, Math.max(nameLines, departmentLines) * 17 + 12)
}

const drawHeader = (ctx: CanvasRenderingContext2D, y: number) => {
	let x = PAGE_MARGIN
	const groupHeaderHeight = 34
	const columnHeaderHeight = HEADER_HEIGHT - groupHeaderHeight

	columns.forEach(column => {
		if (!column.group) {
			drawCell(
				ctx,
				x,
				y,
				column.width,
				HEADER_HEIGHT,
				column.label,
				{ fill: '#e9eef5', bold: true, maxLines: 3, font: `700 ${SMALL_FONT}px Arial, sans-serif` }
			)
		}
		x += column.width
	})

	const drawGroup = (groupName: string) => {
		const startIndex = columns.findIndex(column => column.group === groupName)
		const groupColumns = columns.filter(column => column.group === groupName)
		const startX =
			PAGE_MARGIN +
			columns.slice(0, startIndex).reduce((sum, column) => sum + column.width, 0)
		const groupWidth = groupColumns.reduce((sum, column) => sum + column.width, 0)

		drawCell(ctx, startX, y, groupWidth, groupHeaderHeight, groupName, {
			fill: '#dfe8f3',
			bold: true,
			font: `700 ${SMALL_FONT}px Arial, sans-serif`,
			maxLines: 1,
		})

		let groupX = startX
		groupColumns.forEach(column => {
			drawCell(
				ctx,
				groupX,
				y + groupHeaderHeight,
				column.width,
				columnHeaderHeight,
				column.label,
				{ fill: '#e9eef5', bold: true, maxLines: 2, font: `700 ${SMALL_FONT}px Arial, sans-serif` }
			)
			groupX += column.width
		})
	}

	drawGroup('Формы контроля')
	drawGroup('Часы аудиторной работы')
}

const drawPage = (
	rows: StudyPlanReportRow[],
	direction: DirectionData | null,
	pageNumber: number,
	totalPages: number
) => {
	const canvas = document.createElement('canvas')
	canvas.width = PAGE_WIDTH
	canvas.height = PAGE_HEIGHT
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Не удалось подготовить PDF')

	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
	ctx.fillStyle = '#111111'
	ctx.font = '700 28px Arial, sans-serif'
	ctx.textAlign = 'left'
	ctx.textBaseline = 'top'
	ctx.fillText('Учебный план', PAGE_MARGIN, 24)

	ctx.font = '16px Arial, sans-serif'
	const directionText = direction
		? `${direction.name}, ${direction.level}, ${direction.form}, ${direction.semesters} сем.`
		: 'Без выбранного направления'
	ctx.fillText(directionText, PAGE_MARGIN, 58)

	ctx.textAlign = 'right'
	ctx.fillText(`Страница ${pageNumber} из ${totalPages}`, PAGE_WIDTH - PAGE_MARGIN, 58)

	const headerY = PAGE_MARGIN + TITLE_HEIGHT
	drawHeader(ctx, headerY)

	let y = headerY + HEADER_HEIGHT
	rows.forEach((row, index) => {
		const rowHeight = calculateRowHeight(ctx, row)
		let x = PAGE_MARGIN
		const fill = index % 2 === 0 ? '#ffffff' : '#f8fafc'

		columns.forEach(column => {
			const value = getColumnValue(row, column.key)
			drawCell(ctx, x, y, column.width, rowHeight, value, {
				fill,
				align: column.key === 'name' || column.key === 'department' ? 'left' : 'center',
				maxLines: column.key === 'name' ? 4 : 3,
			})
			x += column.width
		})

		y += rowHeight
	})

	const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
	const base64 = dataUrl.split(',')[1]
	const binary = atob(base64)
	const imageBytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1) {
		imageBytes[index] = binary.charCodeAt(index)
	}

	return {
		imageBytes,
		width: canvas.width,
		height: canvas.height,
	}
}

const paginateRows = (rows: StudyPlanReportRow[]) => {
	const measureCanvas = document.createElement('canvas')
	const ctx = measureCanvas.getContext('2d')
	if (!ctx) throw new Error('Не удалось подготовить PDF')

	const availableHeight =
		PAGE_HEIGHT - PAGE_MARGIN - TITLE_HEIGHT - HEADER_HEIGHT - PAGE_MARGIN
	const pages: StudyPlanReportRow[][] = []
	let currentPage: StudyPlanReportRow[] = []
	let currentHeight = 0

	rows.forEach(row => {
		const rowHeight = calculateRowHeight(ctx, row)
		if (currentPage.length > 0 && currentHeight + rowHeight > availableHeight) {
			pages.push(currentPage)
			currentPage = []
			currentHeight = 0
		}

		currentPage.push(row)
		currentHeight += rowHeight
	})

	if (currentPage.length > 0) pages.push(currentPage)
	return pages
}

const buildPdf = (pages: PdfPage[]) => {
	const chunks: Uint8Array[] = []
	const offsets: number[] = []
	let length = 0

	const write = (value: string | Uint8Array) => {
		const bytes = typeof value === 'string' ? textEncoder.encode(value) : value
		chunks.push(bytes)
		length += bytes.length
	}

	const writeObject = (objectNumber: number, body: string | Uint8Array[]) => {
		offsets[objectNumber] = length
		write(`${objectNumber} 0 obj\n`)
		if (Array.isArray(body)) {
			body.forEach(part => write(part))
		} else {
			write(body)
		}
		write('\nendobj\n')
	}

	write('%PDF-1.4\n')

	const pageObjects = pages.map((_, index) => 3 + index * 3)
	writeObject(
		1,
		'<< /Type /Catalog /Pages 2 0 R >>'
	)
	writeObject(
		2,
		`<< /Type /Pages /Kids [${pageObjects.map(objectNumber => `${objectNumber} 0 R`).join(' ')}] /Count ${pages.length} >>`
	)

	pages.forEach((page, index) => {
		const pageObject = 3 + index * 3
		const contentObject = pageObject + 1
		const imageObject = pageObject + 2
		const imageName = `Im${index + 1}`
		const content = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/${imageName} Do\nQ`
		const contentBytes = textEncoder.encode(content)

		writeObject(
			pageObject,
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`
		)
		writeObject(
			contentObject,
			[
				textEncoder.encode(`<< /Length ${contentBytes.length} >>\nstream\n`),
				contentBytes,
				textEncoder.encode('\nendstream'),
			]
		)
		writeObject(
			imageObject,
			[
				textEncoder.encode(
					`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.imageBytes.length} >>\nstream\n`
				),
				page.imageBytes,
				textEncoder.encode('\nendstream'),
			]
		)
	})

	const xrefOffset = length
	const objectCount = 2 + pages.length * 3
	write(`xref\n0 ${objectCount + 1}\n`)
	write('0000000000 65535 f \n')
	for (let objectNumber = 1; objectNumber <= objectCount; objectNumber += 1) {
		write(`${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`)
	}
	write(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

	return new Blob(chunks, { type: 'application/pdf' })
}

const downloadBlob = (blob: Blob, filename: string) => {
	const url = window.URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	link.remove()
	window.URL.revokeObjectURL(url)
}

const getPdfFilename = (direction: DirectionData | null) => {
	const baseName = direction?.name || 'study_plan'
	const safeName = baseName
		.replace(/[\\/:*?"<>|]+/g, '_')
		.replace(/\s+/g, '_')
		.slice(0, 80)
	return `${safeName || 'study_plan'}.pdf`
}

export const useStudyPlanPdf = (showAlert: ShowAlert) => {
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

	const downloadPdf = useCallback(
		(rows: TableRow[], currentDirection: DirectionData | null) => {
			const reportRows = getReportRows(rows)
			if (reportRows.length === 0) {
				showAlert('Нет данных для формирования PDF. Добавьте дисциплины в учебный план.')
				return
			}

			setIsGeneratingPdf(true)

			try {
				const pageRows = paginateRows(reportRows)
				const renderedPages = pageRows.map((rowsOnPage, index) =>
					drawPage(rowsOnPage, currentDirection, index + 1, pageRows.length)
				)
				const pdf = buildPdf(renderedPages)
				downloadBlob(pdf, getPdfFilename(currentDirection))
				showAlert('PDF учебного плана сформирован')
			} catch (error) {
				showAlert(error instanceof Error ? error.message : 'Ошибка формирования PDF')
			} finally {
				setIsGeneratingPdf(false)
			}
		},
		[showAlert]
	)

	return { downloadPdf, isGeneratingPdf }
}
