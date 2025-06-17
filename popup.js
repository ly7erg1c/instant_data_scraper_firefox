/*! InstantDataScraperNext - 2025-01-29 - Firefox Compatible */

// Cross-browser compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Global variables
let currentTab = null;
let debugMode = true; // Enable detailed logging for troubleshooting
let extensionData = {
    tableId: null,
    scraping: false,
    failedToProcess: false,
    processingError: null,
    tableSelector: null,
    startingUrl: null,
    hostName: null,
    previewLength: 0,
    configName: null,
    config: { headers: {}, deletedFields: {}, crawlDelay: 1000, maxWait: 20000 },
    data: [],
    pages: 0,
    lastRows: 0,
    workingTime: 0,
    gettingNext: false,
    nextSelector: null
};

// Utility functions
function showMessage(message, elementId, isError = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (message === '') {
        element.style.display = 'none';
        return;
    }
    
    element.style.display = 'block';
    element.textContent = message;
    
    if (isError) {
        element.className = 'alert alert-danger';
    }
}

function getHostName(url) {
    try {
        const parts = new URL(url).hostname.split('.');
        return parts[0].indexOf('www') > -1 ? parts[1] : parts[0];
    } catch (e) {
        return 'unknown';
    }
}

function saveConfig() {
    if (extensionData.configName) {
        localStorage.setItem(extensionData.configName, JSON.stringify(extensionData.config));
    }
}

function updateStats() {
    const statsDiv = document.getElementById('stats');
    if (!statsDiv) return;
    
    statsDiv.innerHTML = `
        <div>Pages scraped: ${extensionData.pages}</div>
        <div>Rows collected: ${extensionData.data.length}</div>
        <div>Rows from last page: ${extensionData.lastRows}</div>
        <div>Working time: ${parseInt(extensionData.workingTime / 1000)}s</div>
    `;
}

// Debug logging function
function debugLog(message, data = null) {
    if (debugMode) {
        console.log(`[Instant Data Scraper Debug] ${message}`, data || '');
    }
}

// Enhanced error checking for Firefox
function checkFirefoxCompatibility() {
    debugLog('Checking Firefox compatibility...');
    
    if (typeof browser !== 'undefined') {
        debugLog('Firefox browser API detected');
        
        // Check if we have necessary permissions
        return new Promise((resolve) => {
            browserAPI.permissions.contains({
                permissions: ['activeTab'],
                origins: [currentTab.url]
            }, (result) => {
                debugLog('Permission check result:', result);
                resolve(result);
            });
        });
    }
    
    debugLog('Chrome browser API detected');
    return Promise.resolve(true);
}

// Alternative table detection method for Firefox
function alternativeTableDetection() {
    debugLog('Attempting alternative table detection...');
    
    return new Promise((resolve) => {
        // Inject a simpler table detection script directly
        const simpleDetectionCode = `
            (function() {
                console.log('[Alternative Detection] Starting...');
                
                // Simple table detection
                const tables = document.querySelectorAll('table');
                console.log('[Alternative Detection] Found tables:', tables.length);
                
                if (tables.length > 0) {
                    const tableData = [];
                    tables.forEach((table, index) => {
                        const rows = table.querySelectorAll('tr');
                        console.log('[Alternative Detection] Table', index, 'has', rows.length, 'rows');
                        
                        if (rows.length > 2) { // At least header + 2 data rows
                            tableData.push({
                                tableId: index,
                                selector: 'table:nth-of-type(' + (index + 1) + ')',
                                rowCount: rows.length
                            });
                        }
                    });
                    
                    console.log('[Alternative Detection] Valid tables:', tableData);
                    return tableData.length > 0 ? tableData[0] : null;
                }
                
                // Look for div-based tables (common in modern websites)
                const divTables = document.querySelectorAll('[role="table"], .table, .data-table, [class*="table"]');
                console.log('[Alternative Detection] Found div tables:', divTables.length);
                
                if (divTables.length > 0) {
                    for (let i = 0; i < divTables.length; i++) {
                        const children = divTables[i].children;
                        if (children.length > 3) {
                            console.log('[Alternative Detection] Found div table with', children.length, 'children');
                            return {
                                tableId: 0,
                                selector: divTables[i].tagName.toLowerCase() + ':nth-of-type(' + (i + 1) + ')',
                                rowCount: children.length
                            };
                        }
                    }
                }
                
                console.log('[Alternative Detection] No suitable tables found');
                return null;
            })();
        `;
        
        browserAPI.tabs.executeScript(currentTab.id, {
            code: simpleDetectionCode
        }, (result) => {
            if (browserAPI.runtime.lastError) {
                debugLog('Alternative detection failed:', browserAPI.runtime.lastError);
                resolve(null);
                return;
            }
            
            debugLog('Alternative detection result:', result);
            
            if (result && result[0]) {
                resolve(result[0]);
            } else {
                resolve(null);
            }
        });
    });
}

