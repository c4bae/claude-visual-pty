export class Animation {
  /**
   * Called when overlay starts.
   * @param {number} cols - terminal width
   * @param {number} rows - terminal height
   */
  start(cols, rows) {}

  /**
   * Called each frame. Return array of cells to draw.
   * Space characters should be OMITTED (they're transparent).
   * @param {number} frame - frame counter
   * @param {number} cols - terminal width
   * @param {number} rows - terminal height
   * @returns {Array<{row: number, col: number, char: string, fg?: number, bg?: number}>}
   */
  getFrame(frame, cols, rows) { return []; }

  /**
   * Called when overlay stops.
   */
  stop() {}
}
