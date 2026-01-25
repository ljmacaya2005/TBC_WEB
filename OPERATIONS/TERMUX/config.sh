#!/bin/bash
# 1. Go to the script's folder
cd "$(dirname "$0")"
# 2. Move one step back (to the project root)
cd ..

echo "--- Git Global Configuration ---"
read -p "Enter Git user.name (e.g. John Doe): " user_name
read -p "Enter Git user.email (e.g. email@example.com): " user_email

echo ""
echo "Setting Git global configs..."
git config --global user.name "$user_name"
git config --global user.email "$user_email"

echo ""
echo "--- Verification ---"
git config --global user.name
git config --global user.email
echo ""
echo "Git config saved!"
read -p "Press [Enter] to continue..."