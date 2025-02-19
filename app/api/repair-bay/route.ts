import { NextResponse, NextRequest } from 'next/server'
import { getState, getSystemCode } from '../shared/state'

export async function GET(req: NextRequest, res: NextResponse<string>) {
  const currentSystem = getState()

  if (!currentSystem) {
    return new NextResponse('No damaged system reported', { status: 400 })
  }

  const systemCode = getSystemCode(currentSystem)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Repair</title>
    </head>
    <body>
        <div class="anchor-point">${systemCode}</div>
    </body>
    </html>
  `
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
