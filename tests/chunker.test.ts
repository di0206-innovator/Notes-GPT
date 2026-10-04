import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../src/lib/chunker';

describe('chunkText', () => {
  it('should split text into chunks within the given chunk size', () => {
    const text = Array.from({ length: 1500 }, (_, i) => `word${i}`).join(' ');
    const pageTexts = [
      Array.from({ length: 500 }, (_, i) => `word${i}`).join(' '),
      Array.from({ length: 500 }, (_, i) => `word${i + 500}`).join(' '),
      Array.from({ length: 500 }, (_, i) => `word${i + 1000}`).join(' '),
    ];

    const chunks = chunkText(text, 'doc-123', 'notes.pdf', pageTexts, {
      chunkSize: 400,
      chunkOverlap: 50,
    });

    assert.ok(chunks.length > 1, 'Expected multiple chunks');
    assert.strictEqual(chunks[0].documentId, 'doc-123');
    assert.strictEqual(chunks[0].filename, 'notes.pdf');
    assert.ok(chunks[0].content.length > 0);
  });

  it('should assign reasonable page numbers based on page offsets', () => {
    const p1 = 'First page content with enough words to form a valid paragraph here.';
    const p2 = 'Second page content with enough words to form another paragraph here.';
    const text = `${p1} ${p2}`;

    const chunks = chunkText(text, 'doc-456', 'sample.pdf', [p1, p2], {
      chunkSize: 50,
      chunkOverlap: 10,
    });

    assert.ok(chunks.length >= 1);
    assert.strictEqual(chunks[0].pageNumber, 1);
  });

  it('should handle small or empty input gracefully', () => {
    const chunks = chunkText('', 'doc-empty', 'empty.pdf', []);
    assert.strictEqual(chunks.length, 0);
  });

  it('should handle edge cases where chunkOverlap >= chunkSize', () => {
    const text = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega.';
    const chunks = chunkText(text, 'doc-overlap', 'overlap.pdf', [text], {
      chunkSize: 10,
      chunkOverlap: 20, // Overlap larger than chunkSize
    });

    assert.ok(chunks.length > 0);
  });
});
