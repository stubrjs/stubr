#!/bin/bash
set -e

echo "🚧 building Stubr UI..."
cd ./packages/stubr-ui && yarn build
cd ../../

echo "🚧 building Stubr..."
cd ./packages/core && yarn build
cd ../../
