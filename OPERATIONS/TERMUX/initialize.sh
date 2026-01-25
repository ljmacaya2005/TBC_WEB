#!/bin/bash
cd "$(dirname "$0")"
# Move one step back so we initialize the main folder, not the script folder
cd ..

echo "--- Initialize Git Repository ---"
# This will now create the .git folder in the parent directory
git init

git branch -M main

clear
echo "Repository initialized in: $(pwd)"
echo ""

read -p "Enter GitHub Username: " github_name
echo "Host Github Account: https://github.com/$github_name/"
echo ""
read -p "Enter repository name: " repo_name

echo ""
echo "Adding remote origin..."
git remote add origin "https://github.com/$github_name/$repo_name.git" || echo "Remote 'origin' already exists."

echo ""
echo "Done!"
read -p "Press [Enter] to continue..."