// Enhanced permission check and setup
async function checkPermissionsAndSetup() {
    debugLog('Checking permissions and setup...');
    
    try {
        // For Firefox, check if we can access the tab
        if (typeof browser !== 'undefined') {
            const hasPermission = await checkFirefoxCompatibility();
            if (!hasPermission) {
                showMessage('Extension needs permission to access this page. Please reload the page and try again.', 'noResponseErr', true);
                return false;
            }
        }
        
        // Test basic tab access
        return new Promise((resolve) => {
            browserAPI.tabs.get(currentTab.id, (tab) => {
                if (browserAPI.runtime.lastError) {
                    debugLog('Tab access failed:', browserAPI.runtime.lastError);
                    showMessage('Unable to access current tab. Please refresh and try again.', 'noResponseErr', true);
                    resolve(false);
                } else {
                    debugLog('Tab access successful:', tab);
                    resolve(true);
                }
            });
        });
        
    } catch (error) {
        debugLog('Permission check error:', error);
        return false;
    }
}

// Enhanced content script injection with multiple fallbacks
async function injectContentScriptAndRetry() {
    debugLog('Starting enhanced content script injection...');
    
    // First, check permissions
    const hasPermissions = await checkPermissionsAndSetup();
    if (!hasPermissions) {
        return;
    }
    
    // For Firefox, check if content script is already available before injecting
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo) {
        debugLog('Firefox detected - checking existing content script...');
        
        // This is Firefox - try to send message first to see if content script is loaded
        browserAPI.tabs.sendMessage(currentTab.id, { action: 'findTables' }, (response) => {
            if (browserAPI.runtime.lastError || !response) {
                debugLog('Content script not available, trying injection...', browserAPI.runtime.lastError);
                // Content script not available, try to inject
                injectContentScript();
            } else if (response.tableId !== undefined) {
                debugLog('Content script responded successfully:', response);
                processTableData(response);
            } else {
                debugLog('Content script responded but no tables found, trying alternative...');
                tryAlternativeDetection();
            }
        });
    } else {
        debugLog('Chrome detected - injecting directly...');
        // Chrome - inject directly
        injectContentScript();
    }
}

async function tryAlternativeDetection() {
    debugLog('Trying alternative table detection...');
    
    const result = await alternativeTableDetection();
    if (result) {
        debugLog('Alternative detection found table:', result);
        // Simulate a response similar to the content script
        processTableData({
            tableId: result.tableId,
            tableSelector: result.selector,
            alternativeDetection: true
        });
    } else {
        debugLog('Alternative detection also failed');
        showMessage('No tables detected on this page. This may be due to the page structure or Firefox security restrictions.', 'noResponseErr', true);
    }
}

function injectContentScript() {
    debugLog('Injecting content script...');
    
    // First try injecting jQuery
    browserAPI.tabs.executeScript(currentTab.id, {
        file: 'js/jquery-3.1.1.min.js'
    }, () => {
        if (browserAPI.runtime.lastError) {
            debugLog('jQuery injection failed:', browserAPI.runtime.lastError);
            
            // Try alternative: inject jQuery from CDN
            const jqueryCode = `
                if (typeof $ === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://code.jquery.com/jquery-3.1.1.min.js';
                    script.onload = function() {
                        console.log('jQuery loaded from CDN');
                        window.$ = jQuery.noConflict();
                    };
                    document.head.appendChild(script);
                }
            `;
            
            browserAPI.tabs.executeScript(currentTab.id, {
                code: jqueryCode
            }, () => {
                if (browserAPI.runtime.lastError) {
                    debugLog('CDN jQuery injection also failed, proceeding without jQuery...');
                }
                injectMainScript();
            });
        } else {
            debugLog('jQuery injection successful');
            injectMainScript();
        }
    });
}

