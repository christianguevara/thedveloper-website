function parseRadar(radarData) {
  const matrix = Array(8)
    .fill()
    .map(() => Array(8).fill('0'))

  // Split into rows
  const rows = radarData.split('|').filter((row) => row.length > 0)

  rows.forEach((row) => {
    // Process each cell (3 characters each)
    for (let i = 0; i < row.length; i += 3) {
      const cell = row.slice(i, i + 3)
      const colCoord = cell[0].charCodeAt(0) - 97 // Convert a-h to 0-7 (columns)
      const content = cell[1]
      const rowCoord = 8 - parseInt(cell[2]) // Convert 1-8 to 7-0 (rows in reverse)

      matrix[rowCoord][colCoord] = content
    }
  })

  return matrix.map((row) => row.join(' '))
}

const radarData =
  'a01b01c01d01e01f01g01h01|a02b02c02d02e$2f02g02h02|a03b03c03d03e03f03g03h$3|a04b04c04d04e04f04g04h04|a05b05c05d05e$5f05g^5h05|a06b06c06d06e$6f06g06h06|a07b07c07d07e07f07g07h07|a08b08c08d08e08f#8g08h08|'

const result = parseRadar(radarData)

const columnHeaders =
  '  ' + Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i)).join(' ')
console.log('Radar Matrix (8x8):')
console.log(columnHeaders)
console.log('-----------------')

result.forEach((row, index) => {
  console.log(`${index + 1} ${row}`)
})

export { parseRadar }
