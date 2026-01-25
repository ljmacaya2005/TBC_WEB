#!/bin/bash
cd "$(dirname "$0")"
cd ..

echo "Updating repository at: $(pwd)"
git fetch --all
git reset --hard origin/main

read -p "Press [Enter] to continue..."