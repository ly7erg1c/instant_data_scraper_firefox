# Instant Data Scraper

A powerful cross-browser extension for extracting tabular data from web pages and exporting it as CSV or Excel files.

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

```
instant_data_scraper/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface  
├── popup.js              # Main extension logic
├── popup.css             # Extension styling
├── onload.js             # Content script for page analysis
├── onload.css            # Content script styling
├── background.js         # Background script
├── js/                   # JavaScript dependencies
│   ├── jquery-3.1.1.min.js
│   └── sha256.min.js
└── icons/                # Extension icons
```

## Version History

### v1.3.0 (2025-01-29)
- **Enhanced Firefox compatibility** with multiple fallback detection methods
- **Improved content script injection** with alternative strategies
- **Cross-browser API normalization** for better compatibility
- **Production optimization** with cleaned up code and improved error handling

### v1.2.1
- Basic Firefox support
- Cross-browser popup interface
- CSV export functionality

## Development

### Prerequisites
- Modern web browser (Chrome 88+, Firefox 57+, Edge 88+)
- Basic understanding of web extensions

### Local Development
1. Clone the repository
2. Load as unpacked extension in your browser
3. Make changes to the code
4. Reload the extension to test changes

### Building for Production
The extension is production-ready as-is. No build process required.

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