function injectMainScript() {
    debugLog('Injecting main content script...');
    
    // Inject the main content script
    browserAPI.tabs.executeScript(currentTab.id, {
        file: 'onload.js'
    }, () => {
        if (browserAPI.runtime.lastError) {
            debugLog('Main script injection failed:', browserAPI.runtime.lastError);
            
            // Try alternative approach - inject a simplified version inline
            tryInlineScriptInjection();
        } else {
            debugLog('Main script injection successful');
            retryTableSearch();
        }
    });
}

function tryInlineScriptInjection() {
    debugLog('Trying inline script injection...');
    
    const inlineScript = `
        // Simplified table detection for Firefox
        (function() {
            console.log('Inline script running...');
            
            function findSimpleTables() {
                const tables = [];
                const allTables = document.querySelectorAll('table');
                
                allTables.forEach((table, index) => {
                    const rows = table.querySelectorAll('tr');
                    if (rows.length > 2) {
                        tables.push({
                            table: table,
                            selector: 'table:nth-of-type(' + (index + 1) + ')',
                            rowCount: rows.length
                        });
                    }
                });
                
                return tables;
            }
            
            // Set up message listener for inline script
            if (typeof browser !== 'undefined') {
                browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if (message.action === 'findTables') {
                        const tables = findSimpleTables();
                        if (tables.length > 0) {
                            sendResponse({
                                tableId: 0,
                                tableSelector: tables[0].selector,
                                inlineDetection: true
                            });
                        } else {
                            sendResponse({});
                        }
                    }
                    return true;
                });
            } else if (typeof chrome !== 'undefined') {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if (message.action === 'findTables') {
                        const tables = findSimpleTables();
                        if (tables.length > 0) {
                            sendResponse({
                                tableId: 0,
                                tableSelector: tables[0].selector,
                                inlineDetection: true
                            });
                        } else {
                            sendResponse({});
                        }
                    }
                    return true;
                });
            }
            
            console.log('Inline script setup complete');
        })();
    `;
    
    browserAPI.tabs.executeScript(currentTab.id, {
        code: inlineScript
    }, () => {
        if (browserAPI.runtime.lastError) {
            debugLog('Inline script injection also failed:', browserAPI.runtime.lastError);
            showMessage('Unable to inject content script due to Firefox security restrictions. Please try refreshing the page.', 'noResponseErr', true);
        } else {
            debugLog('Inline script injection successful');
            setTimeout(() => retryTableSearch(), 1000);
        }
    });
}

function retryTableSearch() {
    debugLog('Retrying table search...');
    
    // Wait a moment then try again
    setTimeout(() => {
        browserAPI.tabs.sendMessage(currentTab.id, { action: 'findTables' }, (response) => {
            if (browserAPI.runtime.lastError) {
                debugLog('Error after injection:', browserAPI.runtime.lastError);
                
                // One final attempt with alternative detection
                tryAlternativeDetection();
                return;
            }
            
            debugLog('Table search response:', response);
            
            if (response && response.tableId !== undefined) {
                processTableData(response);
            } else {
                debugLog('No tables found in main script, trying alternative...');
                tryAlternativeDetection();
            }
        });
    }, 1000);
}

// Main initialization function
async function initializePopup() {
    debugLog('Initializing popup...');
    
    try {
        // Get the active tab using cross-browser API
        const tabs = await new Promise((resolve, reject) => {
            browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (browserAPI.runtime.lastError) {
                    reject(browserAPI.runtime.lastError);
                } else {
                    resolve(tabs);
                }
            });
        });
        
        if (tabs && tabs.length > 0) {
            currentTab = tabs[0];
            debugLog('Current tab:', currentTab);
            
            // Check if URL is LinkedIn (not supported)
            if (currentTab.url.toLowerCase().match(/\/\/[a-z]+\.linkedin\.com/)) {
                document.getElementById('waitHeader').style.display = 'none';
                showMessage('We\'re unable to collect data from LinkedIn. Sorry for the inconvenience.', 'noResponseErr', true);
                return;
            }
            
            // Check for Firefox-specific URL restrictions
            if (currentTab.url.startsWith('about:') || 
                currentTab.url.startsWith('moz-extension:') ||
                currentTab.url.startsWith('chrome:') ||
                currentTab.url.startsWith('chrome-extension:')) {
                document.getElementById('waitHeader').style.display = 'none';
                showMessage('Cannot access browser internal pages. Please navigate to a regular webpage.', 'noResponseErr', true);
                return;
            }
            
            // Initialize extension data
            extensionData.hostName = getHostName(currentTab.url);
            extensionData.startingUrl = currentTab.url;
            extensionData.configName = extensionData.hostName + '-config';
            
            debugLog('Extension data initialized:', extensionData);
            
            // Load saved configuration
            const savedConfig = localStorage.getItem(extensionData.configName);
            if (savedConfig) {
                try {
                    extensionData.config = JSON.parse(savedConfig);
                } catch (e) {
                    console.warn('Failed to parse saved config:', e);
                }
            }
            
            // Set up event listeners
            setupEventListeners();
            
            // Find tables on the page
            findTables();
            
        } else {
            showMessage('Unable to access current tab. Please refresh and try again.', 'noResponseErr', true);
        }
    } catch (error) {
        debugLog('Error initializing popup:', error);
        showMessage('Error initializing extension. Please try again.', 'noResponseErr', true);
    }
}

