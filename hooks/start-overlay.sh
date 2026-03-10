#!/bin/bash
echo "[hook] start-overlay fired at $(date)" >> /tmp/claude-overlay-debug.log
echo "start" | nc -U /tmp/claude-overlay.sock 2>>/tmp/claude-overlay-debug.log
echo "[hook] start-overlay nc exit: $?" >> /tmp/claude-overlay-debug.log
