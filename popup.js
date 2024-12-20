const GEMINI_API_KEY = 'AIzaSyAn7Xk7Fk4jZEy3KMmuer_5uekUw4nWjeA';
const CHUNK_SIZE = 500;

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

// Function to update UI language
function updateUILanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Handle placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Set RTL for Arabic
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const translateBtn = document.getElementById('translateBtn');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const languageSelect = document.getElementById('languageSelect');
    const resultDiv = document.getElementById('result');
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const loadingDiv = document.querySelector('.loading');
    const currentSite = document.getElementById('currentSite');
    const title = document.getElementById('title');
    const aboutBtn = document.querySelector('.about-btn');
    const aboutModal = document.getElementById('aboutModal');
    const modalClose = document.querySelector('.modal-close');

    // Get the window ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const windowId = urlParams.get('windowId');

    if (!windowId) {
        resultDiv.textContent = 'Error: No window ID found';
        return;
    }

    // About modal functionality
    aboutBtn.addEventListener('click', () => {
        aboutModal.style.display = 'block';
    });

    modalClose.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    // Load last used language and update UI
    chrome.storage.local.get(['lastUsedLanguage', 'lastUILanguage'], (result) => {
        if (result.lastUsedLanguage) {
            languageSelect.value = result.lastUsedLanguage;
        }
        
        // Set UI language
        const uiLang = result.lastUILanguage || navigator.language.split('-')[0];
        if (translations[uiLang]) {
            updateUILanguage(uiLang);
            languageSelect.value = uiLang;
        }
    });

    // Save language selection and update UI when changed
    languageSelect.addEventListener('change', () => {
        const lang = languageSelect.value;
        chrome.storage.local.set({ 
            'lastUsedLanguage': lang,
            'lastUILanguage': lang
        });
        updateUILanguage(lang);
    });

    function showProgress(show, percent = 0) {
        progressContainer.style.display = show ? 'block' : 'none';
        loadingDiv.style.display = show ? 'block' : 'none';
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Processing: ${percent}%`;
        
        // Disable buttons while processing
        [summarizeBtn, translateBtn, sendBtn].forEach(btn => btn.disabled = show);
        userInput.disabled = show;
        languageSelect.disabled = show;
    }

    // Get the stored page content, URL, title, and selection status
    chrome.storage.local.get([
        `pageContent_${windowId}`, 
        `pageUrl_${windowId}`,
        `pageTitle_${windowId}`,
        `isSelection_${windowId}`,
        `fullPageContent_${windowId}`
    ], async function(result) {
        let pageContent = result[`pageContent_${windowId}`] || '';
        const fullPageContent = result[`fullPageContent_${windowId}`] || pageContent;
        const pageUrl = result[`pageUrl_${windowId}`] || 'URL not available';
        const pageTitle = result[`pageTitle_${windowId}`] || '';
        let isSelection = result[`isSelection_${windowId}`] || false;
        
        // Update title and site info
        try {
            const url = new URL(pageUrl);
            const siteName = pageTitle || url.hostname.replace('www.', '');
            currentSite.textContent = siteName;
            title.textContent = `Gemini Help - ${siteName}`;

            // Show selection badge if text was selected
            if (isSelection) {
                document.body.classList.add('selection-active');
                
                // Add click handler for selection badge close button
                const closeBtn = document.querySelector('.selection-badge .close');
                closeBtn.addEventListener('click', () => {
                    // Switch to full page content
                    pageContent = fullPageContent; // Update the content being used
                    isSelection = false;
                    chrome.storage.local.set({
                        [`pageContent_${windowId}`]: fullPageContent,
                        [`isSelection_${windowId}`]: false
                    }, () => {
                        document.body.classList.remove('selection-active');
                        // Clear previous results
                        resultDiv.textContent = '';
                    });
                });
            }
        } catch (e) {
            currentSite.textContent = pageTitle || 'Unknown site';
            console.error('Error parsing URL:', e);
        }

        if (!pageContent) {
            resultDiv.textContent = 'Error: No content found';
            return;
        }

        async function makeGeminiRequest(prompt, content) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${isSelection ? 
                                `Selected text from: ${pageUrl}\nContext: This is a selected portion of text from the page.\n\n` : 
                                `Full page content from: ${pageUrl}\nContext: This is the entire page content.\n\n`}${prompt}\n\nContent:\n${content}`
                        }]
                    }],
                    safetySettings: [{
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        topK: 40,
                        topP: 0.95
                    }
                })
            });

            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error?.message || `API request failed: ${response.status}`);
            }

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }

            throw new Error('No response generated');
        }

        function splitTextPreservingTags(text, maxLength) {
            const chunks = [];
            let currentChunk = '';
            let tagStack = [];
            let currentLength = 0;
            
            const tokens = text.match(/<[^>]+>|[^<]+/g) || [];
            
            for (const token of tokens) {
                if (token.startsWith('<')) {
                    if (token.startsWith('</')) {
                        tagStack.pop();
                    } else if (!token.endsWith('/>')) {
                        tagStack.push(token.match(/<([a-zA-Z0-9]+)/)[1]);
                    }
                    currentChunk += token;
                } else {
                    const words = token.split(/\s+/);
                    for (const word of words) {
                        if (currentLength + word.length > maxLength && currentChunk) {
                            for (let i = tagStack.length - 1; i >= 0; i--) {
                                currentChunk += `</${tagStack[i]}>`;
                            }
                            chunks.push(currentChunk.trim());
                            
                            currentChunk = '';
                            for (const tag of tagStack) {
                                currentChunk += `<${tag}>`;
                            }
                            currentChunk += word + ' ';
                            currentLength = word.length + 1;
                        } else {
                            currentChunk += word + ' ';
                            currentLength += word.length + 1;
                        }
                    }
                }
            }
            
            if (currentChunk) {
                for (let i = tagStack.length - 1; i >= 0; i--) {
                    currentChunk += `</${tagStack[i]}>`;
                }
                chunks.push(currentChunk.trim());
            }
            
            return chunks;
        }

        async function processChunkedRequest(prompt) {
            showProgress(true, 0);
            resultDiv.textContent = '';
            
            // If it's selected text, don't chunk it
            if (isSelection) {
                try {
                    const response = await makeGeminiRequest(prompt, pageContent);
                    resultDiv.innerHTML = response.replace(/\n/g, '<br>');
                } catch (error) {
                    console.error('Error processing request:', error);
                    resultDiv.innerHTML = `Error: ${error.message}`;
                }
                showProgress(false);
                return;
            }

            // For full page content, use chunking
            const chunks = splitTextPreservingTags(pageContent, CHUNK_SIZE);
            let processedChunks = 0;

            for (const chunk of chunks) {
                try {
                    const response = await makeGeminiRequest(prompt, chunk);
                    resultDiv.innerHTML += response.replace(/\n/g, '<br>');
                    resultDiv.scrollTop = resultDiv.scrollHeight;

                    processedChunks++;
                    const progress = Math.round((processedChunks / chunks.length) * 100);
                    showProgress(true, progress);
                } catch (error) {
                    console.error('Error processing chunk:', error);
                    resultDiv.innerHTML += `<br>Error: ${error.message}<br>`;
                }
            }

            showProgress(false);
        }

        sendBtn.addEventListener('click', async () => {
            const instructions = userInput.value.trim();
            if (!instructions) {
                resultDiv.textContent = 'Please enter your instructions first.';
                return;
            }
            const prompt = `Please help with the following request: "${instructions}". Consider the content and respond in ${languageSelect.options[languageSelect.selectedIndex].text}.`;
            await processChunkedRequest(prompt);
        });

        summarizeBtn.addEventListener('click', async () => {
            const customInstructions = userInput.value.trim() ? `Additional instructions: ${userInput.value}\n` : '';
            const prompt = `Please provide a summary of the ${isSelection ? 'selected text' : 'content'} in ${languageSelect.options[languageSelect.selectedIndex].text}. ${customInstructions}`;
            await processChunkedRequest(prompt);
        });

        translateBtn.addEventListener('click', async () => {
            const customInstructions = userInput.value.trim() ? `Additional instructions: ${userInput.value}\n` : '';
            const prompt = `Please translate the ${isSelection ? 'selected text' : 'content'} to ${languageSelect.options[languageSelect.selectedIndex].text}. ${customInstructions}`;
            await processChunkedRequest(prompt);
        });

        // Clean up storage when popup is closed
        chrome.runtime.onSuspend.addListener(() => {
            if (windowId) {
                chrome.storage.local.remove([
                    `pageContent_${windowId}`, 
                    `pageUrl_${windowId}`, 
                    `pageTitle_${windowId}`,
                    `isSelection_${windowId}`,
                    `fullPageContent_${windowId}`
                ], () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error cleaning storage:', chrome.runtime.lastError);
                    }
                });
            }
        });
    });
});
