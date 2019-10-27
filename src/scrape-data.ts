import ms from "milliseconds"
import "./utils/envs"
import raw from "./api"
import { getOutputStream } from "./io"
import Queue from "p-queue"
import delay from "./utils/delay"

export default async function scrapeData(
  startingMillis: number,
  endMillis: number,
  secondsPerRequest: number,
  outputFile: string
) {
  const millisPerRequest = ms.seconds(secondsPerRequest)
  const requestCount = (endMillis - startingMillis) / millisPerRequest

  const stream = await getOutputStream(outputFile)

  stream.write("[")

  let isFirstItem = true

  const queries: { from: number, to: number }[] = []
  const progressMap = new Map<number, { requested: boolean, received: boolean, written: boolean }>()

  for (let i = 0; i < requestCount; i++) {
    const from = i * millisPerRequest + startingMillis
    queries.push({ from, to: from + millisPerRequest })
    progressMap.set(from, { requested: false, received: false, written: false })
  }

  const requests = queries.map(({ from, to }) => async () => {
    const progress = progressMap.get(from)!

    progress.requested = true
    const rawItems = await raw(from, to)
    progress.received = true

    const jsonString = JSON.stringify(rawItems)
    if (jsonString.length < 10) {
      progress.written = true
      return
    }

    const itemsWithoutBrackets = jsonString.substring(1, jsonString.length - 1)

    if (isFirstItem) {
      stream.write(itemsWithoutBrackets)
      isFirstItem = false
    } else {
      stream.write(",\n" + itemsWithoutBrackets)
    }

    progress.written = true
  })

  const t0 = Date.now()

  const interval = setInterval(() => {
    const stats = { requested: 0, received: 0, written: 0 }
    for (const p of progressMap.values()) {
      if (p.requested) stats.requested++
      if (p.received) stats.received++
      if (p.written) stats.written++
    }

    const total = progressMap.size
    const t1 = Date.now()
    const elapsed = (t1 - t0) / 1e3

    console.log([
      `${elapsed.toFixed(0)}s`,
      `🔜  ${stats.requested}/${total} (ETA: ${getETA(stats.requested, total, elapsed)}s)`,
      `✅  ${stats.received}/${total} (ETA: ${getETA(stats.received, total, elapsed)}s)`,
      `💾  ${stats.written}/${total} (ETA: ${getETA(stats.written, total, elapsed)}s)`
    ].join(" | "))
  }, 1000)

  const queue = new Queue({ concurrency: 100, interval: 1000 })

  await requests.map(r => queue.add(r))

  await delay(2000)
  await queue.onEmpty()
  await delay(5000)

  clearInterval(interval)

  stream.write("]")
  stream.end()
}

function getETA(n: number, total: number, elapsed: number) {
  return ((elapsed * (total / n)) - elapsed).toFixed(0)
}
