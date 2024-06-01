export class Cell {
  constructor(row, col, energy = 100, alive = true, FnGetGridItem) {
    this.row = row
    this.col = col
    this.energy = energy
    this.alive = alive
    this.color = "green"
    this.seeds = []
    this.FnGetGridItem = FnGetGridItem
    this.FnIsGridItemEmpty = (row, col) => {
      return this.FnGetGridItem(row, col).contentType === undefined
    }
    this.FnClearGridItem = (row, col) => {
      const gI = this.FnGetGridItem(row, col)
      gI.contentType = undefined
      gI.content = undefined
      gI.contentWaiting = false
    }
    this.FnMakeDrawAble = () => {
      const gI = this.FnGetGridItem(this.row, this.col)
      if (!gI) return
      gI.contentType = "rect"
      gI.content = this.color
      gI.contentWaiting = false
    }
    console.log(FnGetGridItem, " === ", this.FnGetGridItem)
    this.FnMakeDrawAble()
  }

  canMove(direction) {
    const row = this.row + direction[0]
    const col = this.col + direction[1]
    return this.FnIsGridItemEmpty(row, col)
  }
  move(direction) {
    if (!this.canMove(direction)) return
    console.log("cell move")

    //if it can move to the location its gonna clear up the GridItem
    this.FnClearGridItem()
    //and after moving itself to the direction it sets the content of gridItem
    this.FnMakeDrawAble()

    /*


    TODO 

    moving should be 1 UDLR -- for future maybe use A*- Algorythm 
    if i get Ideas for any Objectives for the cell, interesting would be 
    like having stats by default and increase them with random spawning Orbs, 
    which increases like baseStats also i can fit seeds lifelikelyhood into it 

    else 

    */
  }
  //energy gain
  photosynthesise() {
    // console.log("cell photosynthesise ")

    this.energy += 25
    if (this.energy > 100) this.energy = 100
  }

  reproduce() {
    // console.log("cell reproduce")
    //effort to put into seed
    const passEnergyToSeed = 80
    this.seeds.push(
      new Seed(this.row, this.col, passEnergyToSeed, "right", this)
    )
    this.energy -= passEnergyToSeed
  }

  simulate() {
    //cycle energycost
    this.energy -= 15

    if (this.energy > 80) {
      this.reproduce()
      return
    }

    //idle
    this.photosynthesise()
  }
}

class Seed {
  constructor(row, col, energy, direction, origin) {
    this.row = row
    this.col = col
    this.energy = energy
    this.direction = direction
    this.origin = origin

    this.growingState = 0
    this.grownAt = 3
  }

  grow() {
    //random here establishes a low %rate where Cells just die
    if (this.energy > 30 && Math.random() > 0.01) {
      console.log("SSeed Survives")
      this.energy -= 15 // Energy cost for growing
      new Cell(this.row, this.col, this.energy, true, this.origin.FnGetGridItem)
    } else {
      console.log("seed dyes")
      this.origin.seeds = this.origin.seeds.filter(seed => seed !== this)
      delete this
    }
  }
}
