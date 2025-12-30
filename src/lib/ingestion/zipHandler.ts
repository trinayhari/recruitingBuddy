import AdmZip from 'adm-zip'
import * as fs from 'fs/promises'
import * as path from 'path'
import { FileTree } from '../types'

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/recruitingbuddy'

export async function extractZipFile(
  zipBuffer: Buffer,
  submissionId: string
): Promise<string> {
  const extractPath = path.join(TEMP_DIR, submissionId)
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(TEMP_DIR, { recursive: true })
    
    // Remove existing directory if it exists
    try {
      await fs.rm(extractPath, { recursive: true, force: true })
    } catch {
      // Directory doesn't exist, that's fine
    }

    // Extract zip file
    const zip = new AdmZip(zipBuffer)
    zip.extractAllTo(extractPath, true)

    return extractPath
  } catch (error) {
    throw new Error(
      `Failed to extract zip file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function cleanupExtractedFiles(extractPath: string): Promise<void> {
  try {
    await fs.rm(extractPath, { recursive: true, force: true })
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't break the flow
    console.error(`Failed to cleanup extracted files at ${extractPath}:`, error)
  }
}