function setupEventListeners() {
    debugLog('Setting up event listeners...');
    
    // Download buttons
    const csvBtn = document.getElementById('csv');
    const xlsxBtn = document.getElementById('xlsx');
    const copyBtn = document.getElementById('copy');
    
    if (csvBtn) csvBtn.addEventListener('click', downloadCSV);
    if (xlsxBtn) xlsxBtn.addEventListener('click', downloadXLSX);
    if (copyBtn) copyBtn.addEventListener('click', copyData);
    
    // Control buttons
    const wrongTableBtn = document.getElementById('wrongTable');
    const nextBtn = document.getElementById('nextButton');
    const startBtn = document.getElementById('startScraping');
    const stopBtn = document.getElementById('stopScraping');
    const resetBtn = document.getElementById('resetColumns');
    
    if (wrongTableBtn) wrongTableBtn.addEventListener('click', tryAnotherTable);
    if (nextBtn) nextBtn.addEventListener('click', locateNextButton);
    if (startBtn) startBtn.addEventListener('click', startScraping);
    if (stopBtn) stopBtn.addEventListener('click', stopScraping);
    if (resetBtn) resetBtn.addEventListener('click', resetColumns);
    
    // Configuration inputs
    const crawlDelayInput = document.getElementById('crawlDelay');
    const maxWaitInput = document.getElementById('maxWait');
    const infiniteScrollCheckbox = document.getElementById('infinateScroll');
    
    if (crawlDelayInput) crawlDelayInput.addEventListener('input', updateCrawlDelay);
    if (maxWaitInput) maxWaitInput.addEventListener('input', updateMaxWait);
    if (infiniteScrollCheckbox) infiniteScrollCheckbox.addEventListener('change', toggleInfiniteScroll);
    
    // Set initial input values
    if (crawlDelayInput) crawlDelayInput.value = extensionData.config.crawlDelay / 1000;
    if (maxWaitInput) maxWaitInput.value = extensionData.config.maxWait / 1000;
    
    // Initially hide content and show wait message
    const contentDiv = document.getElementById('content');
    const waitDiv = document.getElementById('wait');
    if (contentDiv) contentDiv.style.display = 'none';
    if (waitDiv) waitDiv.style.display = 'block';
}

function findTables() {
    debugLog('Starting table search...');
    
    // Send message to content script to find tables
    browserAPI.tabs.sendMessage(currentTab.id, { action: 'findTables' }, (response) => {
        if (browserAPI.runtime.lastError) {
            debugLog('Error finding tables:', browserAPI.runtime.lastError);
            
            // Check if this is due to content script not being injected
            if (browserAPI.runtime.lastError.message && 
                (browserAPI.runtime.lastError.message.includes('Could not establish connection') ||
                 browserAPI.runtime.lastError.message.includes('Receiving end does not exist'))) {
                // Try to inject content script and retry
                injectContentScriptAndRetry();
            } else {
                showMessage('Unable to analyze this page. Please make sure the page is fully loaded and try refreshing.', 'noResponseErr', true);
            }
            return;
        }
        
        debugLog('Initial table search response:', response);
        
        if (response && response.tableId !== undefined) {
            // Table found, process it
            processTableData(response);
        } else {
            // Try to inject content script and retry
            injectContentScriptAndRetry();
        }
    });
}

