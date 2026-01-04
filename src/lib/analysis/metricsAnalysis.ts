import * as fs from 'fs/promises'
import * as path from 'path'
import { StaticAnalysis, CommitAnalysis, QuantifiedMetrics, RedFlag } from '../types'
import { getAllFiles, getFileExtension, getLanguageFromExtension } from '../ingestion/fileTree'

// Known popular packages for dependency health scoring
const KNOWN_PACKAGES = new Set([
  'react', 'next', 'vue', 'angular', 'express', 'fastify', 'koa',
  'typescript', 'jest', 'vitest', 'mocha', 'cypress', 'playwright',
  'tailwindcss', 'styled-components', 'emotion',
  'axios', 'fetch', 'node-fetch',
  'prisma', 'sequelize', 'mongoose', 'typeorm',
  'django', 'flask', 'fastapi', 'tornado',
  'pytest', 'unittest',
  'eslint', 'prettier', 'husky',
])

export async function computeMetrics(
  staticAnalysis: StaticAnalysis,
  commitAnalysis: CommitAnalysis,
  repoPath: string,
  readmeContent?: string
): Promise<QuantifiedMetrics> {
  const allFiles = await getAllFiles(repoPath)
  
  // Project Development Signals
  const codeOrganizationScore = computeCodeOrganizationScore(allFiles, staticAnalysis)
  const testPresence = await computeTestPresence(allFiles, repoPath, staticAnalysis)
  const documentationScore = computeDocumentationScore(readmeContent, allFiles, repoPath)
  const dependencyHealth = computeDependencyHealth(staticAnalysis)
  const fileSizeDistribution = await computeFileSizeDistribution(allFiles, repoPath)

  // Software Design Signals
  const typeSafetyRatio = computeTypeSafetyRatio(staticAnalysis)
  const modularityIndex = computeModularityIndex(allFiles, staticAnalysis)
  const entryPointClarity = computeEntryPointClarity(staticAnalysis)
  const apiStructureScore = computeApiStructureScore(allFiles)

  // Work Habit Signals
  const commitQualityScore = computeCommitQualityScore(commitAnalysis)
  const developmentPatternScore = computeDevelopmentPatternScore(commitAnalysis)
  const timeInvestment = computeTimeInvestment(commitAnalysis)
  const iterationScore = computeIterationScore(commitAnalysis)

  // Red Flags
  const redFlags = await detectRedFlags(allFiles, repoPath)

  // Overall composite score (weighted average)
  const overallHireSignal = computeOverallHireSignal({
    codeOrganizationScore,
    testPresence,
    documentationScore,
    dependencyHealth,
    fileSizeDistribution,
    typeSafetyRatio,
    modularityIndex,
    entryPointClarity,
    apiStructureScore,
    commitQualityScore,
    developmentPatternScore,
    timeInvestment,
    iterationScore,
    redFlags,
  })

  return {
    codeOrganizationScore,
    testPresence,
    documentationScore,
    dependencyHealth,
    fileSizeDistribution,
    typeSafetyRatio,
    modularityIndex,
    entryPointClarity,
    apiStructureScore,
    commitQualityScore,
    developmentPatternScore,
    timeInvestment,
    iterationScore,
    redFlags,
    overallHireSignal,
  }
}

function computeCodeOrganizationScore(files: string[], staticAnalysis: StaticAnalysis): number {
  let score = 0
  let checks = 0

  // Check for structured directories
  const hasSrc = files.some(f => f.includes('src/'))
  const hasLib = files.some(f => f.includes('lib/'))
  const hasComponents = files.some(f => f.includes('components/'))
  const hasUtils = files.some(f => f.includes('utils/') || f.includes('helpers/'))
  const hasConfig = files.some(f => f.includes('config/') || f.includes('configs/'))
  
  if (hasSrc || hasLib) score += 30
  if (hasComponents) score += 20
  if (hasUtils) score += 15
  if (hasConfig) score += 10
  checks += 4

  // Architecture detection bonus
  if (staticAnalysis.architecture) {
    score += 25
  }
  checks += 1

  return Math.min(100, Math.round((score / checks) * 2))
}

async function computeTestPresence(
  files: string[],
  repoPath: string,
  staticAnalysis: StaticAnalysis
): Promise<QuantifiedMetrics['testPresence']> {
  const testFiles = files.filter(f => {
    const name = path.basename(f).toLowerCase()
    const dir = path.dirname(f).toLowerCase()
    return (
      name.includes('test') ||
      name.includes('spec') ||
      dir.includes('test') ||
      dir.includes('spec') ||
      dir.includes('__tests__')
    )
  })

  const sourceFiles = files.filter(f => {
    const ext = getFileExtension(f)
    const lang = getLanguageFromExtension(ext)
    return ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'].includes(lang)
  })

  const testRatio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0

  return {
    hasTests: testFiles.length > 0,
    testRatio,
    testFileCount: testFiles.length,
  }
}

