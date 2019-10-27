import { promises as fs } from "fs"
import { IReducedRecord } from "./api"
import pMap from "p-map"
import MovementNode from "./movement-node"
import { getUsersFolder } from "./utils/files"

const ULIMIT = 1000
const EVALUATE_N_MOST_ACTIVE_USERS = 100e3

export default async function aggregateUserGraph(inputFile: string, graphFile: string) {
  const usersFolder = getUsersFolder(inputFile)

  const files = (await fs.readdir(usersFolder))
    .map(f => usersFolder + f)
    .filter(f => f.endsWith(".jsonlines"))
  console.log(`🗂  JSONLines Files found: ${files.length}`)

  const relevantFiles = (
    await pMap(files, async file => ({ file, stats: await fs.stat(file) }), { concurrency: ULIMIT })
  )
  .sort((a, b) => b.stats.size - a.stats.size)
  .slice(0, EVALUATE_N_MOST_ACTIVE_USERS)
  .map(s => s.file)

  console.log(`🗂  Most Relevant JSONLines Files selected: ${relevantFiles.length}`)

  const userMovements = new MovementNode("root", 0)

  await pMap(relevantFiles, async f => {
    const content = await fs.readFile(f, { encoding: "utf8" })
    // drop last newline
    const items = content
      .substring(0, content.length - 1)
      .replace(/\n/g, ",\n")

    let obj: IReducedRecord[]
    try {
      obj = JSON.parse(`[${ items }]`)
    } catch (e) {
      console.log(`Error while parsing user file at ${f}:`, e)
      return
    }

    const sortedMovements = obj
      .map(r => ({ ...r, millis: new Date(r.time).getTime() }))
      .sort((a, b) => a.millis - b.millis)

    let lastStation = userMovements
    for (const movement of sortedMovements) {
      const nextNode = lastStation.add(movement.station)
      if (nextNode === undefined) return
      lastStation = nextNode
    }
  }, { concurrency: ULIMIT })

  for (const topLevelChildren of userMovements.children) {
    userMovements.weight += topLevelChildren[1].weight
  }

  await fs.writeFile(graphFile, JSON.stringify(userMovements))
}
