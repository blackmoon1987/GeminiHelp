# Gemini Help Chrome Extension

A powerful Chrome extension that leverages Google's Gemini AI to help users understand and interact with web content through summarization and translation features.

## Features

- Summarize long articles
- Translate content to multiple languages
- Process both selected text and full pages
- Customizable instructions for specific needs
- Multi-language UI support (English, Arabic, Spanish, French)
- RTL language support

## Privacy Practices and Permissions Justification

### Single Purpose Description
Gemini Help is designed with a single purpose: to help users understand web content through AI-powered summarization and translation. The extension processes webpage content (either selected text or full page) using Google's Gemini AI to provide summaries and translations based on user instructions.

### Permission Justifications

#### 1. activeTab Permission
- **Purpose**: To access the current webpage's content for processing
- **Usage**: Only activated when the user explicitly requests to summarize or translate content
- **Privacy**: Content is only accessed when the user initiates an action
- **Necessity**: Required to read page content for processing

#### 2. contextMenus Permission
- **Purpose**: To provide right-click menu options for quick access to features
- **Usage**: Adds "Gemini Help" options to the context menu
- **Privacy**: Only activates on user right-click
- **Necessity**: Essential for user-friendly access to extension features

#### 3. Host Permission
- **Purpose**: To interact with Google's Gemini AI API
- **Usage**: Only connects to specified API endpoints for processing content
- **Privacy**: No data is shared with unauthorized hosts
- **Necessity**: Required for core AI functionality

#### 4. Remote Code
- **Purpose**: To load and execute Gemini AI API responses
- **Usage**: Strictly limited to processing API responses
- **Privacy**: No third-party code execution
- **Necessity**: Essential for displaying AI-processed results

#### 5. Scripting Permission
- **Purpose**: To inject content scripts for reading page content
- **Usage**: Only activates on user request
- **Privacy**: Scripts are local and transparent
- **Necessity**: Required for accessing page content

#### 6. Storage Permission
- **Purpose**: To store user preferences and temporary content
- **Usage**: Stores:
  - UI language preference
  - Last used translation language
  - Temporary page content for processing
- **Privacy**: All data stored locally, no external sharing
- **Necessity**: Required for maintaining user preferences and processing state

## Data Usage Compliance

This extension complies with Chrome Web Store's Developer Program Policies:

1. **Data Collection**
   - Only collects necessary webpage content for processing
   - No personal information is collected
   - No tracking or analytics

2. **Data Processing**
   - All processing is done through Google's Gemini AI API
   - No third-party data processing
   - Content is processed only upon user request

3. **Data Storage**
   - All data stored locally in Chrome storage
   - No external databases
   - Temporary storage cleared on extension reload

4. **Data Sharing**
   - No data sharing with third parties
   - No advertising or marketing usage
   - Only communicates with Gemini AI API

5. **User Privacy**
   - Clear user consent for all operations
   - No background processing
   - All operations are user-initiated

## Installation

1. Download the extension from Chrome Web Store
2. Click "Add to Chrome"
3. Accept the necessary permissions
4. Right-click on any webpage to start using Gemini Help

## Support

For support or feature requests, please visit our [GitHub repository](https://github.com/yourusername/gemini-help) or contact us through the Chrome Web Store.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
