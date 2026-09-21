import { describe,expect,it } from 'vitest';
import { hasCurrentSchemaMarker,hasWp30SchemaMarkers } from '../lib/runtime-schema-bootstrap';

describe('runtime schema bootstrap',() => {
  it('does not replay historical table rebuilds after the final release schema exists',() => {
    expect(hasCurrentSchemaMarker([{ name:'id' },{ name:'release_approved_at' }])).toBe(true);
  });

  it('bootstraps a fresh workspace with no release table columns',() => {
    expect(hasCurrentSchemaMarker([])).toBe(false);
  });

  it('does not skip the controlled-document migration when only the release marker exists',()=>{
    expect(hasWp30SchemaMarkers({releaseColumns:[{name:'release_approved_at'}],sourceRevisionColumns:[{name:'object_key'}],templateColumns:[{name:'current_version_id'}]})).toBe(true);
    expect(hasWp30SchemaMarkers({releaseColumns:[{name:'release_approved_at'}],sourceRevisionColumns:[],templateColumns:[]})).toBe(false);
  });
});
