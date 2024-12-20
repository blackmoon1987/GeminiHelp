// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "geminiHelp",
    title: "Gemini Help",
    contexts: ["all"]  // Allow right-click anywhere on the page
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "geminiHelp") {
    const contentKey = `pageContent_${tab.windowId}`;
    const fullPageKey = `fullPageContent_${tab.windowId}`;
    const urlKey = `pageUrl_${tab.windowId}`;
    const titleKey = `pageTitle_${tab.windowId}`;
    const selectionKey = `isSelection_${tab.windowId}`;

    // First, clear any existing data for this window
    chrome.storage.local.remove([contentKey, fullPageKey, urlKey, titleKey, selectionKey], () => {
      // If text is selected, get both selected text and full page
      if (info.selectionText) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageContent
        }).then(results => {
          if (results && results[0]) {
            const fullPageContent = results[0].result;
            chrome.storage.local.set({
              [contentKey]: info.selectionText,
              [fullPageKey]: fullPageContent,
              [urlKey]: tab.url,
              [titleKey]: tab.title,
              [selectionKey]: true
            }, () => {
              chrome.windows.create({
                url: `popup.html?windowId=${tab.windowId}`,
                type: 'popup',
                width: 400,
                height: 600
              });
            });
          }
        }).catch(err => {
          console.error('Failed to get full page content:', err);
          // Still proceed with selected text only
          chrome.storage.local.set({
            [contentKey]: info.selectionText,
            [urlKey]: tab.url,
            [titleKey]: tab.title,
            [selectionKey]: true
          }, () => {
            chrome.windows.create({
              url: `popup.html?windowId=${tab.windowId}`,
              type: 'popup',
              width: 400,
              height: 600
            });
          });
        });
      } else {
        // Get full page content only
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageContent
        }).then(results => {
          if (results && results[0]) {
            const pageContent = results[0].result;
            chrome.storage.local.set({
              [contentKey]: pageContent,
              [fullPageKey]: pageContent,
              [urlKey]: tab.url,
              [titleKey]: tab.title,
              [selectionKey]: false
            }, () => {
              chrome.windows.create({
                url: `popup.html?windowId=${tab.windowId}`,
                type: 'popup',
                width: 400,
                height: 600
              });
            });
          }
        }).catch(err => {
          console.error('Failed to execute script:', err);
        });
      }
    });
  }
});

// Function to extract page content
function getPageContent() {
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
  let content = '';
  
  elements.forEach(element => {
    const text = element.textContent.trim();
    if (text) {
      content += `${element.tagName.toLowerCase()}: ${text}\n`;
    }
  });
  
  return content;
}

// Clean up storage when windows are closed
chrome.windows.onRemoved.addListener((windowId) => {
    // Only remove window-specific data, keep lastUsedLanguage
    chrome.storage.local.remove([
        `pageContent_${windowId}`,
        `fullPageContent_${windowId}`,
        `pageUrl_${windowId}`,
        `pageTitle_${windowId}`,
        `isSelection_${windowId}`
    ], () => {
        if (chrome.runtime.lastError) {
            console.error('Error cleaning storage:', chrome.runtime.lastError);
        }
    });
});

// Clean up on extension unload
chrome.runtime.onSuspend.addListener(() => {
    chrome.storage.local.get(null, (items) => {
        // Only remove window-specific keys, keep lastUsedLanguage
        const keys = Object.keys(items).filter(key => 
            key.startsWith('pageContent_') || 
            key.startsWith('fullPageContent_') ||
            key.startsWith('pageUrl_') ||
            key.startsWith('pageTitle_') ||
            key.startsWith('isSelection_')
        );
        if (keys.length > 0) {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error cleaning up storage:', chrome.runtime.lastError);
                }
            });
        }
    });
});
