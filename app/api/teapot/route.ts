import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'

export async function GET(req: NextApiRequest, res: NextApiResponse<string>) {
  return new NextResponse('I am a teapot', { status: 418 })
}
