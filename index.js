import { Cell, CellManagerInstance } from "./classes/Cell.js"

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas")
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d")
const gridHasLines = false

// Set canvas dimensions to match the window size
function setCanvastoParentSize() {
  canvas.width = canvas.getBoundingClientRect().width
  canvas.height = canvas.getBoundingClientRect().height
}
setCanvastoParentSize()

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color || "rgba(255, 0, 0, 0.1)"
  ctx.fillRect(x, y, w, h)
}

function drawCircle(x, y, radius, startAngle, endAngle, color, filled) {
  if (!filled) filled = false
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, startAngle, endAngle)
  if (filled) {
    ctx.fillStyle = color
    ctx.fill()
  } else {
    ctx.stroke()
  }
}

function drawText(text, x, y, fontSize, fontFamily, color) {
  if (fontSize && fontFamily) {
    ctx.font = `${fontSize}px ${fontFamily}`
  }
  if (color) {
    ctx.fillStyle = color
  }
  ctx.fillText(text, x, y)
}

class GridItem {
  constructor(height, width, x, y, row, col, color) {
    this.id = `${row},${col}`
    this.height = height
    this.width = width
    this.x = x
    this.y = y
    this.row = row
    this.col = col
    this.color = color

    this.content
    this.contentType
    this.contentWaiting = false
    this.draw = () => {
      if (!this.contentType) return

      switch (this.contentType) {
        case "img":
          ctx.drawImage(this.content, this.x, this.y, this.width, this.height)
          break
        case "rect":
          drawRect(this.x, this.y, this.width, this.height, this.content)
          break
        case "circle":
          let hwMin = this.width > this.height ? this.height : this.width
          let middle = {
            x: Math.floor(this.x + this.width / 2),
            y: Math.floor(this.y + this.height / 2),
          }
          drawCircle(
            middle.x,
            middle.y,
            Math.floor(hwMin / 2),
            0,
            2 * Math.PI,
            this.color
          )
          break
        case "text":
          //set values for ctx
          ctx.font = "100% Arial"
          ctx.fillStyle = "red"

          let metrics = ctx.measureText(this.content)
          //center and move back to align text in the middle of this
          let adjustedX = this.x + this.width / 2 - metrics.width / 2
          let adjustedY = this.y + this.height / 2
          drawText(this.content, adjustedX, adjustedY, "100%", "Arial", "red")
          break
        default:
          throw new Error(`Unknown ContentType in gridItem: ${this}`)
      }
    }
    this.isContentReady = () => {
      return !this.contentWaiting
    }
  }
}

//next push will be removing array for this should it actually be faster its to try
const gridIdIndex = new Map() // to improve access
function createGrid(rows, columns, color) {
  const grid = []

  function calculateDimensions(columns) {
    const cellWidth = canvas.width / columns
    const cellHeight = canvas.height / rows
    return { cellWidth, cellHeight }
  }

  const { cellWidth, cellHeight } = calculateDimensions(columns)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = col * cellWidth
      const y = row * cellHeight
      let newGI = new GridItem(cellHeight, cellWidth, x, y, row, col, color)
      grid.push(newGI)
      gridIdIndex.set(`${newGI.row},${newGI.col}`, newGI)
    }
  }

  return grid
}
function drawGrid(gridArray) {
  gridArray.forEach(gridItem => {
    if (gridItem.isContentReady) gridItem.draw()
    if (!gridHasLines) return

    ctx.beginPath()
    ctx.rect(gridItem.x, gridItem.y, gridItem.width, gridItem.height)
    ctx.strokeStyle = "#FFF"
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

async function loadRandomImage(gridToDraw) {
  gridToDraw.contentWaiting = true
  const img = new Image()
  // https://picsum.photos/width/height
  img.src = `https://picsum.photos/1920/1080?random=${Math.random() * 1000}.jpg`
  img.onload = () => {
    console.log("image loaded")
    gridToDraw.contentType = "img"
    gridToDraw.content = img
    gridToDraw.contentWaiting = false
  }
  img.onerror = () => {
    console.error("Failed to load image:", img.src)
    gridToDraw.contentType = "error"
    gridToDraw.content = null
    gridToDraw.contentWaiting = false
  }
  console.log(`waiting for ${img} to load`)
}

function getGridItem(atRow, atCol) {
  const id = `${atRow},${atCol}`
  return gridIdIndex.get(id) || null
}

//usage example:
const gridArray = createGrid(100, 100, "lightgray")

let fps = 0,
  shouldDrawFps = true,
  lastTimestamp
function handleFPS(timestamp) {
  const deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp

  fps = 1000 / deltaTime
}

const drawAll = () => {
  drawGrid(gridArray)
}
const reset = () => {
  drawRect(0, 0, canvas.width, canvas.height, "#000")
}

const cellManager = CellManagerInstance
const myCell = new Cell(50, 50, 100, true, getGridItem)
cellManager.addCell(myCell)
let pause = false

window.addEventListener("keydown", ev => {
  if (ev.key === " ") {
    const togglePause = () => {
      pause = !pause
      if (!pause) cellManager.pause()
      else cellManager.start()
    }
    togglePause()
  }
})

let timeLastUpdate

const maxDeltaTime = 1 / 165 // simulationspeed/ targeted simulationrate

const update = () => {
  const currentTime = performance.now()
  const deltaTimeMillis = currentTime - timeLastUpdate
  const deltaTimeSecs = deltaTimeMillis / 1000.0
  timeLastUpdate = currentTime

  if (!pause && deltaTimeSecs > maxDeltaTime) {
    cellManager.simulate(deltaTimeSecs)
  }

  drawAll()

  if (shouldDrawFps) drawText(fps.toFixed(0), 10, 20, "100%", "Arial", "#FFF")
  requestAnimationFrame(reset)
  requestAnimationFrame(update)
  requestAnimationFrame(handleFPS)
}

// init timeLastUpdate on sim start
const now = performance.now()
timeLastUpdate = now

update()