function processTableData(tableData) {
    debugLog('Processing table data:', tableData);
    
    extensionData.tableId = tableData.tableId;
    extensionData.tableSelector = tableData.tableSelector;
    
    // Hide wait message and show content
    const waitDiv = document.getElementById('wait');
    const contentDiv = document.getElementById('content');
    if (waitDiv) waitDiv.style.display = 'none';
    if (contentDiv) contentDiv.style.display = 'block';
    
    // Show instructions
    showMessage('Download data or locate "Next" to crawl multiple pages', 'instructions');
    
    // Show wrong table button
    const wrongTableBtn = document.getElementById('wrongTable');
    if (wrongTableBtn) wrongTableBtn.style.display = 'block';
    
    // If this was from alternative detection, extract data directly
    if (tableData.alternativeDetection || tableData.inlineDetection) {
        debugLog('Using alternative/inline detection data extraction...');
        extractAlternativeTableData(tableData);
        return;
    }
    
    // Request table data from content script
    browserAPI.tabs.sendMessage(currentTab.id, { action: 'getTableData' }, (response) => {
        if (browserAPI.runtime.lastError) {
            debugLog('Error getting table data:', browserAPI.runtime.lastError);
            
            // Fallback to alternative extraction
            extractAlternativeTableData(tableData);
            return;
        }
        
        debugLog('Table data response:', response);
        
        if (response && response.data) {
            if (response.error) {
                showMessage('Something went wrong!', 'noResponseErr', true);
                return;
            }
            
            extensionData.data = response.data;
            extensionData.pages = 1;
            extensionData.lastRows = response.data.length;
            
            if (response.failedToProcess) {
                showMessage('Failed to process rows on server. Showing raw data instead.', 'error', false);
                extensionData.failedToProcess = true;
            }
            
            updateStats();
            displayPreview();
            
            // Show download buttons
            document.querySelectorAll('.download-button').forEach(btn => {
                btn.style.display = 'block';
            });
            
            // Show next button
            const nextBtn = document.getElementById('nextButton');
            if (nextBtn) nextBtn.style.display = 'block';
        } else {
            debugLog('No data in response, trying alternative extraction...');
            extractAlternativeTableData(tableData);
        }
    });
}

// Alternative data extraction for when content script fails
function extractAlternativeTableData(tableData) {
    debugLog('Extracting table data using alternative method...');
    
    const extractionCode = `
        (function() {
            console.log('[Alternative Extraction] Starting for selector:', '${tableData.selector}');
            
            const tables = document.querySelectorAll('table');
            console.log('[Alternative Extraction] Found', tables.length, 'tables');
            
            if (tables.length === 0) {
                return [];
            }
            
            const table = tables[0]; // Use first table for now
            const rows = table.querySelectorAll('tr');
            const data = [];
            
            console.log('[Alternative Extraction] Processing', rows.length, 'rows');
            
            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length > 0) {
                    const rowData = {};
                    cells.forEach((cell, cellIndex) => {
                        const columnName = 'Column_' + (cellIndex + 1);
                        rowData[columnName] = cell.textContent.trim();
                    });
                    data.push(rowData);
                }
            });
            
            console.log('[Alternative Extraction] Extracted', data.length, 'rows');
            return data;
        })();
    `;
    
    browserAPI.tabs.executeScript(currentTab.id, {
        code: extractionCode
    }, (result) => {
        if (browserAPI.runtime.lastError) {
            debugLog('Alternative extraction failed:', browserAPI.runtime.lastError);
            showMessage('Unable to extract table data. Firefox security restrictions may prevent data extraction.', 'error', true);
            return;
        }
        
        debugLog('Alternative extraction result:', result);
        
        if (result && result[0] && result[0].length > 0) {
            extensionData.data = result[0];
            extensionData.pages = 1;
            extensionData.lastRows = result[0].length;
            
            showMessage('Table data extracted using alternative method. Some features may be limited.', 'instructions');
            
            updateStats();
            displayPreview();
            
            // Show download buttons
            document.querySelectorAll('.download-button').forEach(btn => {
                btn.style.display = 'block';
            });
            
        } else {
            showMessage('No table data could be extracted from this page.', 'error', true);
        }
    });
}

