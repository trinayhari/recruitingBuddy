import simpleGit, { SimpleGit } from 'simple-git'
import { CommitAnalysis } from '../types'

export async function analyzeCommits(repoPath: string): Promise<CommitAnalysis> {
  const git: SimpleGit = simpleGit(repoPath)
  
  try {
    // Check if this is a git repository
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      return {
        commitCount: 0,
        commitFrequency: 0,
        iterationPattern: 'low',
        commitMessages: [],
        hasGitHistory: false,
      }
    }

    // Get all commits
    const log = await git.log()
    const commits = log.all

    if (commits.length === 0) {
      return {
        commitCount: 0,
        commitFrequency: 0,
        iterationPattern: 'low',
        commitMessages: [],
        hasGitHistory: true,
      }
    }

    // Extract commit messages and dates
    const commitMessages = commits.map(c => c.message)
    const commitDates = commits.map(c => new Date(c.date))

    // Calculate time span
    const sortedDates = [...commitDates].sort((a, b) => a.getTime() - b.getTime())
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]
    const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    const hours = Math.max(hoursDiff, 0.1) // Avoid division by zero

    // Calculate commit frequency (commits per hour)
    const commitFrequency = commits.length / hours

    // Determine iteration pattern
    let iterationPattern: 'low' | 'medium' | 'high'
    if (commitFrequency < 1) {
      iterationPattern = 'low'
    } else if (commitFrequency < 5) {
      iterationPattern = 'medium'
    } else {
      iterationPattern = 'high'
    }

    return {
      commitCount: commits.length,
      commitFrequency,
      iterationPattern,
      commitMessages,
      timeSpan: {
        start: startDate,
        end: endDate,
        hours,
      },
      hasGitHistory: true,
    }
  } catch (error) {
    // If git analysis fails, return empty result
    console.error('Error analyzing commits:', error)
    return {
      commitCount: 0,
      commitFrequency: 0,
      iterationPattern: 'low',
      commitMessages: [],
      hasGitHistory: false,
    }
  }
}

