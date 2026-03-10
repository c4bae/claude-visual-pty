#!/bin/bash
echo "start" | nc -U /tmp/claude-overlay.sock 2>/dev/null
