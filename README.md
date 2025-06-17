# Instant Data Scraper - Firefox Compatible Version

A cross-browser extension for extracting data from web pages, optimized for Firefox compatibility.

## Features

- **Cross-browser compatibility** - Works on Chrome, Firefox, Edge, and other Chromium-based browsers
- **Intelligent table detection** - Automatically finds and analyzes tables on any webpage
- **Multiple export formats** - Download data as CSV or copy to clipboard
- **Multi-page scraping** - Crawl through multiple pages with pagination support
- **Firefox optimized** - Special compatibility layer for Firefox with enhanced security compliance
- **No registration required** - Works instantly on any website

## Installation

### Chrome Web Store / Edge Add-ons
*Coming soon - extension will be available on official stores*

### Manual Installation (Development)

#### Chrome/Edge
1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

#### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file

### Firefox Installation

#### From Developer Mode (For Development/Testing)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" tab
3. Click "Load Temporary Add-on"
4. Navigate to the extension directory and select `manifest.json`
5. The extension will be loaded temporarily (until Firefox restart)

#### Creating Firefox Extension Package (.xpi)

To create a proper Firefox extension package that passes validation:

1. **Exclude problematic files** - The following files should NOT be included in the Firefox package:
   - `.git/` directory (causes validation warnings)
   - `README.md` (development file)
   - `validation_report.html` (development file)
   - `.gitignore` (development file)
   - `.cursor/` directory (development files)
   - `js/sha256.min.js` (not needed, replaced with safer hash function)
   - `js/handsontable.full.min.js` (not needed in Firefox version)
   - `js/handsontable.full.min-new.js` (not needed in Firefox version)
   - `js/xlsx.full.min.js` (not supported in Firefox version)

2. **Create clean package directory**:
   ```bash
   mkdir firefox_package
   cp manifest.json firefox_package/
   cp background.js firefox_package/
   cp popup.html firefox_package/
   cp popup.js firefox_package/
   cp popup.css firefox_package/
   cp onload.js firefox_package/
   cp onload.css firefox_package/
   cp *.png firefox_package/
   cp -r css firefox_package/
   cp -r fonts firefox_package/
   mkdir firefox_package/js
   cp js/jquery-3.1.1.min.js firefox_package/js/
   cp js/bootstrap.min.js firefox_package/js/
   cp js/papaparse.min.js firefox_package/js/
   cp js/FileSaver.js firefox_package/js/
   ```

3. **Create .xpi file**:
   ```bash
   cd firefox_package
   zip -r ../instant_data_scraper_firefox.xpi *
   ```

## Usage

1. **Navigate to any webpage** with tabular data
2. **Click the extension icon** in your browser toolbar
3. **Wait for analysis** - The extension will automatically detect tables
4. **Preview the data** - Review the extracted information
5. **Export your data** - Download as CSV or copy to clipboard
6. **Multi-page scraping** (optional) - Click "Locate Next" to crawl multiple pages

## Supported Websites

- Wikipedia tables
- E-commerce product listings
- News websites with data tables
- Government data portals
- Academic research sites
- And many more!

## Firefox Compatibility

This extension includes special compatibility enhancements for Firefox:

- Enhanced content script injection with multiple fallback methods
- Alternative table detection algorithms for stricter security environments
- Cross-browser API normalization
- Graceful degradation when content security policies are restrictive

## Technical Features

- **Cross-browser APIs** - Uses both `browser.*` and `chrome.*` namespaces
- **Content Security Policy compliant** - Works within Firefox's strict security model
- **jQuery integration** - Includes fallbacks for jQuery loading
- **Error resilience** - Multiple detection and extraction methods
- **Privacy focused** - All processing happens locally, no data sent to external servers

## File Structure

### Core Files (Required)
- `manifest.json` - Extension configuration
- `background.js` - Background script
- `popup.html` - Extension popup interface  
- `popup.js` - Main popup logic
- `popup.css` - Popup styling
- `onload.js` - Content script for table detection
- `onload.css` - Content script styling
- `pokeball*.png` - Extension icons

### JavaScript Dependencies
- `js/jquery-3.1.1.min.js` - DOM manipulation
- `js/bootstrap.min.js` - UI components
- `js/papaparse.min.js` - CSV parsing
- `js/FileSaver.js` - File download functionality

### Optional Assets
- `css/` - Additional styling
- `fonts/` - Font files
- `webrobots_logo.png` - Branding image

## Validation Notes

This version has been optimized to pass Firefox Add-on validation:
-  No eval() usage
-  Safe DOM manipulation  
-  Proper manifest format
-  No flagged file types
-  Security compliance
-  No git files included

## Key Firefox Compatibility Features

### Security Improvements
- Replaced `innerHTML` assignments with safe DOM manipulation
- Removed eval()-based libraries (sha256, handsontable)
- Implemented custom hash function for content comparison
- Fixed Content Security Policy compliance

### Manifest Changes
- Uses `browser_specific_settings` instead of deprecated `applications`
- Removed unsupported `incognito: "split"` setting
- Updated minimum Firefox version to 79.0 for proper browser_action support
- Removed problematic library dependencies

### Functional Differences from Chrome Version
- **No Handsontable**: Uses simple HTML table for preview instead
- **No XLSX Export**: Only CSV export available (uses PapaParse)
- **Simplified UI**: Reduced external dependencies for better compatibility
- **Enhanced Error Handling**: Better handling of Firefox-specific APIs

## Development

### Cross-Browser API Usage
The extension uses a compatibility pattern:
```javascript
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
```

This ensures the extension works in both Firefox (which uses `browser` API) and Chrome (which uses `chrome` API).

### Testing
1. Test in Firefox Developer Edition for latest features
2. Test in regular Firefox for compatibility
3. Verify all table detection and extraction features work
4. Test multi-page scraping functionality
5. Verify CSV export works correctly

## Privacy Policy

This extension:
- **Processes data locally** - All table extraction and processing happens in your browser
- **Does not collect personal information** - No tracking, analytics, or data collection
- **Does not transmit data** - No network requests to external servers
- **Requires minimal permissions** - Only requests access to active tabs when needed

## Support

For issues, feature requests, or questions:
- Create an issue in this repository
- Check existing issues for solutions
- Review the browser console for error messages

## License

This project is provided as-is for educational and personal use.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across browsers
5. Submit a pull request

---

**Instant Data Scraper** - Making web data extraction simple and accessible for everyone.
