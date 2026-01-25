#!/bin/bash
cd "$(dirname "$0")"
cd ..

echo "Checking commits for repository at: $(pwd)"
echo ""

git log --oneline --graph --all --decorate

echo ""
read -p "Press [Enter] to continue..."