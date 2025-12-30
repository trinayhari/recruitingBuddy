import * as fs from 'fs/promises'
import * as path from 'path'

const README_PATTERNS = [
  'README.md',
  'readme.md',
  'Readme.md',
  'README.txt',
  'readme.txt',
  'README',
  'readme',
]

export async function findAndReadReadme(repoPath: string): Promise<string | undefined> {
  for (const pattern of README_PATTERNS) {
    try {
      const readmePath = path.join(repoPath, pattern)
      const content = await fs.readFile(readmePath, 'utf-8')
      return content
    } catch {
      // Try next pattern
      continue
    }
  }
  return undefined
}

export function extractTaskDescription(readmeContent: string): string | undefined {
  // Look for common sections that might contain task description
  const sections = [
    /##\s*Task[:\s]*(.+?)(?=##|$)/is,
    /##\s*Assignment[:\s]*(.+?)(?=##|$)/is,
    /##\s*Requirements[:\s]*(.+?)(?=##|$)/is,
    /##\s*Overview[:\s]*(.+?)(?=##|$)/is,
    /#\s*(.+?)(?=##|$)/is, // First heading
  ]

  for (const pattern of sections) {
    const match = readmeContent.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  // If no specific section found, return first paragraph
  const firstParagraph = readmeContent.split('\n\n')[0]
  if (firstParagraph && firstParagraph.length > 50) {
    return firstParagraph.trim()
  }

  return undefined
}

