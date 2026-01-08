// Supabase store operations (ready to wire up)

import { getSupabaseClient, isSupabaseConfigured } from './client';
import { createServerSupabaseClient } from '../auth/server';
import { RequirementSpec } from '../requirements/schemas';
import { GeneratedTestSuite, TestRun } from '../requirements/types';
import { briefsStore } from '../store'; // Fallback to file store

/**
 * Generate a unique shareable token
 */
function generateShareableToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create a new prompt
 */
export async function createPrompt(
  content: string, 
  userId: string, 
  options?: { title?: string; shareable?: boolean }
): Promise<{ id: string; shareableToken?: string }> {
  // Use server-side client with auth context for RLS policies
  let client;
  try {
    client = await createServerSupabaseClient();
  } catch {
    // Fallback to regular client if server client fails
    client = getSupabaseClient();
  }
  
  if (!client || !isSupabaseConfigured()) {
    // Fallback: generate ID and store in memory/file
    const id = `prompt-${Date.now()}`;
    // TODO: Store in file-based fallback
    return { id };
  }

  const shareableToken = options?.shareable ? generateShareableToken() : undefined;

  const { data, error } = await client
    .from('prompts')
    .insert({ 
      content, 
      user_id: userId,
      title: options?.title,
      shareable_token: shareableToken
    })
    .select('id, shareable_token')
    .single();

  if (error) {
    throw new Error(`Failed to create prompt: ${error.message}`);
  }

  return { id: data.id, shareableToken: data.shareable_token };
}

/**
 * Get prompt by ID
 */
export async function getPrompt(id: string): Promise<{ id: string; content: string; title?: string; shareable_token?: string } | null> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    // Fallback: return null
    return null;
  }

  const { data, error } = await client
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get prompt by shareable token
 */
export async function getPromptByToken(token: string): Promise<{ id: string; content: string; title?: string; user_id: string } | null> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await client
    .from('prompts')
    .select('id, content, title, user_id')
    .eq('shareable_token', token)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get all prompts for a user (assessments)
 */
