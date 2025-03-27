import fs from 'fs'
import readline from 'readline'

async function calculateForceBalance() {
  const lightSideCount = new Map()
  const darkSideCount = new Map()
  const totalCount = new Map()

  const fileStream = fs.createReadStream('star_wars_characters_with_holocron.txt')
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line.trim()) continue

    const parts = line.split(':')

    const [name, planetId, description] = parts

    // Increment total count for this planet
    totalCount.set(planetId, (totalCount.get(planetId) || 0) + 1)

    if (description.includes('Light Side of the Force')) {
      lightSideCount.set(planetId, (lightSideCount.get(planetId) || 0) + 1)
    } else if (description.includes('Dark Side of the Force')) {
      darkSideCount.set(planetId, (darkSideCount.get(planetId) || 0) + 1)
    }
  }

  console.log('Planets with Perfect Force Balance (IBF = 0):')
  console.log('-------------------------------------------')
  console.log('Planet ID | Light Side | Dark Side | Total')
  console.log('-------------------------------------------')

  for (const [planetId, total] of totalCount) {
    const light = lightSideCount.get(planetId) || 0
    const dark = darkSideCount.get(planetId) || 0

    const ibf = (light - dark) / total

    // For some reason 0 was not working so adding decimals here
    if (Math.abs(ibf) < 0.000001) {
      console.log(`${planetId} | ${light} | ${dark} | ${total}`)
    }
  }
}

calculateForceBalance().catch(console.error)
