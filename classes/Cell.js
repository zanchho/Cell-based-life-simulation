export class Cell {
  constructor(row, col, energy = -1, alive = true) {
    this.row = row
    this.col = col
    this.energy = energy
    this.alive = alive
    this.color = "green"
    this.seeds = [] //keeping track of it increases complexity so i abandon it soon

    this.stats = { maxEnergy: 120 }
    if (this.energy === -1) this.energy = this.stats.maxEnergy
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
    if (FnIsGridItemEmpty(this.row, this.col + 1)) energyGain += 10
    if (FnIsGridItemEmpty(this.row + 1, this.col)) energyGain += 10
    if (FnIsGridItemEmpty(this.row - 1, this.col)) energyGain += 10
    if (FnIsGridItemEmpty(this.row, this.col - 1)) energyGain += 10

    this.energy += energyGain
    if (this.energy > this.stats.maxEnergy) this.energy = this.stats.maxEnergy
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
    // Cycle energy cost
    this.energy -= 15

    // Check for death conditions first for early exit
    if (this.energy <= 0) {
      this.alive = false
      if (!FnIsGridItemEmpty(this.row, this.col))
        FnClearGridItem(this.row, this.col)
      return
    }

    // Random movement
    if (Math.random() < 0.1) {
      this.moveRandomly()
      return
    }

    // Reproduction condition check
    const isMaxCellsReached = cM_instance.isMaxCellsReached()
    const energyThresholdMet = this.energy > 70
    if (!isMaxCellsReached && energyThresholdMet && Math.random() < 0.2) {
      this.reproduce()
      return
    }

    // Idle action
    this.photosynthesise()
  }

  moveRandomly() {
    const direction = getRandomDirection([
      [1, 0],
      [0, 1],
      [0, -1],
      [-1, 0],
    ])
    this.move(direction)
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
      if (!(this.energy > 0 && Math.random() > 0.01)) {
        this.killSeed()
        return
      }

      this.energy -= 5 // Energy cost for growing
      if (this.growingState === this.grownAt) {
        this.killSeed()
        cM_instance.addCell(this.row, this.col, this.energy)

        return
      }
      updateGridItemProperties(this.row, this.col, this.color)
      this.growingState++
    }
    this.killSeed = () => {
      cM_instance.removeSeed(this.row, this.col)
      FnClearGridItem(this.row, this.col)
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
    //maybe head over values instead Obj
    this.addCell = (row, col, energy = 100) => {
      if (this.isMaxCellsReached()) {
        FnClearGridItem(row, col)
        return
        //TODO maybe add a warning that max cells is reached
      }
      const cell = new Cell(row, col, energy)
      this.cellArray.set(cell.row + "-" + cell.col, cell)
      return true
    }
    this.addCellObj = cell => {
      if (!(cell instanceof Cell)) return false
      this.cellArray.set(cell.row + "-" + cell.col, cell)
      return true
    }

    this.addSeed = (row, col, energy) => {
      if (this.cellArray.size + this.seeds.size > this.maxCells) return false
      const nSeed = new Seed(row, col, energy, this.FnGetGridItem)
      this.seeds.set(nSeed.row + "-" + nSeed.col, nSeed)
    }
    this.removeSeed = (row, col) => {
      this.seeds.delete(row + "-" + col)
    }

    this.updateSeeds = () => {
      this.seeds.forEach(seed => {
        seed.grow()
      })
    }
    this.updateCells = () => {
      this.cellArray.forEach(cell => {
        cell.simulate()
      })
    }

    this.cleanUpDeadCells = () => {
      this.cellArray = new Map(
        [...this.cellArray].filter(([_, cell]) => cell.alive)
      )
    }
    this.simulate = () => {
      this.updateSeeds()
      this.updateCells()
      this.cleanUpDeadCells() // To avoid deleting live map
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
