#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Claude Thinking Overlay Installer ==="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js >= 18 is required. Current: $(node -v 2>/dev/null || echo 'not found')"
  exit 1
fi
echo "[ok] Node.js $(node -v)"

# Install dependencies
echo "Installing dependencies..."
cd "$SCRIPT_DIR"
npm install
echo "[ok] Dependencies installed"

# Make scripts executable
chmod +x "$SCRIPT_DIR/bin/claude-pty"
chmod +x "$SCRIPT_DIR/hooks/start-overlay.sh"
chmod +x "$SCRIPT_DIR/hooks/stop-overlay.sh"
echo "[ok] Scripts made executable"

# Configure Claude Code hooks
SETTINGS_DIR="$HOME/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"

mkdir -p "$SETTINGS_DIR"

if [ -f "$SETTINGS_FILE" ]; then
  echo ""
  echo "Found existing settings at $SETTINGS_FILE"
  echo "Please add the following hooks manually to your settings.json:"
  echo ""
  cat <<HOOKEOF
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "$SCRIPT_DIR/hooks/start-overlay.sh" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "$SCRIPT_DIR/hooks/stop-overlay.sh" }]
      }
    ]
  }
}
HOOKEOF
else
  cat > "$SETTINGS_FILE" <<HOOKEOF
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "$SCRIPT_DIR/hooks/start-overlay.sh" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "$SCRIPT_DIR/hooks/stop-overlay.sh" }]
      }
    ]
  }
}
HOOKEOF
  echo "[ok] Claude Code hooks configured at $SETTINGS_FILE"
fi

echo ""
echo "=== Installation complete ==="
echo ""
echo "Usage: Run 'claude-overlay' instead of 'claude'"
echo "  Or add to your PATH: export PATH=\"$SCRIPT_DIR/bin:\$PATH\""
