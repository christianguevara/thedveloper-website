import { NextResponse } from 'next/server'
import { setState, VALID_SYSTEMS } from '../shared/state'

import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  damaged_system: string
}

export async function GET(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const randomSystem = VALID_SYSTEMS[Math.floor(Math.random() * VALID_SYSTEMS.length)]
  setState(randomSystem)

  return NextResponse.json({
    damaged_system: randomSystem,
  })
}
