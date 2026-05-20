/**
 * API Route Handler
 *
 * Этот файл выступает как единый proxy для всех API запросов.
 * Все запросы с клиента идут на /api/[...path], который перенаправляет их на бэкенд.
 *
 * Использование: вместо fetch('http://localhost:8001/endpoint')
 * используй fetch('/api/endpoint')
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'

console.log(`API Proxy initialized. Backend URL: ${BACKEND_URL}`)

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const pathSegments = params.path || []
	const endpoint = `/${pathSegments.join('/')}`
	const searchParams = request.nextUrl.searchParams
	const queryString = searchParams.toString()

	const url = queryString
		? `${BACKEND_URL}${endpoint}?${queryString}`
		: `${BACKEND_URL}${endpoint}`

	console.log(`[API GET] ${url}`)

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const data = await response.json()
		console.log(`[API GET SUCCESS] ${url} (Status: ${response.status})`)
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[API GET ERROR]', url, error)
		return NextResponse.json(
			{ error: 'Failed to fetch from backend', details: String(error) },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const pathSegments = params.path || []
	const endpoint = `/${pathSegments.join('/')}`
	let body

	try {
		body = await request.json()
	} catch (e) {
		body = {}
	}

	const url = `${BACKEND_URL}${endpoint}`

	console.log(`[API POST] ${url}`, body)

	try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        console.log('[API POST BODY]', body)

        if (response.status === 204) {
            console.log(
                `[API POST SUCCESS] ${url} (204 No Content)`
            )

            return new NextResponse(null, {
                status: 204,
            })
        }

        const data = await response.json()

        return NextResponse.json(data, {
            status: response.status,
        })
    } catch (error) {
        console.error('[API POST ERROR]', url, error)

        return NextResponse.json(
            {
                error: 'Failed to fetch from backend',
                details: String(error),
            },
            { status: 500 }
        )
    }
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const pathSegments = params.path || []
	const endpoint = `/${pathSegments.join('/')}`
	let body

	try {
		body = await request.json()
	} catch (e) {
		body = {}
	}

	const url = `${BACKEND_URL}${endpoint}`

	console.log(`[API PUT] ${url}`, body)

	try {
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		const data = await response.json()
		console.log(`[API PUT SUCCESS] ${url} (Status: ${response.status})`)
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[API PUT ERROR]', url, error)
		return NextResponse.json(
			{ error: 'Failed to fetch from backend', details: String(error) },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const pathSegments = params.path || []
	const endpoint = `/${pathSegments.join('/')}`

	const url = `${BACKEND_URL}${endpoint}`

	console.log(`[API DELETE] ${url}`)

	try {
		const response = await fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const data = response.status === 204 ? {} : await response.json()
		console.log(`[API DELETE SUCCESS] ${url} (Status: ${response.status})`)
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[API DELETE ERROR]', url, error)
		return NextResponse.json(
			{ error: 'Failed to fetch from backend', details: String(error) },
			{ status: 500 }
		)
	}
}
