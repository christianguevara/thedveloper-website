import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest, res: NextResponse<string>) {
  return new NextResponse('I am a teapot', { status: 418 })
}
