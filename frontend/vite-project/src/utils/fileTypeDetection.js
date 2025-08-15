// File type detection utility for syntax highlighting
// Maps file extensions to Monaco Editor language identifiers

export const fileExtensionToLanguage = {
  // JavaScript and variants
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'es6': 'javascript',
  
  // TypeScript
  'ts': 'typescript',
  'tsx': 'typescript',
  
  // Python
  'py': 'python',
  'pyw': 'python',
  'pyc': 'python',
  'pyo': 'python',
  'pyd': 'python',
  'pyi': 'python',
  
  // Java
  'java': 'java',
  'class': 'java',
  'jar': 'java',
  
  // C/C++
  'c': 'c',
  'h': 'c',
  'cpp': 'cpp',
  'cxx': 'cpp',
  'cc': 'cpp',
  'hpp': 'cpp',
  'hxx': 'cpp',
  'hh': 'cpp',
  
  // C#
  'cs': 'csharp',
  'csx': 'csharp',
  
  // Web Technologies
  'html': 'html',
  'htm': 'html',
  'xhtml': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  
  // PHP
  'php': 'php',
  'phtml': 'php',
  'php3': 'php',
  'php4': 'php',
  'php5': 'php',
  'phps': 'php',
  
  // Ruby
  'rb': 'ruby',
  'rbw': 'ruby',
  'ruby': 'ruby',
  'rake': 'ruby',
  'gemspec': 'ruby',
  
  // Go
  'go': 'go',
  
  // Rust
  'rs': 'rust',
  'rlib': 'rust',
  
  // Swift
  'swift': 'swift',
  
  // Kotlin
  'kt': 'kotlin',
  'kts': 'kotlin',
  
  // Scala
  'scala': 'scala',
  'sc': 'scala',
  
  // Shell scripts
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'fish': 'shell',
  'ksh': 'shell',
  'csh': 'shell',
  'tcsh': 'shell',
  
  // PowerShell
  'ps1': 'powershell',
  'psm1': 'powershell',
  'psd1': 'powershell',
  
  // Batch
  'bat': 'bat',
  'cmd': 'bat',
  
  // SQL
  'sql': 'sql',
  'mysql': 'mysql',
  'pgsql': 'pgsql',
  
  // XML and variants
  'xml': 'xml',
  'xsl': 'xml',
  'xslt': 'xml',
  'xsd': 'xml',
  'dtd': 'xml',
  'svg': 'xml',
  
  // JSON
  'json': 'json',
  'jsonc': 'json',
  'json5': 'json',
  
  // YAML
  'yaml': 'yaml',
  'yml': 'yaml',
  
  // TOML
  'toml': 'ini', // Monaco doesn't have TOML, use INI as fallback
  
  // INI
  'ini': 'ini',
  'cfg': 'ini',
  'conf': 'ini',
  'config': 'ini',
  
  // Markdown
  'md': 'markdown',
  'markdown': 'markdown',
  'mdown': 'markdown',
  'mkd': 'markdown',
  'mdx': 'markdown',
  
  // LaTeX
  'tex': 'latex',
  'latex': 'latex',
  
  // R
  'r': 'r',
  'R': 'r',
  
  // MATLAB
  'm': 'matlab',
  
  // Perl
  'pl': 'perl',
  'pm': 'perl',
  'perl': 'perl',
  
  // Lua
  'lua': 'lua',
  
  // Dockerfile
  'dockerfile': 'dockerfile',
  'Dockerfile': 'dockerfile',
  
  // GraphQL
  'graphql': 'graphql',
  'gql': 'graphql',
  
  // Properties files
  'properties': 'ini',
  
  // Log files
  'log': 'plaintext',
  
  // Text files
  'txt': 'plaintext',
  'text': 'plaintext',
  
  // Default fallback
  '': 'plaintext'
};

// Language display names for UI
export const languageDisplayNames = {
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
  'sass': 'SASS',
  'less': 'LESS',
  'php': 'PHP',
  'ruby': 'Ruby',
  'go': 'Go',
  'rust': 'Rust',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'shell': 'Shell',
  'powershell': 'PowerShell',
  'bat': 'Batch',
  'sql': 'SQL',
  'mysql': 'MySQL',
  'pgsql': 'PostgreSQL',
  'xml': 'XML',
  'json': 'JSON',
  'yaml': 'YAML',
  'ini': 'INI',
  'markdown': 'Markdown',
  'latex': 'LaTeX',
  'r': 'R',
  'matlab': 'MATLAB',
  'perl': 'Perl',
  'lua': 'Lua',
  'dockerfile': 'Dockerfile',
  'graphql': 'GraphQL',
  'plaintext': 'Plain Text'
};

/**
 * Detects the programming language from a file extension
 * @param {string} filename - The filename with extension
 * @returns {string} The Monaco Editor language identifier
 */
export const detectLanguageFromExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'plaintext';
  }
  
  // Extract extension from filename
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Special cases for files without extensions but with recognizable names
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename === 'dockerfile' || lowerFilename === 'dockerfile.dev' || lowerFilename === 'dockerfile.prod') {
    return 'dockerfile';
  }
  if (lowerFilename === 'makefile' || lowerFilename === 'makefile.am' || lowerFilename === 'makefile.in') {
    return 'makefile';
  }
  if (lowerFilename === 'gemfile' || lowerFilename === 'rakefile') {
    return 'ruby';
  }
  if (lowerFilename === 'package.json' || lowerFilename.endsWith('.json')) {
    return 'json';
  }
  
  // Look up the extension in our mapping
  return fileExtensionToLanguage[extension] || 'plaintext';
};

/**
 * Gets the display name for a language
 * @param {string} language - The Monaco Editor language identifier
 * @returns {string} The human-readable language name
 */
