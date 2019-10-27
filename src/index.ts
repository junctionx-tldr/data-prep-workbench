import "./utils/envs"
import { getScrapedDataFileName } from "./utils/files"
import scrapeData from "./scrape-data"
import mapToUsers from "./map-to-users"
import aggregateUserGraph from "./aggregate-user-graph"
import pMap from "p-map"
// import { argv } from "yargs"

async function runSingle(start: string, end: string) {
    const startingMillis = new Date(start).getTime()
    const endMillis = new Date(end).getTime()

    const dataFile = getScrapedDataFileName(startingMillis, endMillis)
    const graphFile = `graph_${startingMillis}_${endMillis}.json`

    await scrapeData(startingMillis, endMillis, 10, dataFile)
    await mapToUsers(dataFile)
    await aggregateUserGraph(dataFile, graphFile)
}

async function run() {
    const baseFixture = (hour: number) => {
        const h = hour.toString().padStart(2, "0")
        return {
            start: `2019-08-01T${h}:00:00Z`,
            end: `2019-08-01T${h}:59:59Z`
        }
    }

    const fixtures = Array.from({ length: 24 }, (_, i) => baseFixture(i))

    console.log(fixtures)
    await pMap(fixtures, ({ start, end }) => runSingle(start, end), { concurrency: 1 })
}

// runSingle(argv.start as string, argv.end as string)
run()
