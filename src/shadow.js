import pkg from '@xterm/headless';
const { Terminal } = pkg;

export class ShadowTerminal {
  constructor(cols, rows) {
    this.terminal = new Terminal({ cols, rows, allowProposedApi: true });
  }

  write(data) {
    this.terminal.write(data);
  }

  getCell(row, col) {
    const buffer = this.terminal.buffer.active;
    const line = buffer.getLine(buffer.baseY + row);
    if (!line) return { char: ' ', width: 1, fg: null, bg: null, bold: false, italic: false, underline: false };
    const cell = line.getCell(col);
    if (!cell) return { char: ' ', width: 1, fg: null, bg: null, bold: false, italic: false, underline: false };

    const ch = cell.getChars() || ' ';
    const width = cell.getWidth();

    // Extract foreground color
    let fg = null;
    if (cell.isFgRGB()) {
      const color = cell.getFgColor();
      fg = { type: 'rgb', r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
    } else if (cell.isFgPalette()) {
      fg = { type: 'palette', index: cell.getFgColor() };
    } else if (cell.isFgDefault()) {
      fg = null;
    }

    // Extract background color
    let bg = null;
    if (cell.isBgRGB()) {
      const color = cell.getBgColor();
      bg = { type: 'rgb', r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
    } else if (cell.isBgPalette()) {
      bg = { type: 'palette', index: cell.getBgColor() };
    } else if (cell.isBgDefault()) {
      bg = null;
    }

    return {
      char: ch,
      width,
      fg,
      bg,
      bold: cell.isBold() === 1,
      italic: cell.isItalic() === 1,
      underline: cell.isUnderline() === 1,
      dim: cell.isDim() === 1,
      inverse: cell.isInverse() === 1,
      strikethrough: cell.isStrikethrough() === 1,
    };
  }

  getCursor() {
    const buffer = this.terminal.buffer.active;
    return { x: buffer.cursorX, y: buffer.cursorY };
  }

  getBaseY() {
    return this.terminal.buffer.active.baseY;
  }

  resize(cols, rows) {
    this.terminal.resize(cols, rows);
  }

  dispose() {
    this.terminal.dispose();
  }
}
