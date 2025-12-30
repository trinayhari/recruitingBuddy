import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs/promises'
import * as path from 'path'
import { FileTree } from '../types'

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/recruitingbuddy'

export async function cloneRepository(
  githubUrl: string,
  submissionId: string
): Promise<string> {
  const repoPath = path.join(TEMP_DIR, submissionId)
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(TEMP_DIR, { recursive: true })
    
    // Remove existing directory if it exists
    try {
      await fs.rm(repoPath, { recursive: true, force: true })
    } catch {
      // Directory doesn't exist, that's fine
    }

    // Clone repository (shallow clone for speed)
    const git: SimpleGit = simpleGit()
    await git.clone(githubUrl, repoPath, ['--depth', '1'])

    return repoPath
  } catch (error) {
    throw new Error(
      `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function cleanupRepository(repoPath: string): Promise<void> {
  try {
    await fs.rm(repoPath, { recursive: true, force: true })
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't break the flow
    console.error(`Failed to cleanup repository at ${repoPath}:`, error)
  }
}

