#!/bin/bash

# Compile typescript
grunt ts

# Copy relevant files
mkdir -p release
cp manifest.json release/
cp -r css release/
cp -r js release/
cp -r html release/
cp -r img release/

echo "Release compiled."
