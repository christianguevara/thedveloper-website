import { NextResponse } from 'next/server'

export async function POST() {
  return new NextResponse('I am a teapot', { status: 418 })
}
