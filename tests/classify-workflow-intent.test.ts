import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyWorkflowIntent,
  buildIntentHint,
} from '../src/ask/classify-workflow-intent.ts';
import { createWorkflowState } from '../src/ask/workflow-state.ts';

describe('classifyWorkflowIntent', () => {
  it('detects filter-building questions', () => {
    assert.equal(
      classifyWorkflowIntent(
        'Make for me a Truss Filter that will identify Sandworm malware',
        createWorkflowState()
      ),
      'filter_build'
    );
    assert.equal(
      classifyWorkflowIntent('Build a filter for LockBit ransomware', createWorkflowState()),
      'filter_build'
    );
  });

  it('detects knowledge questions', () => {
    assert.equal(
      classifyWorkflowIntent('Why not use title = "Sandworm"?', createWorkflowState()),
      'knowledge'
    );
    assert.equal(
      classifyWorkflowIntent('What aliases does Sandworm have?', createWorkflowState()),
      'knowledge'
    );
  });

  it('detects query execution requests', () => {
    assert.equal(
      classifyWorkflowIntent('Search Truss for Sandworm products', createWorkflowState()),
      'query_execute'
    );
    assert.equal(
      classifyWorkflowIntent('Find reports tagged Sandworm from last 30 days', createWorkflowState()),
      'query_execute'
    );
  });

  it('detects context-only follow-ups', () => {
    assert.equal(
      classifyWorkflowIntent(
        "Don't query truss api again — group and deduplicate the IOCs you just gave me",
        createWorkflowState()
      ),
      'context_only'
    );
    assert.equal(
      classifyWorkflowIntent(
        'Extract all IOC indicators from these returned products',
        createWorkflowState()
      ),
      'context_only'
    );
  });

  it('detects format and detection intents', () => {
    assert.equal(
      classifyWorkflowIntent('Export as STIX', createWorkflowState()),
      'format_output'
    );
    assert.equal(
      classifyWorkflowIntent('detect splunk rules for these IOCs', createWorkflowState()),
      'detection_rules'
    );
  });

  it('maps affirmative replies to last offer', () => {
    const state = { ...createWorkflowState(), lastOffer: 'build_filter' as const };
    assert.equal(classifyWorkflowIntent('yes', state), 'filter_build');
  });

  it('buildIntentHint formats intent prefix', () => {
    assert.equal(buildIntentHint('filter_build'), '[intent: filter_build]');
  });
});
