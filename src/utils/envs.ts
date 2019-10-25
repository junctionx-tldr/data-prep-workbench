import { config } from "dotenv"
config()

const {
  WHATEVER = ""
} = process.env

if (
  [
    WHATEVER
  ].some(a => a === "")
) {
  throw new Error(`Envs not set properly: ${JSON.stringify(process.env)}`)
}

export {
  WHATEVER
}
