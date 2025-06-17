#!/bin/bash

# Firefox Extension Packaging Script
# This script creates a clean Firefox extension package (.xpi) without problematic files

set -e  # Exit on any error

echo "Building Firefox Extension Package..."

# Clean up any previous builds
rm -rf firefox_package
rm -f instant_data_scraper_firefox.xpi

# Create package directory
mkdir firefox_package

echo "Copying core extension files..."

# Copy core files
cp manifest.json firefox_package/
cp background.js firefox_package/
cp popup.html firefox_package/
cp popup.js firefox_package/
cp popup.css firefox_package/
cp onload.js firefox_package/
cp onload.css firefox_package/

# Copy icons
cp pokeball16.png firefox_package/
cp pokeball32.png firefox_package/
cp pokeball64.png firefox_package/
cp pokeball128.png firefox_package/
cp webrobots_logo.png firefox_package/

# Copy directories (excluding problematic files)
cp -r css firefox_package/
cp -r fonts firefox_package/

# Create js directory and copy only safe JavaScript files
mkdir firefox_package/js
cp js/jquery-3.1.1.min.js firefox_package/js/
cp js/bootstrap.min.js firefox_package/js/
cp js/papaparse.min.js firefox_package/js/
cp js/FileSaver.js firefox_package/js/

echo "Excluding problematic files:"
echo "   - .git/ directory"
echo "   - README.md"
echo "   - validation_report.html" 
echo "   - .gitignore"
echo "   - js/sha256.min.js (replaced with safe hash function)"
echo "   - js/handsontable.full.min.js (not needed in Firefox)"
echo "   - js/handsontable.full.min-new.js (not needed in Firefox)"
echo "   - js/xlsx.full.min.js (not supported in Firefox)"
echo "   - js/google-analytics.js (not needed)"

# Create the .xpi package
echo "Creating .xpi package..."
cd firefox_package
zip -r ../instant_data_scraper_firefox.xpi * -q

cd ..

# Cleanup
rm -rf firefox_package

echo "Firefox extension package created: instant_data_scraper_firefox.xpi"
echo ""
echo "Next steps:"
echo "1. Test locally: Navigate to about:debugging in Firefox"
echo "2. Click 'Load Temporary Add-on' and select the .xpi file"
echo "3. For Mozilla review: Upload instant_data_scraper_firefox.xpi to addons.mozilla.org"
echo ""
echo "This package should pass Firefox validation with:"
echo "   - No eval() usage"
echo "   - Safe DOM manipulation"
echo "   - Proper manifest format"
echo "   - No flagged file types"
echo "   - No git files included" 