export const getLanguageDisplayName = (language) => {
  return languageDisplayNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
};

/**
 * Gets all supported languages for the dropdown
 * @returns {Array} Array of {value, label} objects for select options
 */
export const getSupportedLanguages = () => {
  const uniqueLanguages = [...new Set(Object.values(fileExtensionToLanguage))];
  return uniqueLanguages
    .filter(lang => lang !== 'plaintext') // Hide plaintext from dropdown
    .sort()
    .map(lang => ({
      value: lang,
      label: getLanguageDisplayName(lang)
    }));
};

/**
 * Gets default code template for a given language
 * @param {string} language - The Monaco Editor language identifier
 * @param {string} filename - The filename (optional, used for context)
 * @returns {string} Default code template for the language
 */
export const getDefaultCodeTemplate = (language, filename = '') => {
  const templates = {
    'javascript': `// ${filename || 'JavaScript file'}
console.log('Hello, World!');

function greet(name) {
    return \`Hello, \${name}!\`;
}

// Example usage
const message = greet('Developer');
console.log(message);`,

    'typescript': `// ${filename || 'TypeScript file'}
interface User {
    name: string;
    age: number;
}

function greet(user: User): string {
    return \`Hello, \${user.name}!\`;
}

// Example usage
const user: User = { name: 'Developer', age: 25 };
console.log(greet(user));`,

    'python': `# ${filename || 'Python file'}
def greet(name):
    """Greet a person with their name."""
    return f"Hello, {name}!"

def main():
    """Main function."""
    message = greet("Developer")
    print(message)

if __name__ == "__main__":
    main()`,

    'java': `// ${filename || 'Java file'}
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        String message = greet("Developer");
        System.out.println(message);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

    'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename ? filename.replace('.html', '') : 'Document'}</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to your HTML page!</p>
</body>
</html>`,

    'css': `/* ${filename || 'CSS file'} */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f4;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}`,

    'json': `{
  "name": "${filename ? filename.replace('.json', '') : 'project'}",
  "version": "1.0.0",
  "description": "A sample JSON file",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "Developer",
  "license": "MIT"
}`,

    'cpp': `// ${filename || 'C++ file'}
#include <iostream>
#include <string>

using namespace std;

string greet(const string& name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello, World!" << endl;
    
    string message = greet("Developer");
    cout << message << endl;
    
    return 0;
}`,

    'csharp': `// ${filename || 'C# file'}
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
            
            string message = Greet("Developer");
            Console.WriteLine(message);
        }
        
        static string Greet(string name)
        {
            return $"Hello, {name}!";
        }
    }
}`,

    'go': `// ${filename || 'Go file'}
package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println("Hello, World!")
    
    message := greet("Developer")
    fmt.Println(message)
}`,

    'rust': `// ${filename || 'Rust file'}
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("Hello, World!");
    
    let message = greet("Developer");
    println!("{}", message);
}`,

    'php': `<?php
// ${filename || 'PHP file'}

function greet($name) {
    return "Hello, " . $name . "!";
}

echo "Hello, World!\\n";

$message = greet("Developer");
echo $message . "\\n";
?>`,

    'ruby': `# ${filename || 'Ruby file'}
def greet(name)
  "Hello, #{name}!"
end

puts "Hello, World!"

message = greet("Developer")
puts message`,

    'swift': `// ${filename || 'Swift file'}
import Foundation

func greet(name: String) -> String {
    return "Hello, \\(name)!"
}

print("Hello, World!")

let message = greet(name: "Developer")
print(message)`,

    'kotlin': `// ${filename || 'Kotlin file'}
fun greet(name: String): String {
    return "Hello, $name!"
}

fun main() {
    println("Hello, World!")
    
    val message = greet("Developer")
    println(message)
}`,

    'shell': `#!/bin/bash
# ${filename || 'Shell script'}

greet() {
    echo "Hello, $1!"
}

echo "Hello, World!"

message=$(greet "Developer")
echo "$message"`,

    'powershell': `# ${filename || 'PowerShell script'}

function Greet {
    param([string]$Name)
    return "Hello, $Name!"
}

Write-Host "Hello, World!"

$message = Greet -Name "Developer"
Write-Host $message`,

    'sql': `-- ${filename || 'SQL file'}
-- Sample database queries

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');

SELECT * FROM users WHERE name LIKE '%John%';`,

    'yaml': `# ${filename || 'YAML file'}
name: ${filename ? filename.replace('.yml', '').replace('.yaml', '') : 'project'}
version: 1.0.0
description: A sample YAML configuration

database:
  host: localhost
  port: 5432
  name: myapp
  user: developer

services:
  - name: web
    port: 3000
    replicas: 2
  - name: api
    port: 8080
    replicas: 3`,

    'dockerfile': `# ${filename || 'Dockerfile'}
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]`,

    'markdown': `# ${filename ? filename.replace('.md', '') : 'Document'}

Welcome to this markdown document!

## Features

- **Bold text**
- *Italic text*
- \`Inline code\`
- [Links](https://example.com)

## Code Example

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

## Lists

1. First item
2. Second item
3. Third item

> This is a blockquote with useful information.`,

    'xml': `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${filename || 'XML file'} -->
<root>
    <metadata>
        <title>Sample XML Document</title>
        <author>Developer</author>
        <version>1.0</version>
    </metadata>
    
    <data>
        <item id="1">
            <name>First Item</name>
            <value>100</value>
        </item>
        <item id="2">
            <name>Second Item</name>
            <value>200</value>
        </item>
    </data>
</root>`
  };

  return templates[language] || `// ${filename || 'Start coding here...'}
// File type: ${getLanguageDisplayName(language)}
// Auto-detected from file extension

console.log('Hello, World!');`;
};
