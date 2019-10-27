import { PathLike, createWriteStream, WriteStream, ReadStream, createReadStream, exists as fsExists } from "fs"

export async function exists(path: PathLike): Promise<boolean> {
  return new Promise(resolve => {
    fsExists(path, resolve)
  })
}

export async function getOutputStream(path: PathLike, append: boolean = false): Promise<WriteStream> {
  return new Promise(resolve => {
    const stream = createWriteStream(path, { flags: append ? "a" : "w" })
    stream.on("open", () => resolve(stream))
  })
}

export async function getStreamEnd(stream: ReadStream | WriteStream) {
  return new Promise(resolve => {
    stream.on("end", resolve)
  })
}

export async function getInputStream(path: PathLike): Promise<ReadStream> {
  return new Promise(resolve => {
    const stream = createReadStream(path)
    stream.on("open", () => resolve(stream))
  })
}
