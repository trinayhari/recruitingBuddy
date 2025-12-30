import * as fs from 'fs/promises'
import * as path from 'path'
import { FileTree } from '../types'

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build',
  '.DS_Store',
  'coverage',
  '.nyc_output',
  '.idea',
  '.vscode',
]

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split(path.sep)
  return IGNORE_PATTERNS.some(pattern => parts.includes(pattern))
}

export async function buildFileTree(
  dirPath: string,
  relativePath: string = ''
): Promise<FileTree[]> {
  const tree: FileTree[] = []
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativeFilePath = path.join(relativePath, entry.name)
      
      if (shouldIgnore(relativeFilePath)) {
        continue
      }

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, relativeFilePath)
        tree.push({
          path: relativeFilePath,
          name: entry.name,
          type: 'directory',
          children,
        })
      } else {
        const stats = await fs.stat(fullPath)
        tree.push({
          path: relativeFilePath,
          name: entry.name,
          type: 'file',
          size: stats.size,
        })
      }
    }
  } catch (error) {
    // If we can't read the directory, return empty tree
    console.error(`Error reading directory ${dirPath}:`, error)
  }
  
  return tree
}

export async function getAllFiles(repoPath: string): Promise<string[]> {
  const files: string[] = []
  
  async function walkDir(currentPath: string, relativePath: string = '') {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)
        const relativeFilePath = path.join(relativePath, entry.name)
        
        if (shouldIgnore(relativeFilePath)) {
          continue
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath, relativeFilePath)
        } else {
          files.push(relativeFilePath)
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.error(`Error walking directory ${currentPath}:`, error)
    }
  }
  
  await walkDir(repoPath)
  return files
}

export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return ext.startsWith('.') ? ext.slice(1) : ext
}

export function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'rb': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'SASS',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'md': 'Markdown',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash',
    'zsh': 'Zsh',
  }
  
  return languageMap[ext] || ext.toUpperCase()
}

