#!/bin/bash
echo "[hook] stop-overlay fired at $(date)" >> /tmp/claude-overlay-debug.log
echo "stop" | nc -U /tmp/claude-overlay.sock 2>>/tmp/claude-overlay-debug.log
echo "[hook] stop-overlay nc exit: $?" >> /tmp/claude-overlay-debug.log
