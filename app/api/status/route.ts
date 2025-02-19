import { NextResponse } from 'next/server'
import { setState, VALID_SYSTEMS } from '../shared/state'

export async function GET() {
  const randomSystem = VALID_SYSTEMS[Math.floor(Math.random() * VALID_SYSTEMS.length)]
  setState(randomSystem)

  return NextResponse.json({
    damaged_system: randomSystem,
  })
}
