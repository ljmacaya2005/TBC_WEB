#!/bin/bash
cd "$(dirname "$0")"
cd ..

echo "Target Branch: [main]"
echo "Working Directory: $(pwd)"
echo ""

echo "Adding all files..."
git add .

echo ""
read -p "Enter commit message: " user_message

if [ -z "$user_message" ]; then
    user_message="Auto-update $(date)"
fi

git commit -m "$user_message"

echo ""
echo "Pushing branch 'main' to origin..."
git push -u origin main

echo ""
if [ $? -ne 0 ]; then
    echo "[ERROR] Push failed. Check your internet or login credentials."
else
    echo "[SUCCESS] Push complete!"
fi

read -p "Press [Enter] to continue..."