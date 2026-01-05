// Main sandbox runner interface

import { SandboxConfig, DEFAULT_SANDBOX_CONFIG } from './config';
import { SandboxResult } from '../requirements/types';
import { executeSandboxed, isDockerAvailable } from './docker';

/**
 * Run tests in sandboxed environment
 */
export async function runSandboxedTests(
  config: Partial<SandboxConfig> & { testFiles: SandboxConfig['testFiles']; submissionPath: string }
): Promise<SandboxResult> {
  // Merge with defaults
  const fullConfig: SandboxConfig = {
    ...DEFAULT_SANDBOX_CONFIG,
    language: 'python',
    framework: 'pytest',
    ...config,
  } as SandboxConfig;

  // Check Docker availability
  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    throw new Error(
      'Docker is not available. Please ensure Docker Desktop is installed and running.'
    );
  }

  return executeSandboxed(fullConfig);
}

