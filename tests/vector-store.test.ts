import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity } from '../src/lib/vector-store';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v1 = [1, 2, 3, 4, 5];
    const score = cosineSimilarity(v1, v1);
    assert.ok(Math.abs(score - 1.0) < 1e-6);
  });

  it('should return 0 for orthogonal vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    const score = cosineSimilarity(v1, v2);
    assert.strictEqual(score, 0);
  });

  it('should return -1 for opposite vectors', () => {
    const v1 = [1, 2, 3];
    const v2 = [-1, -2, -3];
    const score = cosineSimilarity(v1, v2);
    assert.ok(Math.abs(score - (-1.0)) < 1e-6);
  });

  it('should return 0 for zero vectors', () => {
    const v1 = [0, 0, 0];
    const v2 = [1, 2, 3];
    const score = cosineSimilarity(v1, v2);
    assert.strictEqual(score, 0);
  });

  it('should return 0 when vector dimensions mismatch', () => {
    const v1 = [1, 2];
    const v2 = [1, 2, 3];
    const score = cosineSimilarity(v1, v2);
    assert.strictEqual(score, 0);
  });
});