function computeDocumentationScore(
  readmeContent: string | undefined,
  files: string[],
  repoPath: string
): number {
  let score = 0

  // README presence and length
  if (readmeContent) {
    const wordCount = readmeContent.split(/\s+/).length
    if (wordCount > 200) score += 50
    else if (wordCount > 100) score += 30
    else if (wordCount > 50) score += 15
    else score += 5
  }

  // Check for other documentation files
  const hasDocs = files.some(f => f.includes('docs/') || f.includes('documentation/'))
  if (hasDocs) score += 20

  // Check for inline comments (rough estimate via .md files)
  const markdownFiles = files.filter(f => f.endsWith('.md'))
  if (markdownFiles.length > 1) score += 10

  // Architecture/design docs
  const hasArchDocs = files.some(f => 
    f.toLowerCase().includes('architecture') || 
    f.toLowerCase().includes('design')
  )
  if (hasArchDocs) score += 20

  return Math.min(100, score)
}

function computeDependencyHealth(staticAnalysis: StaticAnalysis): number {
  const deps = staticAnalysis.dependencies.node || {}
  const depNames = Object.keys(deps)
  
  if (depNames.length === 0) return 50 // Neutral if no deps

  const knownCount = depNames.filter(name => 
    KNOWN_PACKAGES.has(name.toLowerCase()) ||
    name.startsWith('@types/') ||
    name.startsWith('@testing-library/')
  ).length

  return Math.round((knownCount / depNames.length) * 100)
}

async function computeFileSizeDistribution(
  files: string[],
  repoPath: string
): Promise<QuantifiedMetrics['fileSizeDistribution']> {
  const lineCounts: number[] = []
  let maxFileSize = 0
  let largeFileCount = 0

  for (const file of files.slice(0, 200)) { // Sample up to 200 files for performance
    try {
      const ext = getFileExtension(file)
      const lang = getLanguageFromExtension(ext)
      
      // Only count code files
      if (!['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C', 'C#'].includes(lang)) {
        continue
      }

      const fullPath = path.join(repoPath, file)
      const content = await fs.readFile(fullPath, 'utf-8')
      const lines = content.split('\n').length
      
      lineCounts.push(lines)
      maxFileSize = Math.max(maxFileSize, lines)
      
      if (lines > 500) {
        largeFileCount++
      }
    } catch {
      // Skip files we can't read
      continue
    }
  }

  const averageLinesPerFile = lineCounts.length > 0
    ? Math.round(lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length)
    : 0

  return {
    averageLinesPerFile,
    maxFileSize,
    largeFileCount,
  }
}

function computeTypeSafetyRatio(staticAnalysis: StaticAnalysis): number {
  const tsLines = staticAnalysis.languageBreakdown['TypeScript'] || 0
  const jsLines = staticAnalysis.languageBreakdown['JavaScript'] || 0
  const total = tsLines + jsLines

  if (total === 0) return 0
  return Math.round((tsLines / total) * 100)
}

function computeModularityIndex(files: string[], staticAnalysis: StaticAnalysis): number {
  let score = 0

  // Count distinct modules/components
  const componentDirs = new Set<string>()
  const moduleFiles = files.filter(f => {
    const ext = getFileExtension(f)
    return ['js', 'jsx', 'ts', 'tsx', 'py'].includes(ext)
  })

  for (const file of moduleFiles) {
    const dir = path.dirname(file)
    if (dir && dir !== '.' && !dir.includes('node_modules')) {
      componentDirs.add(dir)
    }
  }

  // More directories = better modularity
  const dirCount = componentDirs.size
  if (dirCount > 10) score = 100
  else if (dirCount > 5) score = 80
  else if (dirCount > 3) score = 60
  else if (dirCount > 1) score = 40
  else score = 20

  // Bonus for component-based architecture
  if (staticAnalysis.architecture?.includes('Component')) {
    score = Math.min(100, score + 20)
  }

  return score
}

function computeEntryPointClarity(staticAnalysis: StaticAnalysis): number {
  const entryPointCount = staticAnalysis.entryPoints.length

  if (entryPointCount === 1) return 100 // Perfect: single clear entry
  if (entryPointCount === 2 || entryPointCount === 3) return 80 // Good: few clear entries
  if (entryPointCount > 3) return 60 // Multiple entries, less clear
  return 30 // No entry points detected
}

