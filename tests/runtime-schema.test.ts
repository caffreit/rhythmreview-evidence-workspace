import { describe,expect,it } from 'vitest';
import { hasCurrentSchemaMarker } from '../lib/runtime-schema-bootstrap';

describe('runtime schema bootstrap',() => {
  it('does not replay historical table rebuilds after the final release schema exists',() => {
    expect(hasCurrentSchemaMarker([{ name:'id' },{ name:'release_approved_at' }])).toBe(true);
  });

  it('bootstraps a fresh workspace with no release table columns',() => {
    expect(hasCurrentSchemaMarker([])).toBe(false);
  });
});
