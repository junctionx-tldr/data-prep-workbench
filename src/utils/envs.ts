import { config } from "dotenv"
config()

const {
  API_URL = "",
  API_KEY = "",
  WORKING_DIRECTORY = ""
} = process.env

if (
  [
    API_URL,
    API_KEY,
    WORKING_DIRECTORY
  ].some(a => a === "")
) {
  throw new Error(`Envs not set properly: ${JSON.stringify(process.env)}`)
}

export {
  API_URL,
  API_KEY,
  WORKING_DIRECTORY
}