function displayPreview() {
    // Simple table preview
    const hotDiv = document.getElementById('hot');
    if (!hotDiv || !extensionData.data.length) return;
    
    const previewData = extensionData.data.slice(0, 100); // Show first 100 rows
    extensionData.previewLength = previewData.length;
    
    let html = '<div style="overflow: auto; max-height: 400px;">';
    html += '<table class="table table-striped table-condensed table-bordered">';
    
    // Add headers if we have data
    if (previewData.length > 0) {
        html += '<thead><tr>';
        Object.keys(previewData[0]).forEach(key => {
            const displayKey = extensionData.config.headers[key] || key;
            html += `<th style="position: sticky; top: 0; background: white; border-bottom: 2px solid #ddd;">${displayKey}</th>`;
        });
        html += '</tr></thead>';
    }
    
    // Add data rows
    html += '<tbody>';
    previewData.forEach(row => {
        html += '<tr>';
        Object.values(row).forEach(cell => {
            const cellContent = String(cell || '').substring(0, 200);
            html += `<td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${cellContent}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    if (extensionData.data.length > 100) {
        html += `<p class="text-muted"><em>Preview limited to 100 rows. Total: ${extensionData.data.length} rows</em></p>`;
    }
    
    hotDiv.innerHTML = html;
}

// Download functions
function downloadCSV() {
    if (!extensionData.data.length) return;
    
    const csvContent = convertToCSV(extensionData.data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extensionData.hostName || 'scraped_data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('CSV download initiated');
}

function downloadXLSX() {
    // For Firefox compatibility, we'll just show a message that XLSX isn't supported
    showMessage('XLSX download is not available in the Firefox version. Please use CSV download instead.', 'error', false);
}

function copyData() {
    if (!extensionData.data.length) return;
    
    const csvContent = convertToCSV(extensionData.data, '\t'); // Use tabs for better pasting
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(csvContent).then(() => {
            showMessage('Data copied to clipboard!', 'instructions');
        }).catch((err) => {
            console.error('Clipboard API failed:', err);
            fallbackCopyMethod(csvContent);
        });
    } else {
        fallbackCopyMethod(csvContent);
    }
}

function fallbackCopyMethod(text) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('Data copied to clipboard!', 'instructions');
    } catch (err) {
        showMessage('Unable to copy data to clipboard', 'error', true);
    }
    
    document.body.removeChild(textArea);
}

function convertToCSV(data, delimiter = ',') {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row with renamed headers if available
    const headerRow = headers.map(header => {
        const displayHeader = extensionData.config.headers[header] || header;
        return delimiter === ',' ? `"${displayHeader.replace(/"/g, '""')}"` : displayHeader;
    });
    csvRows.push(headerRow.join(delimiter));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            const stringValue = String(value);
            return delimiter === ',' ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        });
        csvRows.push(values.join(delimiter));
    });
    
    return csvRows.join('\n');
}

// Control functions
function tryAnotherTable() {
    const hotDiv = document.getElementById('hot');
    if (hotDiv) hotDiv.innerHTML = '';
    
    browserAPI.tabs.sendMessage(currentTab.id, { action: 'nextTable' }, (response) => {
        if (response && response.tableId) {
            processTableData(response);
        } else {
            showMessage('No more tables found on this page.', 'error', true);
        }
    });
}

function locateNextButton() {
    showMessage('Mark "Next" button or link on the page', 'instructions');
    extensionData.gettingNext = true;
    
    // Start listening for next button selection
    pollForNextButton();
}

function pollForNextButton() {
    if (!extensionData.gettingNext) return;
    
    browserAPI.tabs.sendMessage(currentTab.id, { action: 'getNextButton' }, (response) => {
        if (!extensionData.scraping) {
            if (extensionData.gettingNext) {
                if (response && response.selector) {
                    extensionData.nextSelector = response.selector;
                    localStorage.setItem(`nextSelector:${extensionData.hostName}`, response.selector);
                    showMessage('"Next" button located. Press "Start crawling" to get more pages or mark another button/link if marked incorrectly.', 'instructions');
                    
                    const startBtn = document.getElementById('startScraping');
                    if (startBtn) startBtn.style.display = 'block';
                    
                    extensionData.gettingNext = false;
                } else {
                    setTimeout(pollForNextButton, 1000);
                }
            }
        }
    });
}

function startScraping() {
    extensionData.gettingNext = false;
    extensionData.scraping = true;
    
    const startBtn = document.getElementById('startScraping');
    const stopBtn = document.getElementById('stopScraping');
    
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'block';
    
    showMessage('', 'error');
    showMessage('Please wait for more pages or press "Stop crawling".', 'instructions');
    
    const infiniteScrollCheckbox = document.getElementById('infinateScroll');
    if (infiniteScrollCheckbox && infiniteScrollCheckbox.checked) {
        const infiniteScrollElement = document.getElementById('infinateScrollElement');
        if (infiniteScrollElement) infiniteScrollElement.style.display = 'none';
    }
    
    const startTime = new Date();
    
    // Start the scraping process
    scrapeNextPage(startTime);
}

