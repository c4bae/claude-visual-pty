import { Animation } from './base.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export default class DVDBounce extends Animation {
  constructor(config = {}) {
    super();
    this.artPath = config.artFile || null;
    this.rootDir = config.rootDir || '.';
    this.speed = config.speed || 1;
    this.art = null;
    this.artWidth = 0;
    this.artHeight = 0;
    this.x = 0;
    this.y = 0;
    this.dx = 1;
    this.dy = 1;
    this.colors = [174, 114, 186, 110, 139, 152]; // soft rose, soft lavender, soft mauve, soft sage, soft plum, soft steel
    this.colorIndex = 0;
  }

  start(cols, rows) {
    // Load ASCII art
    const artFile = this.artPath
      ? resolve(this.rootDir, this.artPath)
      : resolve(this.rootDir, 'visuals', 'dvd-logo.txt');

    try {
      this.art = readFileSync(artFile, 'utf-8').split('\n');
      // Remove trailing empty line if present
      if (this.art[this.art.length - 1] === '') this.art.pop();
    } catch {
      // Fallback ASCII art
      this.art = [
        '  ╔══════════╗  ',
        '  ║   DVD    ║  ',
        '  ║  VIDEO   ║  ',
        '  ╚══════════╝  ',
      ];
    }

    this.artWidth = Math.max(...this.art.map(l => l.length));
    this.artHeight = this.art.length;

    // Start at random position, clamped to bounds
    const maxX = Math.max(0, cols - this.artWidth);
    const maxY = Math.max(0, rows - this.artHeight);
    this.x = Math.floor(Math.random() * maxX);
    this.y = Math.floor(Math.random() * maxY);
    this.dx = this.speed;
    this.dy = this.speed;
    this.colorIndex = Math.floor(Math.random() * this.colors.length);
  }

  getFrame(frame, cols, rows) {
    // Move
    this.x += this.dx;
    this.y += this.dy;

    // Bounce off edges
    let bouncedX = false;
    let bouncedY = false;
    if (this.x <= 0) {
      this.x = 0;
      this.dx = Math.abs(this.dx);
      bouncedX = true;
    } else if (this.x + this.artWidth >= cols) {
      this.x = Math.max(0, cols - this.artWidth);
      this.dx = -Math.abs(this.dx);
      bouncedX = true;
    }

    if (this.y <= 0) {
      this.y = 0;
      this.dy = Math.abs(this.dy);
      bouncedY = true;
    } else if (this.y + this.artHeight >= rows) {
      this.y = Math.max(0, rows - this.artHeight);
      this.dy = -Math.abs(this.dy);
      bouncedY = true;
    }

    if (bouncedX || bouncedY) {
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
    }

    // Build cells — skip spaces (transparent)
    const cells = [];
    const fg = this.colors[this.colorIndex];
    for (let dy = 0; dy < this.art.length; dy++) {
      const line = this.art[dy];
      for (let dx = 0; dx < line.length; dx++) {
        if (line[dx] !== ' ') {
          const row = this.y + dy;
          const col = this.x + dx;
          // Bounds check
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            cells.push({ row, col, char: line[dx], fg });
          }
        }
      }
    }
    return cells;
  }
}
