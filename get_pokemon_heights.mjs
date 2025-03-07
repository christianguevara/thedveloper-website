import { writeFileSync } from 'fs'

async function processPokemon(name, url, typeId, typeName) {
  try {
    const response = await fetch(url)
    const pokemonData = await response.json()
    const height = pokemonData.height

    const csvLine = `${name}:${typeId}:${typeName}:${height}\n`
    writeFileSync('pokemon_heights.csv', csvLine, { flag: 'a' })

    console.log(`Processed ${name}...`)
  } catch (error) {
    console.error(`Error processing ${name}:`, error.message)
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  console.log('Processing Pokemon data...')

  writeFileSync('pokemon_heights.csv', '')

  try {
    const typesJson = await import('./pokemon_types.json', { assert: { type: 'json' } }).then(
      (m) => m.default
    )

    for (const type of typesJson) {
      const { id: typeId, name: typeName, pokemon } = type
      console.log(`Processing Pokemon for type: ${typeName} (ID: ${typeId})`)

      for (const pkmn of pokemon) {
        if (pkmn.pokemon) {
          const { name, url } = pkmn.pokemon
          await processPokemon(name, url, typeId, typeName)

          await delay(200)
        }
      }
    }

    console.log('Done! --> pokemon_heights.csv')
  } catch (error) {
    console.error('Error D:', error.message)
  }
}

main()