function scrapeNextPage(startTime) {
    if (!extensionData.scraping) return;
    
    const isInfiniteScroll = document.getElementById('infinateScroll')?.checked;
    
    const scrollAction = () => {
        browserAPI.tabs.sendMessage(currentTab.id, {
            action: 'scrollDown',
            selector: extensionData.tableSelector
        }, handleScrollOrClickResponse);
    };
    
    const clickAction = () => {
        browserAPI.tabs.sendMessage(currentTab.id, {
            action: 'clickNext',
            selector: extensionData.nextSelector
        }, handleScrollOrClickResponse);
    };
    
    const action = isInfiniteScroll ? scrollAction : clickAction;
    
    // Use a request waiting mechanism
    waitForPageLoad(() => {
        browserAPI.tabs.sendMessage(currentTab.id, {
            action: 'getTableData',
            selector: extensionData.tableSelector
        }, (response) => {
            if (response) {
                if (response.error) {
                    showMessage('', 'instructions');
                    showMessage(response.error, response.errorId || 'error', true);
                    return;
                }
                
                const previousLength = extensionData.data.length;
                
                if (response.failedToProcess) {
                    showMessage('Failed to process rows. Showing raw data instead.', 'error', false);
                    extensionData.failedToProcess = true;
                    extensionData.processingError = response.processingError;
                } else {
                    const errorDiv = document.getElementById('error');
                    if (errorDiv) errorDiv.style.display = 'none';
                    extensionData.failedToProcess = false;
                }
                
                extensionData.lastRows = response.data.length;
                extensionData.pages++;
                extensionData.workingTime += new Date() - startTime;
                
                // Merge new data, removing duplicates
                mergeNewData(response.data);
                
                updateStats();
                
                if (extensionData.previewLength < 100) {
                    displayPreview();
                } else {
                    showMessage('Preview limited to 100 rows.', 'previewLimit');
                }
                
                // Continue scraping if still active and got new data
                if (extensionData.scraping && extensionData.data.length > previousLength) {
                    setTimeout(() => scrapeNextPage(new Date()), extensionData.config.crawlDelay);
                } else if (extensionData.data.length === previousLength) {
                    showMessage('No new data found. Scraping complete.', 'instructions');
                    stopScraping();
                }
            }
        });
    }, currentTab.id, extensionData.config.maxWait, 100, extensionData.config.crawlDelay);
    
    function handleScrollOrClickResponse(response) {
        if (response && response.error) {
            showMessage('', 'instructions');
            showMessage(response.error, response.errorId || 'error', true);
            return;
        }
        
        const wrongTableBtn = document.getElementById('wrongTable');
        if (wrongTableBtn) wrongTableBtn.style.display = 'none';
    }
    
    action();
}

function mergeNewData(newData) {
    // Simple deduplication by converting to JSON strings
    const existingDataStrings = new Set(extensionData.data.map(row => JSON.stringify(row)));
    
    newData.forEach(row => {
        const rowString = JSON.stringify(row);
        if (!existingDataStrings.has(rowString)) {
            extensionData.data.push(row);
            existingDataStrings.add(rowString);
        }
    });
}

