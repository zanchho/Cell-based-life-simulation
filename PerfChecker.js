export class PerformanceChecker {
  constructor() {
    this.startTime = null
    this.endTime = null
  }

  start() {
    this.startTime = performance.now()
  }

  end() {
    this.endTime = performance.now()
    this.calculateAndLogPerformance()
  }

  calculateAndLogPerformance() {
    if (!this.startTime || !this.endTime) return
    const duration = this.endTime - this.startTime
    console.log(`Execution Time: ${duration} ms`)
  }
  clear() {
    this.startTime = null
    this.endTime = null
  }
}
