set -e


echo "You're currently working in:"
pwd

echo "Files in src:"
ls -al src/

cleanUp="true"

if [ $# -gt 0 ]; then
  if [ $1 == "false" ]; then
    cleanUp="false"
  fi 
fi

echo "Getting ready by cleaning up..."

if [ -d dist ]; then
  rm -Rf dist
fi
if [ -d build ]; then
  rm -Rf build
fi

mkdir dist build
rsync -avh --exclude-from=<(cd src && git ls-files --exclude-standard --ignored --others --directory) ./src/ ./build
if [ $? -ne 0 ]; then
  echo "ERROR: rsync of src to build failed"
  exit 1
fi

echo "Files in build:"
ls -al build/

rsync -avh  ./build/ ./dist
if [ $? -ne 0 ]; then
  echo "ERROR: rsync of build to dist failed"
  exit 1
fi

echo "Files in dist:"
ls -al dist/

if [ "$cleanUp" == "true" ]; then
  rm -Rf build
fi

echo "Build completed successfully."
exit 0