function computeApiStructureScore(files: string[]): number {
  const hasApiDir = files.some(f => f.includes('api/') || f.includes('routes/') || f.includes('endpoints/'))
  const hasRoutes = files.some(f => f.includes('routes/') || f.includes('router'))
  const hasControllers = files.some(f => f.includes('controllers/') || f.includes('handlers/'))

  let score = 0
  if (hasApiDir) score += 40
  if (hasRoutes) score += 30
  if (hasControllers) score += 30

  return score
}

function computeCommitQualityScore(commitAnalysis: CommitAnalysis): number {
  if (!commitAnalysis.hasGitHistory || commitAnalysis.commitMessages.length === 0) {
    return 50 // Neutral if no git history
  }

  let score = 0
  const messages = commitAnalysis.commitMessages.slice(0, 20) // Sample first 20

  // Check average message length
  const avgLength = messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length
  if (avgLength > 30) score += 40
  else if (avgLength > 20) score += 30
  else if (avgLength > 10) score += 20
  else score += 10

  // Check for descriptive keywords
  const descriptiveKeywords = ['add', 'implement', 'refactor', 'fix', 'update', 'create', 'improve']
  const hasDescriptive = messages.some(msg => 
    descriptiveKeywords.some(keyword => msg.toLowerCase().includes(keyword))
  )
  if (hasDescriptive) score += 30

  // Penalize low-quality patterns
  const lowQualityPatterns = ['wip', 'fix', 'update', 'changes']
  const allLowQuality = messages.every(msg => 
    lowQualityPatterns.some(pattern => msg.toLowerCase().trim() === pattern)
  )
  if (allLowQuality) score = Math.max(20, score - 30)

  return Math.min(100, score)
}

function computeDevelopmentPatternScore(commitAnalysis: CommitAnalysis): number {
  if (!commitAnalysis.hasGitHistory || !commitAnalysis.timeSpan) {
    return 50
  }

  const hours = commitAnalysis.timeSpan.hours
  const commitCount = commitAnalysis.commitCount

  // Good pattern: steady commits over reasonable time
  if (hours >= 2 && hours <= 20 && commitCount >= 3) {
    return 100
  }

  // Single commit = bad pattern
  if (commitCount === 1) {
    return 20
  }

  // Very short time (< 1 hour) = rushed
  if (hours < 1 && commitCount > 5) {
    return 30
  }

  // Very long time (> 40 hours) = might be concerning
  if (hours > 40) {
    return 60
  }

  return 70 // Default: moderate
}

function computeTimeInvestment(commitAnalysis: CommitAnalysis): QuantifiedMetrics['timeInvestment'] {
  const hours = commitAnalysis.timeSpan?.hours || 0

  let score = 50
  if (hours >= 4 && hours <= 12) {
    score = 100 // Ideal range
  } else if (hours >= 2 && hours < 4) {
    score = 70 // Good but short
  } else if (hours > 12 && hours <= 20) {
    score = 80 // Good but long
  } else if (hours > 20 && hours <= 40) {
    score = 60 // Very long, might be concerning
  } else if (hours < 1) {
    score = 20 // Too rushed
  } else if (hours > 40) {
    score = 40 // Extremely long
  }

  return {
    hours,
    score,
  }
}

function computeIterationScore(commitAnalysis: CommitAnalysis): number {
  if (!commitAnalysis.hasGitHistory || !commitAnalysis.timeSpan) {
    return 50
  }

  const commitsPerHour = commitAnalysis.commitFrequency

  // Ideal: 1-5 commits per hour
  if (commitsPerHour >= 1 && commitsPerHour <= 5) {
    return 100
  }

  // Too few iterations
  if (commitsPerHour < 0.5) {
    return 30
  }

  // Too many iterations (might indicate flailing)
  if (commitsPerHour > 20) {
    return 40
  }

  // Moderate
  if (commitsPerHour > 5 && commitsPerHour <= 10) {
    return 70
  }

  return 50
}

