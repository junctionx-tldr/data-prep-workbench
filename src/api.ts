import got from "got"
import { API_URL, API_KEY } from "./utils/envs"

export interface IRawRecord {
  time: string
  hash: string
  latitude: number
  longitude: number
  serial: string
  distance: number
  rssi: number
}

export interface IReducedRecord {
  time: string
  hash: string
  station: string
  distance: number
}

export interface IAPIBody {
  status: string
  raw: IRawRecord[]
}

async function hitAPI<T>(additionalHeaders?: {}): Promise<T | undefined> {
  try {
    const request = await got(`${API_URL}/raw`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        command: "list",
        ...additionalHeaders
      },
      method: "POST",
      timeout: 120 * 1000,
      hooks: {},
      retry: {
        // @ts-ignore
        limit: 1e6,
        statusCodes: [ 429 ],
        methods: [ "POST" ],
        // @ts-ignore
        calculateDelay: () => 50,
        retries: 1e6
      }
    })
    return JSON.parse(request.body) as T
  } catch (e) {
    if (e.statusCode || e.statusMessage) {
      console.log(`❌ Failed: ${e.statusCode} ${e.statusMessage}`)
    } else {
      console.log(`❌ Failed:\n${JSON.stringify(e)}`)
    }

  }
}

function getISODateString(millis: number) {
  return new Date(millis).toISOString().replace(/\.\d{3}Z/, "Z")
}

export default async function raw(from: number, to: number): Promise<IReducedRecord[]> {
  const body = await hitAPI<IAPIBody>({
    time_start: getISODateString(from),
    time_stop: getISODateString(to)
  })
  if (!body) return []
  return body.raw.map(({ time, hash, serial, distance }) => ({ time, hash, station: serial, distance }))
}
