export class Compositor {
  constructor(fps) {
    this.fps = fps || 15;
    this.activeCells = new Set();
    this.animationInterval = null;
    this.frame = 0;
    this.running = false;
  }

  start(animation, shadow, stdout) {
    if (this.running) return;
    this.running = true;
    this.frame = 0;
    this.activeCells = new Set();

    this.rowOffset = 0;

    animation.start(stdout.columns, stdout.rows);

    // Hide cursor during overlay to reduce flicker
    stdout.write('\x1b[?25l');

    // Delay first frame slightly to let shadow terminal sync
    setTimeout(() => {
      if (!this.running) return;
      this.animationInterval = setInterval(() => {
        this.renderFrame(animation, shadow, stdout);
        this.frame++;
      }, 1000 / this.fps);
    }, 150);
  }

  renderFrame(animation, shadow, stdout) {
    const cols = stdout.columns;
    const rows = stdout.rows;
    const newCells = animation.getFrame(this.frame, cols, rows);
    const newCellSet = new Set(newCells.map(c => `${c.row},${c.col}`));

    let output = '';

    // 1. RESTORE: cells that were covered last frame but aren't this frame
    for (const key of this.activeCells) {
      if (!newCellSet.has(key)) {
        const [row, col] = key.split(',').map(Number);
        const original = shadow.getCell(row + this.rowOffset, col);
        output += this.buildCellSequence(row, col, original);
      }
    }

    // 2. DRAW: overlay cells for this frame
    for (const cell of newCells) {
      output += this.buildOverlayCellSequence(cell);
    }

    // 3. RESTORE CURSOR: put cursor back where Claude expects it
    const cursor = shadow.getCursor();
    output += `\x1b[${cursor.y + 1 - this.rowOffset};${cursor.x + 1}H`;

    // 4. FLUSH: single write, minimal flicker
    if (output) stdout.write(output);

    this.activeCells = newCellSet;
  }

  stop(shadow, stdout) {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.animationInterval);
    this.animationInterval = null;

    // Repaint the entire visible screen from the shadow terminal
    // This guarantees no stale overlay pixels remain, even after scrolling
    const cols = stdout.columns || 80;
    const rows = stdout.rows || 24;
    let output = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = shadow.getCell(row + this.rowOffset, col);
        // Skip second cell of wide characters
        if (cell.width === 0) continue;
        output += this.buildCellSequence(row, col, cell);
        // Wide char takes two columns
        if (cell.width === 2) col++;
      }
    }

    // Restore cursor position and visibility
    const cursor = shadow.getCursor();
    output += `\x1b[${cursor.y + 1 - this.rowOffset};${cursor.x + 1}H`;
    output += '\x1b[?25h'; // show cursor
    output += '\x1b[0m';   // reset style

    stdout.write(output);
    this.activeCells = new Set();
  }

  resize(cols, rows) {
    // Animation will get new dimensions on next getFrame call
    // Just clear tracked cells — next frame redraws everything
    this.activeCells = new Set();
  }

  buildCellSequence(row, col, cell) {
    let seq = `\x1b[${row + 1};${col + 1}H`;
    seq += this.buildSGR(cell);
    seq += cell.char || ' ';
    seq += '\x1b[0m';
    return seq;
  }

  buildOverlayCellSequence(cell) {
    let seq = `\x1b[${cell.row + 1};${cell.col + 1}H`;
    seq += '\x1b[0m'; // reset first
    if (cell.bold) seq += '\x1b[1m';
    if (cell.fg !== undefined && cell.fg !== null) {
      if (typeof cell.fg === 'object' && cell.fg.type === 'rgb') {
        seq += `\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m`;
      } else {
        seq += `\x1b[38;5;${cell.fg}m`;
      }
    }
    if (cell.bg !== undefined && cell.bg !== null) {
      if (typeof cell.bg === 'object' && cell.bg.type === 'rgb') {
        seq += `\x1b[48;2;${cell.bg.r};${cell.bg.g};${cell.bg.b}m`;
      } else {
        seq += `\x1b[48;5;${cell.bg}m`;
      }
    }
    seq += cell.char;
    seq += '\x1b[0m';
    return seq;
  }

  buildSGR(cell) {
    let sgr = '\x1b[0m';
    if (cell.bold) sgr += '\x1b[1m';
    if (cell.dim) sgr += '\x1b[2m';
    if (cell.italic) sgr += '\x1b[3m';
    if (cell.underline) sgr += '\x1b[4m';
    if (cell.inverse) sgr += '\x1b[7m';
    if (cell.strikethrough) sgr += '\x1b[9m';

    if (cell.fg) {
      if (cell.fg.type === 'rgb') {
        sgr += `\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m`;
      } else if (cell.fg.type === 'palette') {
        sgr += `\x1b[38;5;${cell.fg.index}m`;
      }
    }

    if (cell.bg) {
      if (cell.bg.type === 'rgb') {
        sgr += `\x1b[48;2;${cell.bg.r};${cell.bg.g};${cell.bg.b}m`;
      } else if (cell.bg.type === 'palette') {
        sgr += `\x1b[48;5;${cell.bg.index}m`;
      }
    }

    return sgr;
  }
}
