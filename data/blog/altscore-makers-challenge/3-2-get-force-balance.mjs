import fs from 'fs'
import readline from 'readline'

async function calculateForceBalance() {
  const lightSideCount = {}
  const darkSideCount = {}
  const totalCount = {}

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
    totalCount[planetId] = (totalCount[planetId] || 0) + 1

    if (description.includes('Light Side')) {
      lightSideCount[planetId] = (lightSideCount[planetId] || 0) + 1
    } else if (description.includes('Dark Side')) {
      darkSideCount[planetId] = (darkSideCount[planetId] || 0) + 1
    }
  }

  console.log('Planets with Perfect Force Balance (IBF = 0):')
  console.log('-------------------------------------------')
  console.log('Planet ID | Light Side | Dark Side | Total')
  console.log('-------------------------------------------')

  for (const [planetId, total] of Object.entries(totalCount)) {
    const light = lightSideCount[planetId] || 0
    const dark = darkSideCount[planetId] || 0

    const ibf = (light - dark) / total

    // For some reason 0 was not working so adding decimals here
    if (Math.abs(ibf) < 0.000001) {
      console.log(`${planetId} | ${light} | ${dark} | ${total}`)
    }
  }
}

calculateForceBalance().catch(console.error)
