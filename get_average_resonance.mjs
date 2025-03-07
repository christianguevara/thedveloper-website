const TOTAL_PAGES = 34 // TODO: check this is response is invalid

async function calculateAverageResonance() {
  let totalResonance = 0
  let totalItems = 0

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`Fetching page ${page} of ${TOTAL_PAGES}...`)

    const response = await fetch(
      `https://makers-challenge.altscore.ai/v1/s1/e2/resources/stars?page=${page}&sort-by=resonance&sort-direction=desc`,
      {
        headers: {
          accept: 'application/json',
          'API-KEY': '67fabed9219e474bbeaf380480235c83',
        },
      }
    )

    const data = await response.json()
    const pageResonance = data.reduce((sum, item) => sum + item.resonance, 0)

    totalResonance += pageResonance
    totalItems += data.length

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const average = totalResonance / totalItems

  console.log(`Total items processed: ${totalItems}`)
  console.log(`Total resonance: ${totalResonance}`)
  console.log(`Average resonance: ${average.toFixed(2)}`)
}

calculateAverageResonance().catch(console.error)
