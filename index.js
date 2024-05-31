/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas")
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d")
const gridHasLines = true

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
      grid.push(new GridItem(cellHeight, cellWidth, x, y, row, col, color))
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
  return gridArray.find(({ col, row }) => {
    return col === atCol && row === atRow
  })
}

//usage example:
const gridArray = createGrid(5, 5, "lightgray")

let fps, lastTimestamp
function handleFPS(timestamp) {
  const deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp

  fps = 1000 / deltaTime
}

const drawAll = () => {
  //ungridded -mostlikely useless to me
  drawRect(190, 190, 70, 70, "aqua")
  drawCircle(200, 200, 50, 0, Math.PI * 2, "red")
  drawText("Hello World", 620, 250, "100%", "Arial", "red")

  drawGrid(gridArray)
}
const reset = () => {
  drawRect(0, 0, canvas.width, canvas.height, "#000")
}
const update = () => {
  drawAll()

  //draw fps
  if (fps) drawText(fps.toFixed(0), 10, 20, "100%", "Arial", "#FFF")

  const timestamp = performance.now()
  requestAnimationFrame(reset)
  requestAnimationFrame(handleFPS)
  requestAnimationFrame(update)
}
update()

//#region  test images
const imageGridItem = getGridItem(4, 4)
// Gen random delay
const delay = Math.floor(Math.random() * 11) + 3

const loadImage = async () => {
  await loadRandomImage(imageGridItem)

  setTimeout(() => {
    loadImage()
  }, delay * 1000) // ms to s
}
loadImage()

//#endregion
//#region test Rect
const rectGridItem = getGridItem(0, 3)
rectGridItem.content = "#123"
rectGridItem.contentType = "rect"
//#endregion
//#region test Circle
const circleGridItem = getGridItem(1, 3)
circleGridItem.content = "#123"
circleGridItem.contentType = "circle"
//#endregion
//#region test Text
const textGridItem = getGridItem(1, 2)
textGridItem.content = "Hello My Cutie Grid"
textGridItem.contentType = "text"
//#endregion
