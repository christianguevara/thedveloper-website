import fs from 'fs/promises'

const INPUT_FILE = 'star_wars_characters_with_homeworld.txt'
const OUTPUT_FILE = 'star_wars_characters_with_holocron.txt'

async function getOracleNotes() {
  try {
    const fileContent = await fs.readFile(INPUT_FILE, 'utf-8')
    const lines = fileContent.trim().split('\n')

    const updatedLines = await Promise.all(
      lines.map(async (line) => {
        const [name, planetId] = line.split(':')
        const encodedName = encodeURIComponent(name)

        try {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const response = await fetch(
            `https://makers-challenge.altscore.ai/v1/s1/e3/resources/oracle-rolodex?name=${encodedName}`,
            {
              headers: {
                accept: 'application/json',
                'API-KEY': 'API-KEY',
              },
            }
          )

          const data = await response.json()

          if (data.oracle_notes) {
            const oracleNotes = Buffer.from(data.oracle_notes, 'base64').toString()
            return `${name}:${planetId}:${oracleNotes}`
          } else {
            return `${name}:${planetId}:error`
          }
        } catch (error) {
          console.error(`Error processing ${name}:`, error)
          return `${name}:${planetId}:error`
        }
      })
    )

    await fs.writeFile(OUTPUT_FILE, updatedLines.join('\n'))
    console.log(`Oracle notes have been added to ${OUTPUT_FILE}`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

getOracleNotes()
