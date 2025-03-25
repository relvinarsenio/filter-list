#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Compiling Enhanced Security DNS filter
hostlist-compiler -c configuration.json -o Filters/filter.txt --verbose
hostlist-compiler -c configuration-orion.json -o Filters/filter-orion.txt --verbose
node scripts/filter_build.js Filters/filter.txt
node scripts/filter_build.js Filters/filter-orion.txt
