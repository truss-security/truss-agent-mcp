import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLastOffer,
  createWorkflowState,
  updateWorkflowFromAssistant,
} from '../src/ask/workflow-state.ts';

describe('workflow state', () => {
  it('detects last offer from assistant text', () => {
    assert.equal(
      detectLastOffer('Would you like to build a Filter for this?'),
      'build_filter'
    );
    assert.equal(
      detectLastOffer('Would you like me to query Truss API for this data?'),
      'query_api'
    );
    assert.equal(
      detectLastOffer(
        'Would you like me to build detection query rules for particular tools using these results? (Cortex, Falcon, Splunk, etc.)'
      ),
      'detection_rules'
    );
  });

  it('updates hasQueryResults from assistant text', () => {
    const state = createWorkflowState();
    const updated = updateWorkflowFromAssistant(state, 'Results: 5 matches\n1. [123] Report');
    assert.equal(updated.hasQueryResults, true);
    assert.equal(updated.lastFilterExpression, undefined);
  });

  it('extracts filter expression from search results', () => {
    const state = createWorkflowState();
    const updated = updateWorkflowFromAssistant(
      state,
      'Filter: tags = "Sandworm"\nResults: 3 matches'
    );
    assert.equal(updated.lastFilterExpression, 'tags = "Sandworm"');
  });
});
