import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('I am a teapot', { status: 418 })
}
