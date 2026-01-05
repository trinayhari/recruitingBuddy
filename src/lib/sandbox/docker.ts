// Docker-based sandbox execution

import Docker from 'dockerode';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SandboxConfig } from './config';
import { SandboxResult, TestResult } from '../requirements/types';
import { v4 as uuidv4 } from 'uuid';

let docker: Docker | null = null;

function getDocker(): Docker {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

/**
 * Check if Docker is available
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const dockerClient = getDocker();
    await dockerClient.ping();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Build Docker image for test execution
 */
export async function buildTestImage(
  language: string,
  framework: string
): Promise<string> {
  const dockerClient = getDocker();
  
  // Image tag based on language and framework
  const imageTag = `test-runner-${language}-${framework}:latest`;

  // Check if image already exists
  try {
    const image = dockerClient.getImage(imageTag);
    await image.inspect();
    return imageTag;
  } catch {
    // Image doesn't exist, build it
  }

  // Build Dockerfile content
  const dockerfile = generateDockerfile(language, framework);
  
  // Create temporary directory for build context
  const buildDir = path.join(process.cwd(), '.next', 'docker-build', uuidv4());
  await fs.mkdir(buildDir, { recursive: true });
  
  try {
    await fs.writeFile(path.join(buildDir, 'Dockerfile'), dockerfile);
    
    // Build image
    const stream = await dockerClient.buildImage({
      context: buildDir,
      src: ['Dockerfile'],
    }, {
      t: imageTag,
    });

    // Wait for build to complete
    await new Promise<void>((resolve, reject) => {
      dockerClient.modem.followProgress(stream, (err, output) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return imageTag;
  } finally {
    // Cleanup build directory
    await fs.rm(buildDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Generate Dockerfile for test execution
 */
function generateDockerfile(language: string, framework: string): string {
  if (language === 'python' && framework === 'pytest') {
    return `FROM python:3.11-slim

# Install pytest and dependencies
RUN pip install --no-cache-dir pytest pytest-timeout

# Create test directory
WORKDIR /tests

# Copy test files (will be mounted)
COPY . /tests/

# Set working directory
WORKDIR /submission

# Run tests
CMD ["python", "-m", "pytest", "/tests", "-v", "--tb=short", "--json-report", "--json-report-file=/tmp/results.json"]
`;
  }

  // Default Python setup
  return `FROM python:3.11-slim
RUN pip install --no-cache-dir pytest pytest-timeout
WORKDIR /tests
COPY . /tests/
WORKDIR /submission
CMD ["python", "-m", "pytest", "/tests", "-v", "--tb=short"]
`;
}

/**
 * Execute tests in Docker sandbox
 */
export async function executeSandboxed(config: SandboxConfig): Promise<SandboxResult> {
  const dockerClient = getDocker();
  const startTime = Date.now();

  // Check Docker availability
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available. Please ensure Docker is running.');
  }

  // Build or get test image
  const imageTag = await buildTestImage(config.language, config.framework);

  // Create temporary directory for test files
  const testDir = path.join(process.cwd(), '.next', 'test-runs', uuidv4());
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Write test files
    for (const testFile of config.testFiles) {
      const filePath = path.join(testDir, testFile.filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, testFile.content, 'utf-8');
    }

    // Write framework config files
    if (config.language === 'python' && config.framework === 'pytest') {
      await fs.writeFile(
        path.join(testDir, 'pytest.ini'),
        '[tool.pytest.ini_options]\ntestpaths = ["."]\ntimeout = 30\n',
        'utf-8'
      );
      await fs.writeFile(
        path.join(testDir, 'requirements.txt'),
        'pytest\npytest-timeout\n',
        'utf-8'
      );
    }

    // Create container with security constraints
    const container = await dockerClient.createContainer({
      Image: imageTag,
      Cmd: [],
      WorkingDir: '/submission',
      HostConfig: {
        Binds: [
          `${config.submissionPath}:/submission:ro`, // Read-only mount
          `${testDir}:/tests:ro`, // Read-only test files
          `/tmp:/tmp:rw`, // Temp directory for outputs
        ],
        Memory: parseMemoryLimit(config.memoryLimit),
        MemorySwap: parseMemoryLimit(config.memoryLimit), // Prevent swap
        CpuQuota: Math.floor(config.cpuLimit * 100000), // Convert to microseconds
        CpuPeriod: 100000,
        NetworkMode: config.networkDisabled ? 'none' : 'bridge',
        ReadonlyRootfs: false, // We need /tmp writable
        SecurityOpt: ['no-new-privileges:true'],
        CapDrop: ['ALL'],
        CapAdd: [], // No capabilities
      },
      Env: [
        'PYTHONUNBUFFERED=1',
        'PYTHONDONTWRITEBYTECODE=1',
      ],
    });

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      // Start container
      await container.start();

      // Set timeout
      const timeoutId = setTimeout(async () => {
        try {
          await container.stop({ t: 0 });
        } catch {}
      }, config.timeout * 1000);

      // Wait for container to finish
      const result = await container.wait();
      exitCode = result.StatusCode;
      clearTimeout(timeoutId);

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: false,
      });
      
      const logOutput = logs.toString('utf-8');
      // Split stdout/stderr (basic approach - Docker combines them)
      stdout = logOutput;
      stderr = '';

      // Try to read results file if pytest-json-report was used
      try {
        const resultsPath = path.join('/tmp', 'results.json');
        // This won't work directly, we'd need to copy from container
        // For now, parse stdout
      } catch {}

    } finally {
      // Cleanup container
      try {
        await container.remove({ force: true });
      } catch {}
    }

    // Parse test results from stdout
    const testResults = parseTestResults(stdout, stderr, config.framework, exitCode);

    const executionTime = Date.now() - startTime;

    return {
      success: exitCode === 0 || testResults.some(t => t.status === 'pass'),
      test_results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'pass').length,
        failed: testResults.filter(t => t.status === 'fail').length,
        errors: testResults.filter(t => t.status === 'error').length,
        timeouts: testResults.filter(t => t.status === 'timeout').length,
      },
      execution_time_ms: executionTime,
      metadata: {
        container_id: container.id,
        exit_code: exitCode,
      },
    };

  } finally {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Parse memory limit string to bytes
 */
function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 512 * 1024 * 1024; // Default 512MB
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'g': return value * 1024 * 1024 * 1024;
    case 'm': return value * 1024 * 1024;
    case 'k': return value * 1024;
    default: return value * 1024 * 1024; // Default to MB
  }
}

