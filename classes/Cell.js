import { PerformanceChecker } from "../PerfChecker.js"
const checkHere = new PerformanceChecker()
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
      let res = this.FnGetGridItem(row, col)
      if (!res) {
        console.log("FnIsGridItemEmpty early return")
        return false
      }
      if (!res.hasOwnProperty("contentType") || res.contentType === undefined) {
        return true
      }
      return false
    }
    this.FnClearGridItem = () => {
      const gI = this.FnGetGridItem(this.row, this.col)
      if (!gI) {
        console.log("FnClearGridItem missing GI")
        return
      }
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
    this.FnMakeDrawAble()
  }

  canMove(direction) {
    return this.FnIsGridItemEmpty(
      this.row + direction[0],
      this.col + direction[1]
    )
  }
  move(direction) {
    if (!this.canMove(direction)) {
      //tried to move but cant so it looses energy
      return
    }

    //if it can move to the location its gonna clear up the GridItem
    this.FnClearGridItem()

    //setNew POS
    this.row += direction[0]
    this.col += direction[1]

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
    let energyGain = 10
    if (this.FnIsGridItemEmpty(this.row, this.col + 1)) energyGain += 5
    if (this.FnIsGridItemEmpty(this.row + 1, this.col)) energyGain += 5
    if (this.FnIsGridItemEmpty(this.row - 1, this.col)) energyGain += 5
    if (this.FnIsGridItemEmpty(this.row, this.col - 1)) energyGain += 5

    this.energy += energyGain
    if (this.energy > 100) this.energy = 100
  }

  reproduce() {
    const direction = getRandomDirection([
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ])

    //effort to put into seed might need adjustments
    const pos = [this.row + direction[0], this.col + direction[1]]
    if (this.FnIsGridItemEmpty(pos[0], pos[1])) {
      const passEnergyToSeed = 50
      this.seeds.push(new Seed(pos[0], pos[1], passEnergyToSeed, this))
      this.energy -= passEnergyToSeed
    }
  }
  growSeeds() {
    this.seeds.forEach(seed => {
      seed.grow()
    })
  }
  simulate() {
    //cycle energycost
    this.energy -= 15
    //delete killed Cells without Seeds
    if (!this.alive && this.seeds.length === 0) {
      //
      cM_instance.removeCell(this)
      this.FnClearGridItem()
      return
    }

    //kill on missing energy
    if (this.energy <= 0) {
      this.alive = false
      this.color = "red"
      this.FnMakeDrawAble()
      this.growSeeds()
      return
    }

    //random %to move randomly
    if (Math.random() < 0.01) {
      const direction = getRandomDirection([
        [1, 0],
        [0, 1],
        [0, -1],
        [-1, 0],
      ])
      this.move(direction)
      return
    }

    if (
      !cM_instance.isMaxCellsReached() &&
      this.energy > 70 &&
      this.seeds.length < 1
    ) {
      this.reproduce()
      return
    }

    //idle
    this.photosynthesise()

    this.growSeeds()
  }
}

//issue seeds aint getting simulated .-.
class Seed {
  constructor(row, col, energy, origin) {
    this.row = row
    this.col = col
    this.energy = energy
    this.color = "yellow"
    this.origin = origin

    this.growingState = 0
    this.grownAt = 5

    this.FnClearGridItem = () => {
      const gI = this.origin.FnGetGridItem(this.row, this.col)
      if (!gI) {
        // console.warn("FnClearGridItem missing GI")
        return
      }
      gI.contentType = undefined
      gI.content = undefined
      gI.contentWaiting = false
    }
    this.FnMakeDrawAble = () => {
      const gI = this.origin.FnGetGridItem(this.row, this.col)
      if (!gI) return
      gI.contentType = "rect"
      gI.content = this.color
      gI.contentWaiting = false
    }
    this.FnMakeDrawAble()

    this.grow = () => {
      //random here establishes a low %rate where Cells just die
      //this.FnClearGridItem()
      if (this.energy > 0 && Math.random() > 0.01) {
        this.energy -= 5 // Energy cost for growing
        if (this.growingState === this.grownAt) {
          this.FnClearGridItem()
          cM_instance.addCell(
            new Cell(
              this.row,
              this.col,
              this.energy,
              true,
              this.origin.FnGetGridItem
            )
          )

          return
        }
        this.FnMakeDrawAble()
        this.growingState++
      } else {
        // console.log("seed dyes")
        this.FnClearGridItem()
        this.killSeed()
      }
    }
    this.killSeed = () => {
      this.origin.seeds = this.origin.seeds.filter(seed => seed !== this)
      delete this
    }
  }
}

/*  
maybe try an approach of a Cell Manager,
which creates cells and seeds, so its easier to keep track of 
the Cells and their states also seeds/Cells and makes simulating 
each one more approachable 

*/
class CellManager {
  //first implementing of existing only one type across the simulation
  constructor() {
    this.maxCells = 1500 //limiting for performance tho
    // initialCellArray[0] = {row, col, energy = 100, alive = true, FnGetGridItem}
    this.paused = false
    this.cellArray = []

    this.addCell = cell => {
      if (!cell instanceof Cell) return false
      if (this.isMaxCellsReached()) {
        //kill cell
        cell.energy = -100
        return false
      }

      this.cellArray.push(cell)
      return true
    }
    this.removeCell = deleteCell => {
      this.cellArray = this.cellArray.filter(cell => cell !== deleteCell)
    }

    this.simulate = () => {
      if (this.cellArray.length === 0) return

      this.cellArray.forEach(cell => {
        if (!cell instanceof Cell)
          console.warn("cellArray contains not a Cell Item .-.")
        cell.simulate()
      })
    }

    this.start = () => {
      this.paused = false
    }
    this.pause = () => {
      this.paused = true
    }

    this.isMaxCellsReached = () => {
      return this.cellArray.length >= this.maxCells
    }
  }
}

const cM_instance = new CellManager()

export { cM_instance as CellManagerInstance }

//helper
function getRandomDirection(options) {
  if (!options || options.length === 0) throw new Error("")
  const rIndex = Math.floor(Math.random() * options.length)

  return options[rIndex]
}