async function detectRedFlags(files: string[], repoPath: string): Promise<RedFlag[]> {
  const redFlags: RedFlag[] = []

  // Check for .gitignore
  const hasGitignore = files.some(f => f.includes('.gitignore'))
  if (!hasGitignore) {
    redFlags.push({
      type: 'no_gitignore',
      severity: 'medium',
      description: 'No .gitignore file found',
    })
  }

  let todoCount = 0
  let consoleLogCount = 0
  let secretPatternCount = 0
  let largeFileCount = 0

  // Sample files for performance
  for (const file of files.slice(0, 100)) {
    try {
      const ext = getFileExtension(file)
      const lang = getLanguageFromExtension(ext)
      
      // Only check code files
      if (!['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'].includes(lang)) {
        continue
      }

      const fullPath = path.join(repoPath, file)
      const content = await fs.readFile(fullPath, 'utf-8')
      
      // Check for TODOs/FIXMEs
      const todoMatches = content.match(/(TODO|FIXME|XXX|HACK)/gi)
      if (todoMatches) {
        todoCount += todoMatches.length
      }

      // Check for console.log (in production code)
      if (!file.includes('test') && !file.includes('spec')) {
        const consoleMatches = content.match(/console\.(log|debug|info|warn|error)/g)
        if (consoleMatches) {
          consoleLogCount += consoleMatches.length
        }
      }

      // Check for hardcoded secrets patterns
      const secretPatterns = [
        /API[_\s]*KEY\s*[=:]\s*['"][^'"]+['"]/i,
        /PASSWORD\s*[=:]\s*['"][^'"]+['"]/i,
        /SECRET\s*[=:]\s*['"][^'"]+['"]/i,
        /TOKEN\s*[=:]\s*['"][^'"]+['"]/i,
      ]
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          secretPatternCount++
          break // Count once per file
        }
      }

      // Check for very large files
      const lines = content.split('\n').length
      if (lines > 500) {
        largeFileCount++
      }
    } catch {
      // Skip files we can't read
      continue
    }
  }

  if (todoCount > 10) {
    redFlags.push({
      type: 'high_todos',
      severity: todoCount > 20 ? 'high' : 'medium',
      description: `High TODO/FIXME count: ${todoCount}`,
      count: todoCount,
    })
  }

  if (consoleLogCount > 5) {
    redFlags.push({
      type: 'console_logs',
      severity: consoleLogCount > 20 ? 'high' : 'medium',
      description: `Console.log statements in production code: ${consoleLogCount}`,
      count: consoleLogCount,
    })
  }

  if (secretPatternCount > 0) {
    redFlags.push({
      type: 'hardcoded_secrets',
      severity: 'high',
      description: `Potential hardcoded secrets detected: ${secretPatternCount} file(s)`,
      count: secretPatternCount,
    })
  }

  if (largeFileCount > 3) {
    redFlags.push({
      type: 'large_files',
      severity: 'medium',
      description: `Multiple large files (>500 lines): ${largeFileCount}`,
      count: largeFileCount,
    })
  }

  return redFlags
}

function computeOverallHireSignal(metrics: {
  codeOrganizationScore: number
  testPresence: QuantifiedMetrics['testPresence']
  documentationScore: number
  dependencyHealth: number
  fileSizeDistribution: QuantifiedMetrics['fileSizeDistribution']
  typeSafetyRatio: number
  modularityIndex: number
  entryPointClarity: number
  apiStructureScore: number
  commitQualityScore: number
  developmentPatternScore: number
  timeInvestment: QuantifiedMetrics['timeInvestment']
  iterationScore: number
  redFlags: RedFlag[]
}): number {
  // Weighted average of all metrics
  const weights = {
    codeOrganization: 0.10,
    testPresence: 0.15,
    documentation: 0.08,
    dependencyHealth: 0.05,
    fileSize: 0.05,
    typeSafety: 0.08,
    modularity: 0.10,
    entryPoint: 0.05,
    apiStructure: 0.05,
    commitQuality: 0.08,
    devPattern: 0.08,
    timeInvestment: 0.05,
    iteration: 0.05,
  }

  // Compute test presence score (0-100)
  const testScore = metrics.testPresence.hasTests
    ? Math.min(100, metrics.testPresence.testRatio * 200) // Scale ratio to 0-100
    : 0

  // Compute file size score (inverse - smaller is better)
  const fileSizeScore = metrics.fileSizeDistribution.averageLinesPerFile > 0
    ? Math.max(0, 100 - (metrics.fileSizeDistribution.averageLinesPerFile / 5)) // Penalize large files
    : 50

  let weightedSum =
    metrics.codeOrganizationScore * weights.codeOrganization +
    testScore * weights.testPresence +
    metrics.documentationScore * weights.documentation +
    metrics.dependencyHealth * weights.dependencyHealth +
    fileSizeScore * weights.fileSize +
    metrics.typeSafetyRatio * weights.typeSafety +
    metrics.modularityIndex * weights.modularity +
    metrics.entryPointClarity * weights.entryPoint +
    metrics.apiStructureScore * weights.apiStructure +
    metrics.commitQualityScore * weights.commitQuality +
    metrics.developmentPatternScore * weights.devPattern +
    metrics.timeInvestment.score * weights.timeInvestment +
    metrics.iterationScore * weights.iteration

  // Apply red flag penalties
  const highSeverityFlags = metrics.redFlags.filter(f => f.severity === 'high').length
  const mediumSeverityFlags = metrics.redFlags.filter(f => f.severity === 'medium').length

  weightedSum -= highSeverityFlags * 10 // -10 per high severity flag
  weightedSum -= mediumSeverityFlags * 5 // -5 per medium severity flag

  return Math.max(0, Math.min(100, Math.round(weightedSum)))
}

