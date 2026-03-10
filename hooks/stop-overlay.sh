#!/bin/bash
echo "stop" | nc -U /tmp/claude-overlay.sock 2>/dev/null