/**
 * Parse test results from pytest output
 */
function parseTestResults(
  stdout: string,
  stderr: string,
  framework: string,
  exitCode: number
): TestResult[] {
  const results: TestResult[] = [];

  if (framework === 'pytest') {
    // Parse pytest output
    // Format: "test_file.py::test_function PASSED" or "FAILED"
    const testPattern = /^([\w/]+\.py)::([\w_]+)\s+(PASSED|FAILED|ERROR|SKIPPED)/gm;
    const lines = stdout.split('\n');

    for (const line of lines) {
      const match = line.match(/^([\w/]+\.py)::([\w_]+)\s+(PASSED|FAILED|ERROR|SKIPPED)/);
      if (match) {
        const [, file, testName, status] = match;
        
        // Extract requirement IDs from test name or file content
        const requirementIds: string[] = [];
        const reqIdMatch = testName.match(/REQ-\d{3}/g);
        if (reqIdMatch) {
          requirementIds.push(...reqIdMatch);
        }

        let resultStatus: 'pass' | 'fail' | 'error' | 'timeout';
        if (status === 'PASSED') {
          resultStatus = 'pass';
        } else if (status === 'FAILED') {
          resultStatus = 'fail';
        } else if (status === 'ERROR') {
          resultStatus = 'error';
        } else {
          continue; // Skip SKIPPED
        }

        results.push({
          test_name: `${file}::${testName}`,
          requirement_ids: requirementIds,
          status: resultStatus,
          duration_ms: 0, // Would need pytest-json-report for accurate timing
          stdout: status === 'PASSED' ? undefined : stdout,
          stderr: status !== 'PASSED' ? stderr : undefined,
          error_message: status !== 'PASSED' ? `Test ${status.toLowerCase()}` : undefined,
        });
      }
    }

    // If no structured output found, create a single result
    if (results.length === 0) {
      results.push({
        test_name: 'test_suite',
        requirement_ids: [],
        status: exitCode === 0 ? 'pass' : 'fail',
        duration_ms: 0,
        stdout,
        stderr,
        error_message: exitCode !== 0 ? 'Test execution failed' : undefined,
      });
    }
  }

  return results;
}

