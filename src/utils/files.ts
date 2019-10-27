import { WORKING_DIRECTORY } from "./envs"

export function getScrapedDataFileName(startMillis: number, endMillis: number) {
  return `${WORKING_DIRECTORY}${startMillis}_${endMillis}.json`
}

export function getUsersFolder(inputFile: string) {
  return inputFile.replace(".json", "_users/")
}

export function getPerUserFile(inputFile: string, user: string) {
  return getUsersFolder(inputFile) + `${user}.jsonlines`
}
