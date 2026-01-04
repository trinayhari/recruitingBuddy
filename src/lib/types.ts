// Core types for the Review Buddy application

export interface SubmissionInput {
  githubUrl?: string;
  zipFile?: File;
  videoLink?: string;
  chatExport?: string;
  reflections?: string;
}

export interface FileTree {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTree[];
}

export interface StaticAnalysis {
  fileCount: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  entryPoints: string[];
  dependencies: {
    node?: Record<string, string>;
    python?: string[];
    other?: Record<string, any>;
  };
  framework?: string;
  architecture?: string;
}

export interface CommitAnalysis {
  commitCount: number;
  commitFrequency: number; // commits per hour
  iterationPattern: 'low' | 'medium' | 'high';
  commitMessages: string[];
  timeSpan?: {
    start: Date;
    end: Date;
    hours: number;
  };
  hasGitHistory: boolean;
}

export interface WorkStyleAnalysis {
  iterationPattern: 'low' | 'medium' | 'high';
  aiCollaborationStyle?: string;
  manualIntervention?: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface Decision {
  decision: string;
  rationale?: string;
  source: 'code' | 'readme' | 'reflections' | 'chat';
}

export interface RepoGuide {
  startHere: string;
  keyFiles: Array<{ path: string; description: string }>;
  skipFiles: string[];
}

export interface RedFlag {
  type: 'hardcoded_secrets' | 'high_todos' | 'console_logs' | 'large_files' | 'no_gitignore';
  severity: 'low' | 'medium' | 'high';
  description: string;
  count?: number;
}

export interface QuantifiedMetrics {
  // Project Development Signals
  codeOrganizationScore: number; // 0-100
  testPresence: {
    hasTests: boolean;
    testRatio: number; // test files / source files
    testFileCount: number;
  };
  documentationScore: number; // 0-100
  dependencyHealth: number; // 0-100
  fileSizeDistribution: {
    averageLinesPerFile: number;
    maxFileSize: number;
    largeFileCount: number; // files > 500 lines
  };

  // Software Design Signals
  typeSafetyRatio: number; // TypeScript files / (JS + TS files)
  modularityIndex: number; // 0-100
  entryPointClarity: number; // 0-100
  apiStructureScore: number; // 0-100

  // Work Habit Signals
  commitQualityScore: number; // 0-100
  developmentPatternScore: number; // 0-100
  timeInvestment: {
    hours: number;
    score: number; // 0-100
  };
  iterationScore: number; // 0-100

  // Red Flags
  redFlags: RedFlag[];

  // Overall composite score
  overallHireSignal: number; // 0-100 weighted average
}

export interface ReviewerBrief {
  id: string;
  tldr: {
    task?: string;
    delivered?: string;
    estimatedReviewTime?: string;
    stack?: string[];
  };
  workStyle: WorkStyleAnalysis;
  decisions: Decision[];
  repoGuide: RepoGuide;
  metrics?: QuantifiedMetrics;
  artifacts: {
    githubUrl?: string;
    videoLink?: string;
    chatExport?: string;
  };
  metadata: {
    analyzedAt: Date;
    analysisDuration: number;
    llmProvider: string;
    hasPartialData: boolean;
  };
}

export interface AnalysisResult {
  staticAnalysis: StaticAnalysis;
  commitAnalysis: CommitAnalysis;
  readmeContent?: string;
  brief: ReviewerBrief;
}

