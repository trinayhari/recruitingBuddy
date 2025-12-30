import * as fs from 'fs/promises'
import * as path from 'path'
import { StaticAnalysis } from '../types'
import { getAllFiles, getFileExtension, getLanguageFromExtension } from '../ingestion/fileTree'
import { parseDependencies, detectFramework } from './dependencyAnalysis'

const ENTRY_POINT_PATTERNS = [
  'index.js',
  'index.ts',
  'index.tsx',
  'index.jsx',
  'main.js',
  'main.ts',
  'app.js',
  'app.ts',
  'app.tsx',
  'server.js',
  'server.ts',
  'App.js',
  'App.tsx',
  'App.ts',
]

export async function performStaticAnalysis(repoPath: string): Promise<StaticAnalysis> {
  const files = await getAllFiles(repoPath)
  
  // Count files and lines
  let totalLines = 0
  const languageBreakdown: Record<string, number> = {}
  const entryPoints: string[] = []

  for (const file of files) {
    const ext = getFileExtension(file)
    const language = getLanguageFromExtension(ext)
    
    // Count lines
    try {
      const filePath = path.join(repoPath, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n').length
      totalLines += lines
      
      // Update language breakdown
      if (language) {
        languageBreakdown[language] = (languageBreakdown[language] || 0) + lines
      }
    } catch {
      // Skip files we can't read
      continue
    }

    // Check for entry points
    const fileName = path.basename(file).toLowerCase()
    if (ENTRY_POINT_PATTERNS.includes(fileName)) {
      entryPoints.push(file)
    }
  }

  // Parse dependencies
  const dependencies = await parseDependencies(repoPath)
  
  // Detect framework
  const framework = detectFramework(dependencies, files)

  // Detect architecture (simple heuristics)
  let architecture: string | undefined
  if (files.some(f => f.includes('src/') || f.includes('lib/'))) {
    architecture = 'Structured (src/lib pattern)'
  } else if (files.some(f => f.includes('components/'))) {
    architecture = 'Component-based'
  } else if (files.some(f => f.includes('routes/') || f.includes('api/'))) {
    architecture = 'API/Route-based'
  }

  return {
    fileCount: files.length,
    totalLines,
    languageBreakdown,
    entryPoints,
    dependencies,
    framework,
    architecture,
  }
}

export function scoreFileImportance(
  filePath: string,
  staticAnalysis: StaticAnalysis
): number {
  let score = 0
  
  const fileName = path.basename(filePath).toLowerCase()
  const ext = getFileExtension(filePath)
  
  // Entry points are very important
  if (staticAnalysis.entryPoints.includes(filePath)) {
    score += 100
  }
  
  // Test files are important
  if (fileName.includes('test') || fileName.includes('spec')) {
    score += 50
  }
  
  // Configuration files
  if (['package.json', 'requirements.txt', 'dockerfile', 'docker-compose.yml'].includes(fileName)) {
    score += 30
  }
  
  // README files
  if (fileName.includes('readme')) {
    score += 40
  }
  
  // Source files (higher than generated/build files)
  if (filePath.includes('src/') || filePath.includes('lib/') || filePath.includes('app/')) {
    score += 20
  }
  
  // Common important file types
  if (['ts', 'tsx', 'js', 'jsx', 'py'].includes(ext)) {
    score += 10
  }
  
  return score
}

