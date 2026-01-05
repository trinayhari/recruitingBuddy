// Sandbox configuration types

import { TestFile } from '../requirements/types';

export interface SandboxConfig {
  language: string;
  framework: string;
  testFiles: TestFile[];
  submissionPath: string; // Path to submission directory on host
  timeout: number; // seconds
  memoryLimit: string; // e.g., "512m"
  cpuLimit: number; // cores (e.g., 1.0)
  networkDisabled: boolean;
}

export const DEFAULT_SANDBOX_CONFIG: Partial<SandboxConfig> = {
  timeout: 60,
  memoryLimit: '512m',
  cpuLimit: 1.0,
  networkDisabled: true,
};

