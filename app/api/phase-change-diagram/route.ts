import { NextRequest, NextResponse } from 'next/server'

const lowestPressure = 0.05,
  // Fluid
  fluidVolume1 = 0.00105,
  // Gas
  gasVolume1 = 30,
  // Critical point
  highestPressure = 10,
  // Fluid
  fluidVolume2 = 0.0035,
  // Gas
  gasVolume2 = 0.0035

// Linear interpolation function, comes from the "pendiente" thingy in spanish or that's what I think lol
function interpolate(pressure: number, P1: number, P2: number, v1: number, v2: number): number {
  return v1 + ((pressure - P1) * (v2 - v1)) / (P2 - P1)
}

function getSpecificVolumes(pressure: number) {
  // Limits according to the Rick and Morty reference, good one!
  if (pressure >= highestPressure) {
    return { specific_volume_liquid: fluidVolume2, specific_volume_vapor: gasVolume2 }
  }
  if (pressure <= lowestPressure) {
    return { specific_volume_liquid: fluidVolume1, specific_volume_vapor: gasVolume1 }
  }

  const volumeF = interpolate(pressure, lowestPressure, highestPressure, fluidVolume1, fluidVolume2)
  const volumeG = interpolate(pressure, lowestPressure, highestPressure, gasVolume1, gasVolume2)

  return { specific_volume_liquid: volumeF, specific_volume_vapor: volumeG }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pressureParam = searchParams.get('pressure')

  // 400 if missing params or outside the ranges, that's what I understand from the diagram and T>30C
  if (!pressureParam) {
    return NextResponse.json({ error: "Missing 'pressure' parameter" }, { status: 400 })
  }

  const pressure = parseFloat(pressureParam)
  if (isNaN(pressure) || pressure < lowestPressure || pressure > highestPressure) {
    return NextResponse.json({ error: "Invalid 'pressure' value" }, { status: 400 })
  }

  const result = getSpecificVolumes(pressure)

  return NextResponse.json(result, { status: 200 })
}
