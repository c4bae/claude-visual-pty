<div align="center">
  <h1>claude-code-dvd</h1>
  <p>A bouncing DVD logo overlay for Claude Code — appears while Claude is thinking</p>
  <p><b>MacOS Only - In very early develpoment</b></p>
</div> 

https://github.com/user-attachments/assets/ea48d9c9-62f9-4a85-a7ea-e3a85072c658

---

## How It Works

A PTY proxy wraps Claude Code with a shadow terminal. When Claude is thinking, an animated ASCII visual (default: bouncing DVD logo) renders as a transparent overlay on top of the terminal. When thinking stops, the overlay disappears and the original terminal content is perfectly restored.

## Installation

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd claude-code-dvd
./install.sh
```

2. Add the following hooks to your `~/.claude/settings.json`:

```json
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "/path/to/hooks/start-overlay.sh" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "/path/to/hooks/stop-overlay.sh" }]
      }
    ]
  }
```

3. Launch Claude through the overlay (in project directory):

```bash
./bin/claude-overlay
```

## Default Visuals

### Claude (`visuals/claude.txt`)

```
╔════════════════════════════╗
║      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      ║
║      ▓▓░░▓▓▓▓▓▓▓▓░░▓▓      ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      ║
║      ▓▓  ▓▓    ▓▓  ▓▓      ║
║      ▓▓  ▓▓    ▓▓  ▓▓      ║
╚════════════════════════════╝
```
```if you have a better ASCII art for claude plz make a PR```


### DVD Logo (`visuals/dvd-logo.txt`)

```
╔═══════════════════════════╗
║ ██████╗ ██╗   ██╗██████╗  ║
║ ██╔══██╗██║   ██║██╔══██╗ ║
║ ██║  ██║██║   ██║██║  ██║ ║
║ ██║  ██║╚██╗ ██╔╝██║  ██║ ║
║ ██████╔╝ ╚████╔╝ ██████╔╝ ║
║ ╚═════╝   ╚═══╝  ╚═════╝  ║
╚═══════════════════════════╝
```

> **Tip:** "Boxed" designs (with a border like `╔═╗║╚═╝`) tend to look better as overlays since they have a clear boundary against the terminal content.

## Configuration

### Custom Visuals

Drop any ASCII art `.txt` file into `visuals/`, then update `config.json`:

```json
{
  "dvd-bounce": {
    "artFile": "visuals/your-art.txt"
  }
}
```

### Colors

Edit the color palette in `src/animations/dvd-bounce.js`:

```js
this.colors = [174, 114, 186, 110, 139, 152];
```

Values are [256-color ANSI codes](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit).

### FPS

Adjust animation speed in `config.json`:

```json
{
  "fps": 15
}
```

## Attributions
Inspired by https://x.com/itseieio/status/2029643861866299857?s=46