export async function getPromptsByUserId(userId: string) {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await client
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a prompt (assessment)
 */
export async function updatePrompt(
  promptId: string,
  userId: string,
  updates: { title?: string; content?: string }
): Promise<void> {
  // Use server-side client with auth context for RLS policies
  let client;
  try {
    client = await createServerSupabaseClient();
  } catch {
    client = getSupabaseClient();
  }
  
  if (!client || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('prompts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', promptId)
    .eq('user_id', userId); // Ensure user owns the prompt

  if (error) {
    throw new Error(`Failed to update prompt: ${error.message}`);
  }
}

/**
 * Delete a prompt (assessment)
 */
export async function deletePrompt(promptId: string, userId: string): Promise<void> {
  // Use server-side client with auth context for RLS policies
  let client;
  try {
    client = await createServerSupabaseClient();
  } catch {
    client = getSupabaseClient();
  }
  
  if (!client || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('user_id', userId); // Ensure user owns the prompt

  if (error) {
    throw new Error(`Failed to delete prompt: ${error.message}`);
  }
}

/**
 * Get submissions for a specific prompt (assessment)
 */
export async function getSubmissionsByPromptId(promptId: string) {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await client
    .from('submissions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return data || [];
}

/**
 * Save requirement spec
 */
export async function saveRequirementSpec(
  promptId: string,
  spec: RequirementSpec
): Promise<string> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    // Fallback: generate ID
    return `req-spec-${Date.now()}`;
  }

  const { data, error } = await client
    .from('requirement_specs')
    .insert({
      prompt_id: promptId,
      requirements: spec.requirements,
      constraints: spec.constraints,
      edge_cases: spec.edge_cases,
      metadata: spec.metadata,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save requirement spec: ${error.message}`);
  }

  return data.id;
}

/**
 * Get requirement spec by ID
 */
export async function getRequirementSpec(id: string): Promise<RequirementSpec | null> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await client
    .from('requirement_specs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return {
    requirements: data.requirements,
    constraints: data.constraints,
    edge_cases: data.edge_cases,
    metadata: data.metadata,
  } as RequirementSpec;
}

/**
 * Save test suite
 */
export async function saveTestSuite(suite: GeneratedTestSuite): Promise<string> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return suite.id;
  }

  const { data, error } = await client
    .from('test_suites')
    .insert({
      id: suite.id,
      requirement_spec_id: suite.requirement_spec_id,
      language: suite.language,
      framework: suite.framework,
      test_files: suite.test_files,
      runner_config: suite.runner_config,
      metadata: suite.metadata,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save test suite: ${error.message}`);
  }

  return data.id;
}

/**
 * Get test suite by ID
 */
export async function getTestSuite(id: string): Promise<GeneratedTestSuite | null> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await client
    .from('test_suites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return {
    id: data.id,
    requirement_spec_id: data.requirement_spec_id,
    language: data.language,
    framework: data.framework,
    test_files: data.test_files,
    runner_config: data.runner_config,
    metadata: data.metadata,
  } as GeneratedTestSuite;
}

/**
 * Save test run
 */
export async function saveTestRun(run: TestRun): Promise<string> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return run.id;
  }

  const { data, error } = await client
    .from('test_runs')
    .insert({
      id: run.id,
      submission_id: run.submission_id,
      test_suite_id: run.test_suite_id,
      status: run.status,
      results: run.results,
      requirement_scores: run.requirement_scores,
      overall_score: run.overall_score?.weighted_score,
      weighted_score: run.overall_score?.weighted_score,
      confidence_score: run.overall_score?.confidence_score,
      execution_metadata: run.execution_metadata,
      started_at: run.execution_metadata?.started_at,
      completed_at: run.execution_metadata?.completed_at,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save test run: ${error.message}`);
  }

  return data.id;
}

/**
 * Get test run by ID
 */
export async function getTestRun(id: string): Promise<TestRun | null> {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await client
    .from('test_runs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return {
    id: data.id,
    submission_id: data.submission_id,
    test_suite_id: data.test_suite_id,
    status: data.status,
    results: data.results,
    requirement_scores: data.requirement_scores,
    overall_score: data.overall_score ? {
      requirements_met: data.overall_score.requirements_met || 0,
      total_requirements: data.overall_score.total_requirements || 0,
      percentage: data.overall_score.percentage || 0,
      weighted_score: data.weighted_score || 0,
      confidence_score: data.confidence_score || 0,
      breakdown: data.overall_score.breakdown || {},
    } : undefined,
    execution_metadata: data.execution_metadata,
  } as TestRun;
}

/**
 * Create or update submission
 */
export async function saveSubmission(
  submissionId: string,
  userId: string,
  data: {
    promptId?: string;
    githubUrl?: string;
    videoLink?: string;
    chatExport?: string;
    reflections?: string;
    briefData?: any;
  }
): Promise<void> {
  // Use server-side client with auth context for RLS policies
  let client;
  try {
    client = await createServerSupabaseClient();
  } catch {
    // Fallback to regular client if server client fails
    client = getSupabaseClient();
  }
  
  if (!client || !isSupabaseConfigured()) {
    // Fallback to existing file store
    if (data.briefData) {
      await briefsStore.set(submissionId, data.briefData);
    }
    return;
  }

  const { error } = await client
    .from('submissions')
    .upsert({
      id: submissionId,
      user_id: userId,
      prompt_id: data.promptId,
      github_url: data.githubUrl,
      video_link: data.videoLink,
      chat_export: data.chatExport,
      reflections: data.reflections,
      brief_data: data.briefData,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to save submission: ${error.message}`);
  }
}

/**
 * Get user's submissions
 */
export async function getSubmissionsByUserId(userId: string) {
  const client = getSupabaseClient();
  
  if (!client || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await client
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return data || [];
}

