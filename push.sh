#!/usr/bin/env bash

read -p "Commit Message: " msg

if [ -z "$msg" ]; then
    echo "Abbruch: Keine Commit Message eingegeben."
    exit 1
fi

git add -A && git commit -m "$msg" && git push