function waitForPageLoad(callback, tabId, maxWait, checkInterval, delay, isConnectedCheck) {
    let requestIds = {};
    let lastRequestTime = null;
    let listenersStopped = false;
    let pageLoadFinished = false;
    
    const filters = {
        urls: ["<all_urls>"],
        tabId: tabId,
        types: ["main_frame", "sub_frame", "stylesheet", "script", "font", "object", "xmlhttprequest", "other"]
    };
    
    function finishWaiting() {
        if (!listenersStopped && pageLoadFinished) {
            if (isConnectedCheck) {
                isConnectedCheck((connected) => {
                    if (!connected) return checkForCompletion();
                    listenersStopped = true;
                    
                    if (browserAPI.webRequest && browserAPI.webRequest.onBeforeRequest) {
                        browserAPI.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
                        browserAPI.webRequest.onCompleted.removeListener(onRequestComplete);
                        browserAPI.webRequest.onErrorOccurred.removeListener(onRequestComplete);
                    }
                    
                    callback();
                });
            } else {
                callback();
            }
        }
    }
    
    function onBeforeRequest(details) {
        requestIds[details.requestId] = 1;
        lastRequestTime = new Date();
    }
    
    function onRequestComplete(details) {
        if (lastRequestTime) {
            delete requestIds[details.requestId];
            if (Object.keys(requestIds).length === 0) {
                checkForCompletion();
            }
        }
    }
    
    function checkForCompletion() {
        setTimeout(() => {
            if (new Date() - lastRequestTime < delay || Object.keys(requestIds).length > 0) {
                return;
            }
            finishWaiting();
        }, delay);
    }
    
    // Add listeners if webRequest API is available
    if (browserAPI.webRequest && browserAPI.webRequest.onBeforeRequest) {
        browserAPI.webRequest.onBeforeRequest.addListener(onBeforeRequest, filters);
        browserAPI.webRequest.onCompleted.addListener(onRequestComplete, filters);
        browserAPI.webRequest.onErrorOccurred.addListener(onRequestComplete, filters);
    }
    
    // Start the action and wait
    const startAction = isConnectedCheck || (() => callback());
    startAction(() => {
        setTimeout(finishWaiting, maxWait);
        setTimeout(() => {
            pageLoadFinished = true;
            checkForCompletion();
        }, delay);
    });
}

function stopScraping() {
    extensionData.scraping = false;
    console.log('Scraping stopped.');
    
    const startBtn = document.getElementById('startScraping');
    const stopBtn = document.getElementById('stopScraping');
    
    if (startBtn) startBtn.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'none';
    
    showMessage('Crawling stopped. Please download data or continue crawling.', 'instructions');
}

function resetColumns() {
    extensionData.config.deletedFields = {};
    saveConfig();
    
    const resetBtn = document.getElementById('resetColumns');
    if (resetBtn) resetBtn.style.display = 'none';
    
    displayPreview();
}

function updateCrawlDelay() {
    const input = document.getElementById('crawlDelay');
    if (!input) return;
    
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0 || parseInt(value * 1000) >= extensionData.config.maxWait) {
        showMessage('Bad min waiting value', 'inputError', true);
        return;
    }
    
    showMessage('', 'inputError');
    extensionData.config.crawlDelay = parseInt(value * 1000);
    saveConfig();
}

function updateMaxWait() {
    const input = document.getElementById('maxWait');
    if (!input) return;
    
    const value = parseFloat(input.value);
    if (isNaN(value) || parseInt(value * 1000) <= extensionData.config.crawlDelay) {
        showMessage('Bad max waiting value', 'inputError', true);
        return;
    }
    
    showMessage('', 'inputError');
    extensionData.config.maxWait = parseInt(value * 1000);
    saveConfig();
}

function toggleInfiniteScroll() {
    const checkbox = document.getElementById('infinateScroll');
    if (!checkbox) return;
    
    const checked = checkbox.checked;
    extensionData.config.infinateScrollChecked = checked;
    
    const nextBtn = document.getElementById('nextButton');
    const startBtn = document.getElementById('startScraping');
    
    if (checked) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'block';
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (startBtn && !extensionData.nextSelector) {
            startBtn.style.display = 'none';
        }
    }
    
    saveConfig();
}

// Manual debugging function for troubleshooting
window.debugExtension = function() {
    debugLog('=== Manual Debug Information ===');
    debugLog('Current tab:', currentTab);
    debugLog('Extension data:', extensionData);
    debugLog('Browser API:', typeof browserAPI);
    debugLog('Browser namespace:', typeof browser !== 'undefined' ? 'browser' : 'chrome');
    
    // Test basic table detection
    if (currentTab) {
        browserAPI.tabs.executeScript(currentTab.id, {
            code: `
                console.log('=== Page Debug Info ===');
                console.log('Tables found:', document.querySelectorAll('table').length);
                console.log('jQuery available:', typeof $ !== 'undefined');
                console.log('Page URL:', window.location.href);
                console.log('Page title:', document.title);
                
                const tables = document.querySelectorAll('table');
                tables.forEach((table, i) => {
                    console.log('Table', i, '- rows:', table.querySelectorAll('tr').length);
                });
                
                return {
                    tables: tables.length,
                    jquery: typeof $ !== 'undefined',
                    url: window.location.href
                };
            `
        }, (result) => {
            debugLog('Page debug result:', result);
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
} else {
    initializePopup();
} 