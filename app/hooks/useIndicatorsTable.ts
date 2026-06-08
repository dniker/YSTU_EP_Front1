import { useCallback, useState } from 'react'
import { DirectionData } from '@/app/types'

type ShowAlert = (message: string) => void

export const useDownloadIndicatorsTable = (showAlert: ShowAlert) => {
    const [isDownloading, setIsDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const downloadExcel = useCallback(
        async (currentDirection: DirectionData | null) => {
            if (!currentDirection) {
                showAlert('Сначала выбери направление подготовки')
                return
            }

            setIsDownloading(true)
            setError(null)

            try {
                const res = await fetch(
                    `http://localhost:8001/directions/${currentDirection.id}/indicators_table/export/excel`
                )

                if (!res.ok) {
                    throw new Error(`Ошибка экспорта: ${res.status} ${res.statusText}`)
                }

                const cd = res.headers.get('Content-Disposition') ?? ''
                const match = cd.match(/filename="(.+?)"/)
                const filename = match?.[1] || 'plan.xlsx'

                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                a.remove()

                window.URL.revokeObjectURL(url)

                showAlert('Файл Excel скачан')
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Ошибка экспорта'
                setError(msg)
                showAlert(msg)
            } finally {
                setIsDownloading(false)
            }
        },
        [showAlert]
    )

    return { downloadExcel, isDownloading, error }
}