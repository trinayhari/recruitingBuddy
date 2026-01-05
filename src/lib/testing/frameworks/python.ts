// Python pytest test generation helpers

import { TestFile } from '../../requirements/types';

/**
 * Generate pytest configuration file
 */
export function createPytestConfig(): string {
  return `[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
timeout = 30
timeout_method = thread
addopts = "-v --tb=short"
`;
}

/**
 * Generate requirements.txt for test dependencies
 */
export function createRequirementsTxt(additionalDeps: string[] = []): string {
  const deps = ['pytest', 'pytest-timeout', ...additionalDeps];
  return deps.join('\n') + '\n';
}

/**
 * Generate a basic conftest.py if needed
 */
export function createConftestPy(): string {
  return `import pytest
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment before each test"""
    yield
    # Cleanup after test if needed
`;
}

/**
 * Extract requirement IDs from test file content
 */
export function extractRequirementIdsFromTest(testContent: string): string[] {
  const requirementIds: string[] = [];
  
  // Match patterns like # @requirement REQ-001 or # REQ-001
  const patterns = [
    /#\s*@requirement\s+(REQ-\d{3})/gi,
    /#\s*(REQ-\d{3})/g,
    /REQ-\d{3}/g,
  ];

  for (const pattern of patterns) {
    const matches = testContent.matchAll(pattern);
    for (const match of matches) {
      const reqId = match[1] || match[0];
      if (!requirementIds.includes(reqId)) {
        requirementIds.push(reqId);
      }
    }
  }

  return requirementIds;
}

