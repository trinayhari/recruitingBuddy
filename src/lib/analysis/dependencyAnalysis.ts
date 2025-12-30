import * as fs from 'fs/promises'
import * as path from 'path'
import { StaticAnalysis } from '../types'

export async function parseDependencies(repoPath: string): Promise<StaticAnalysis['dependencies']> {
  const dependencies: StaticAnalysis['dependencies'] = {}

  // Check for package.json (Node.js)
  try {
    const packageJsonPath = path.join(repoPath, 'package.json')
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)
    
    dependencies.node = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }
  } catch {
    // No package.json, that's fine
  }

  // Check for requirements.txt (Python)
  try {
    const requirementsPath = path.join(repoPath, 'requirements.txt')
    const requirementsContent = await fs.readFile(requirementsPath, 'utf-8')
    dependencies.python = requirementsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
  } catch {
    // No requirements.txt, that's fine
  }

  // Check for Pipfile
  try {
    const pipfilePath = path.join(repoPath, 'Pipfile')
    const pipfileContent = await fs.readFile(pipfilePath, 'utf-8')
    dependencies.other = { pipfile: pipfileContent }
  } catch {
    // No Pipfile, that's fine
  }

  // Check for poetry.lock
  try {
    const poetryPath = path.join(repoPath, 'poetry.lock')
    await fs.access(poetryPath)
    dependencies.other = { ...dependencies.other, poetry: true }
  } catch {
    // No poetry.lock, that's fine
  }

  // Check for go.mod (Go)
  try {
    const goModPath = path.join(repoPath, 'go.mod')
    const goModContent = await fs.readFile(goModPath, 'utf-8')
    dependencies.other = { ...dependencies.other, goMod: goModContent }
  } catch {
    // No go.mod, that's fine
  }

  // Check for Cargo.toml (Rust)
  try {
    const cargoPath = path.join(repoPath, 'Cargo.toml')
    const cargoContent = await fs.readFile(cargoPath, 'utf-8')
    dependencies.other = { ...dependencies.other, cargo: cargoContent }
  } catch {
    // No Cargo.toml, that's fine
  }

  return dependencies
}

export function detectFramework(dependencies: StaticAnalysis['dependencies'], files: string[]): string | undefined {
  // Check Node.js frameworks
  if (dependencies.node) {
    if (dependencies.node.next) return 'Next.js'
    if (dependencies.node.react) return 'React'
    if (dependencies.node['@angular/core']) return 'Angular'
    if (dependencies.node.vue) return 'Vue'
    if (dependencies.node.express) return 'Express'
    if (dependencies.node['fastify']) return 'Fastify'
    if (dependencies.node.koa) return 'Koa'
  }

  // Check Python frameworks
  if (dependencies.python) {
    const pythonDeps = dependencies.python.join(' ').toLowerCase()
    if (pythonDeps.includes('django')) return 'Django'
    if (pythonDeps.includes('flask')) return 'Flask'
    if (pythonDeps.includes('fastapi')) return 'FastAPI'
    if (pythonDeps.includes('tornado')) return 'Tornado'
  }

  // Check file structure
  if (files.some(f => f.includes('app.py') || f.includes('main.py'))) {
    return 'Python Application'
  }

  if (files.some(f => f.includes('index.html'))) {
    return 'Static HTML'
  }

  return undefined
}

