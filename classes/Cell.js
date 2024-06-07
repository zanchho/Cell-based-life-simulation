export class Cell {
  constructor(row, col, energy = 100, alive = true) {
    this.row = row
    this.col = col
    this.energy = energy
    this.alive = alive
    this.color = "green"
    this.seeds = [] //keeping track of it increases complexity so i abandon it soon
  }

  canMove(direction) {
    return FnIsGridItemEmpty(this.row + direction[0], this.col + direction[1])
  }
  move(direction) {
    if (!this.canMove(direction)) {
      //tried to move but cant so it looses energy
      return
    }

    //if it can move to the location its gonna clear up the GridItem
    FnClearGridItem(this.row, this.col)

    //setNew POS
    this.row += direction[0]
    this.col += direction[1]

    //and after moving itself to the direction it sets the content of gridItem
    updateGridItemProperties(this.row, this.col, this.color)

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
    if (FnIsGridItemEmpty(this.row, this.col + 1)) energyGain += 5
    if (FnIsGridItemEmpty(this.row + 1, this.col)) energyGain += 5
    if (FnIsGridItemEmpty(this.row - 1, this.col)) energyGain += 5
    if (FnIsGridItemEmpty(this.row, this.col - 1)) energyGain += 5

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
    if (FnIsGridItemEmpty(pos[0], pos[1])) {
      const passEnergyToSeed = 50

      cM_instance.addSeed(pos[0], pos[1], passEnergyToSeed)
      this.energy -= passEnergyToSeed
    }
  }

  simulate() {
    //cycle energycost
    this.energy -= 15
    //delete killed Cells without Seeds
    if (!this.alive) {
      cM_instance.removeCell(this)
      FnClearGridItem(this.row, this.col)
      return
    }

    //kill on missing energy
    if (this.energy <= 0) {
      this.alive = false
      this.color = "red"
      updateGridItemProperties(this.row, this.col, this.color)
      return
    }

    //random %to move randomly
    if (Math.random() < 0.1) {
      const direction = getRandomDirection([
        [1, 0],
        [0, 1],
        [0, -1],
        [-1, 0],
      ])
      this.move(direction)
      return
    }

    //maybe add a success chance
    if (
      !cM_instance.isMaxCellsReached() &&
      this.energy > 70 &&
      Math.random() < 0.2
    ) {
      this.reproduce()
      return
    }

    //idle
    this.photosynthesise()
  }
}

class Seed {
  constructor(row, col, energy) {
    this.row = row
    this.col = col
    this.energy = energy
    this.color = "yellow"

    this.growingState = 0
    this.grownAt = 5

    this.grow = () => {
      //random here establishes a low %rate where Cells just die

      if (this.energy > 0 && Math.random() > 0.01) {
        this.energy -= 5 // Energy cost for growing
        if (this.growingState === this.grownAt) {
          FnClearGridItem(this.row, this.col)
          cM_instance.addCell(new Cell(this.row, this.col, this.energy, true))
          this.killSeed()
          return
        }
        updateGridItemProperties(this.row, this.col, this.color)
        this.growingState++
      } else {
        // console.log("seed dyes")
        FnClearGridItem(this.row, this.col)
        this.killSeed()
      }
    }
    this.killSeed = () => {
      cM_instance.removeSeed(this)
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

  //TODO test higher maxCells with seeds managed by this

  //TODO after seeds are here implement multiGroup cells

  //think about like interactions?
  constructor() {
    this.maxCells = 5000 //limiting for performance tho
    this.FnGetGridItem = function () {
      console.error("CellManager.FnGetGridItem is not set")
    }

    this.paused = false
    this.cellArray = new Map()
    this.seeds = new Map()
    this.addCell = cell => {
      if (!(cell instanceof Cell)) return false
      if (this.isMaxCellsReached()) {
        //this should be fine just not getting added bc GC
        cell.alive = false
        cell.energy = -100
        FnClearGridItem(cell.row, cell.col)
        return false
      }
      this.cellArray.set(cell.row + "-" + cell.col, cell)
      return true
    }
    this.removeCell = deleteCell => {
      this.cellArray.delete(deleteCell.row + "-" + deleteCell.col)
    }

    this.addSeed = (row, col, energy) => {
      if (this.cellArray.size + this.seeds.size > this.maxCells) return false
      const nSeed = new Seed(row, col, energy, this.FnGetGridItem)
      this.seeds.set(nSeed.row + "-" + nSeed.col, nSeed)
    }
    this.removeSeed = seedToRemove => {
      this.seeds.delete(seedToRemove.row + "-" + seedToRemove.col)
    }

    this.updateSeeds = () => {
      this.seeds.forEach(seed => {
        seed.grow()
      })
    }

    this.simulate = () => {
      if (this.cellArray.length === 0) return

      this.seeds.forEach(seed => {
        seed.grow()
      })
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
      return this.cellArray.size >= this.maxCells
    }
    this.simulate()
  }
}

//singleton
const cM_instance = new CellManager()

export { cM_instance as CellManagerInstance }

//helper
function FnIsGridItemEmpty(row, col) {
  const FnGetGridItem = cM_instance.FnGetGridItem
  let gI = FnGetGridItem(row, col)
  if (!gI) {
    return false
  }
  if (!gI.hasOwnProperty("contentType") || gI.contentType === undefined) {
    return true
  }
  return false
}

function FnClearGridItem(row, col) {
  const FnGetGridItem = cM_instance.FnGetGridItem
  const gI = FnGetGridItem(row, col)
  if (!gI) return

  gI.contentType = undefined
  gI.content = undefined
  gI.contentWaiting = false
  gI.requiresDraw = true
}
function updateGridItemProperties(row, col, color) {
  const FnGetGridItem = cM_instance.FnGetGridItem
  const gI = FnGetGridItem(row, col)
  if (!gI) return
  gI.contentType = "rect"
  gI.content = color
  gI.contentWaiting = false
  gI.requiresDraw = true
}
const maxCachedRIP = 10000
let randomIndicesPool = []
let poolIndex = 0

function refillRandomIndicesPool(maxValue) {
  let newarray = []
  for (let i = 0; i < maxCachedRIP; i++) {
    newarray.push(Math.floor(Math.random() * maxValue))
  }
  randomIndicesPool = newarray
  poolIndex = 0
}
/** If options exceed the length of 4 touch this again */
function getRandomDirection(options) {
  if (!options || options.length === 0)
    throw new Error("No possible Directions set")

  // Recache the pool if it's empty
  if (poolIndex >= randomIndicesPool.length) {
    refillRandomIndicesPool(options.length)
  }

  const rIndex = randomIndicesPool[poolIndex++]
  return options[rIndex]
}

// intiial fill of cache
refillRandomIndicesPool(4)
