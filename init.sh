#!/bin/bash

rm -fr .git/

rm README.md

read -p 'Enter the name of the extension (e.g. "Example Extension"): ' REPNAME;


REPCAMEL=$(echo $REPNAME | sed -e 's/\b\(.\)/\u\1/g' | sed -e 's/ //g')
REPDASH=$(echo $REPNAME | sed -e 's/\s/-/g' | tr '[:upper:]' '[:lower:]')

read -p "Enter the required version of php: " PHPVER;
read -p "Enter the required version of espocrm: " ESPOCVER;
read -p "Enter the description of extension: " DESC;

AUTHOR_NAME=$(git config --global --get user.name)
AUTHOR_EMAIL=$(git config --global --get user.email)

read -p "Enter the author name: " -i "$AUTHOR_NAME" -e AUTHOR_NAME
read -p "Enter the author email: " -i "$AUTHOR_EMAIL" -e AUTHOR_EMAIL
read -p "Do you want to push to remote repository? [y/n] " -i "y" -e PUSH;

find ./ -type f -exec sed -i "s/7.0/$ESPOCVER/g" {} \;
find ./ -type f -exec sed -i "s/7.2/$PHPVER/g" {} \;
find ./ -type f -exec sed -i "s/Email Combined View/$REPNAME/g" {} \;
find ./ -type f -exec sed -i "s/EmailCombinedView/$REPCAMEL/g" {} \;
find ./ -type f -exec sed -i "s/email-combined-view/$REPDASH/g" {} \;
find ./ -type f -exec sed -i "s/Quickly view e-mails in a compact combined view./${DESC//\"/\\\"}/g" {} \;

mv README.md.template README.md

npm install

git init
git switch -c main
git add .gitignore
git add .
git remote add origin "git@gitlab.apertia.cz:autocrm/modules/$REPDASH.git"

git config user.name "$AUTHOR_NAME"
git config  user.email "$AUTHOR_EMAIL"

git commit -m "Initial commit"

if [ "$PUSH" == "y" ]; then
    git push -u origin main
fi

echo ""
echo "Done! You can find your extension in the repository: https://gitlab.apertia.cz/autocrm/modules/$REPDASH"
echo "Main branch is protected from incoming pushes, so checkout to a new branch using 'git checkout -b <branch-name>'"

rm -- "$0"
