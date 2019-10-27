const MAX_DEPTH = 10

export default class MovementNode<StationKey = string> {
  public weight: number = 1
  public stayed: number = 0
  public readonly children = new Map<StationKey, MovementNode<StationKey>>()

  constructor(
    public station: StationKey,
    public depth: number
  ) {}

  public toJSON() {
    const json: any = { ...this }
    json.children = [...this.children]
    return json
  }

  public add(station: StationKey): MovementNode<StationKey> | undefined {
    if (station === this.station) {
      this.stayed++
      return this
    }

    const subTree = this.children.get(station)
    if (!subTree) {
      const nextDepth = this.depth + 1
      if (nextDepth > MAX_DEPTH) {
        return
      }
      // console.log(`📍  Went to new spot ${station}`)
      const newSubtree = new MovementNode(station, nextDepth)
      this.children.set(station, newSubtree)
      return newSubtree
    }

    subTree.weight++
    return subTree
  }
}
