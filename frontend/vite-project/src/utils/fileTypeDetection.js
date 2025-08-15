// File Type Detection Utility for Syntax Highlighting
// Automatically detects file type from extension and maps to Monaco Editor languages

/**
 * Maps file extensions to Monaco Editor language identifiers
 */
const FILE_TYPE_MAP = {
  // JavaScript & TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  
  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  
  // Java
  '.java': 'java',
  '.class': 'java',
  
  // C/C++
  '.c': 'c',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.cc': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  
  // C#
  '.cs': 'csharp',
  
  // Web Technologies
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  
  // PHP
  '.php': 'php',
  '.phtml': 'php',
  
  // Ruby
  '.rb': 'ruby',
  '.rbw': 'ruby',
  
  // Go
  '.go': 'go',
  
  // Rust
  '.rs': 'rust',
  
  // Shell Scripts
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  
  // Markup & Data
  '.xml': 'xml',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.cfg': 'ini',
  
  // Markdown
  '.md': 'markdown',
  '.markdown': 'markdown',
  
  // SQL
  '.sql': 'sql',
  
  // R
  '.r': 'r',
  '.R': 'r',
  
  // Swift
  '.swift': 'swift',
  
  // Kotlin
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  
  // Scala
  '.scala': 'scala',
  '.sc': 'scala',
  
  // Lua
  '.lua': 'lua',
  
  // Perl
  '.pl': 'perl',
  '.pm': 'perl',
  
  // PowerShell
  '.ps1': 'powershell',
  '.psm1': 'powershell',
  
  // Batch
  '.bat': 'bat',
  '.cmd': 'bat',
  
  // Docker
  'dockerfile': 'dockerfile',
  '.dockerfile': 'dockerfile',
  
  // Plain text
  '.txt': 'plaintext',
  '.text': 'plaintext',
};

/**
 * Language display names for UI
 */
const LANGUAGE_DISPLAY_NAMES = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'java': 'Java',
  'c': 'C',
  'cpp': 'C++',
  'csharp': 'C#',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'Sass',
  'less': 'Less',
  'php': 'PHP',
  'ruby': 'Ruby',
  'go': 'Go',
  'rust': 'Rust',
  'shell': 'Shell',
  'xml': 'XML',
  'json': 'JSON',
  'yaml': 'YAML',
  'toml': 'TOML',
  'ini': 'INI',
  'markdown': 'Markdown',
  'sql': 'SQL',
  'r': 'R',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'lua': 'Lua',
  'perl': 'Perl',
  'powershell': 'PowerShell',
  'bat': 'Batch',
  'dockerfile': 'Dockerfile',
  'plaintext': 'Plain Text',
};

/**
 * Popular languages for quick selection
 */
const POPULAR_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'html',
  'css',
  'php',
  'go',
  'rust',
  'shell',
  'json',
  'markdown',
  'sql'
];

/**
 * Detects file type from filename or extension
 * @param {string} filename - The filename to analyze
 * @returns {string} Monaco Editor language identifier
 */
export function detectFileType(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'javascript'; // Default to JavaScript
  }

  // Convert to lowercase for case-insensitive matching
  const lowerFilename = filename.toLowerCase();
  
  // Handle special cases first
  if (lowerFilename === 'dockerfile' || lowerFilename.includes('dockerfile')) {
    return 'dockerfile';
  }
  
  if (lowerFilename === 'makefile' || lowerFilename.includes('makefile')) {
    return 'makefile';
  }

  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return 'plaintext'; // No extension
  }

  const extension = filename.substring(lastDotIndex).toLowerCase();
  
  // Look up in our mapping
  return FILE_TYPE_MAP[extension] || 'plaintext';
}

/**
 * Gets the display name for a language
 * @param {string} language - Monaco Editor language identifier
 * @returns {string} Human-readable language name
 */
export function getLanguageDisplayName(language) {
  return LANGUAGE_DISPLAY_NAMES[language] || language;
}

/**
 * Gets list of popular languages for quick selection
 * @returns {Array} Array of language objects with id and name
 */
export function getPopularLanguages() {
  return POPULAR_LANGUAGES.map(lang => ({
    id: lang,
    name: getLanguageDisplayName(lang)
  }));
}

/**
 * Gets all supported languages
 * @returns {Array} Array of language objects with id and name
 */
export function getAllSupportedLanguages() {
  return Object.keys(LANGUAGE_DISPLAY_NAMES).map(lang => ({
    id: lang,
    name: getLanguageDisplayName(lang)
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validates if a language is supported
 * @param {string} language - Language to validate
 * @returns {boolean} Whether the language is supported
 */
export function isLanguageSupported(language) {
  return Object.keys(LANGUAGE_DISPLAY_NAMES).includes(language);
}

/**
 * Gets file extension suggestions for a language
 * @param {string} language - Monaco Editor language identifier
 * @returns {Array} Array of common file extensions
 */
export function getFileExtensionsForLanguage(language) {
  const extensions = [];
  
  for (const [ext, lang] of Object.entries(FILE_TYPE_MAP)) {
    if (lang === language) {
      extensions.push(ext);
    }
  }
  
  return extensions;
}
