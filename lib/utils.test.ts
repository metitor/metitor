import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
});
