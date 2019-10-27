import {getInputStream, getStreamEnd, getOutputStream, exists} from "./io"
// @ts-ignore
import JSONStream from "JSONStream"
import { IReducedRecord } from "./api"
import { WriteStream, promises } from "fs"
import prettyBytes from "pretty-bytes"
import LRUCache from "lru-native2"
import pMap from "p-map"
import { getPerUserFile, getUsersFolder } from "./utils/files"

const ULIMIT = 1e3

export default async function mapToUsers(inputFile: string) {
  const distinctUsers = new Set<string>()
  const userStreams = new LRUCache<WriteStream>({ maxElements: ULIMIT, size: ULIMIT, maxLoadFactor: 1 })

  const usersFolder = getUsersFolder(inputFile)
  if (!await exists(usersFolder)) {
    await promises.mkdir(usersFolder)
  }

  const stream = await getInputStream(inputFile)
  const jsonStream = stream.pipe(JSONStream.parse("*"))
  jsonStream.on("error", function (e: Error) {
    console.error(`❌  Error encountered while streaming json:${JSON.stringify(e)}`)
    // @ts-ignore
    console.log(JSON.stringify(this.root)) // last parsed element
  })

  const interval = setInterval(() => {
    console.log(`Progress: ${prettyBytes(stream.bytesRead)} | 👥  Unique users: ${distinctUsers.size}`)
  }, 1000)

  jsonStream.on("data", async (record: IReducedRecord) => {
    const { hash } = record
    if (!hash) return

    let userStream = userStreams.get(hash)

    if (!userStream) {
      distinctUsers.add(hash)
      userStream = await getOutputStream(getPerUserFile(inputFile, hash), true)
      userStreams.set(hash, userStream)
    }

    const json = JSON.stringify(record)
    userStream.end(json + "\n")

    userStreams.remove(hash)
  })

  await Promise.all([
    getStreamEnd(jsonStream),
    getStreamEnd(stream)
  ])

  clearInterval(interval)
}
