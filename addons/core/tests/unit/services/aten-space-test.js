/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | aten-space', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    assert.ok(service, 'service exists');
  });

  test('it initializes with empty registries', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    assert.ok(service.spaceRegistry, 'spaceRegistry exists');
    assert.ok(service.boundaries, 'boundaries exists');
    assert.strictEqual(Object.keys(service.spaceRegistry).length, 0, 'spaceRegistry is empty');
    assert.strictEqual(Object.keys(service.boundaries).length, 0, 'boundaries is empty');
  });

  test('it initializes with empty atomSpace', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    assert.ok(service.atomSpace, 'atomSpace exists');
    assert.ok(Array.isArray(service.atomSpace.atoms), 'atoms is an array');
    assert.ok(Array.isArray(service.atomSpace.links), 'links is an array');
  });

  test('defineBoundary creates boundary with correct properties', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const config = {
      type: 'dirichlet',
      constraints: { min: 0, max: 10 },
      domain: { id: 'test-domain' },
    };
    const boundary = service.defineBoundary('testBoundary', config);

    assert.ok(boundary, 'boundary is created');
    assert.strictEqual(boundary.name, 'testBoundary', 'boundary has correct name');
    assert.strictEqual(boundary.type, 'dirichlet', 'boundary has correct type');
    assert.deepEqual(boundary.constraints, config.constraints, 'boundary has correct constraints');
    assert.deepEqual(boundary.domain, config.domain, 'boundary has correct domain');
  });

  test('defineBoundary uses default type when not specified', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const boundary = service.defineBoundary('testBoundary', {});

    assert.strictEqual(boundary.type, 'dirichlet', 'uses default dirichlet type');
  });

  test('defineBoundary stores boundary in registry', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.defineBoundary('testBoundary', { type: 'neumann' });

    assert.ok(service.boundaries.testBoundary, 'boundary is stored');
    assert.strictEqual(service.boundaries.testBoundary.name, 'testBoundary', 'stored boundary has correct name');
  });

  test('createSpace creates space with correct properties', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.defineBoundary('testBoundary', { type: 'periodic' });
    const space = service.createSpace('testSpace', {
      boundary: 'testBoundary',
      shape: [3, 3],
      dimensions: 2,
    });

    assert.ok(space, 'space is created');
    assert.strictEqual(space.name, 'testSpace', 'space has correct name');
    assert.strictEqual(space.boundary, 'testBoundary', 'space has correct boundary');
    assert.strictEqual(space.dimensions, 2, 'space has correct dimensions');
    assert.ok(space.tensorSpace, 'space has tensorSpace');
  });

  test('createSpace uses default dimensions when not specified', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const space = service.createSpace('testSpace', {});

    assert.strictEqual(space.dimensions, 1, 'uses default dimensions of 1');
  });

  test('createSpace stores space in registry', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('testSpace', { boundary: 'testBoundary' });

    assert.ok(service.spaceRegistry.testSpace, 'space is stored');
    assert.strictEqual(service.spaceRegistry.testSpace.name, 'testSpace', 'stored space has correct name');
  });

  test('createSpace adds space to atomSpace', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const initialAtomsCount = service.atomSpace.atoms.length;

    service.createSpace('testSpace', {});

    assert.strictEqual(service.atomSpace.atoms.length, initialAtomsCount + 1, 'atom added to atomSpace');
    const atom = service.atomSpace.atoms[service.atomSpace.atoms.length - 1];
    assert.strictEqual(atom.type, 'space', 'atom has correct type');
  });

  test('getSpace retrieves correct space', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('space1', { dimensions: 1 });
    service.createSpace('space2', { dimensions: 2 });

    const space1 = service.getSpace('space1');
    assert.strictEqual(space1.name, 'space1', 'correct space retrieved');
    assert.strictEqual(space1.dimensions, 1, 'space has correct dimensions');

    const space2 = service.getSpace('space2');
    assert.strictEqual(space2.name, 'space2', 'correct space retrieved');
    assert.strictEqual(space2.dimensions, 2, 'space has correct dimensions');
  });

  test('getBoundary retrieves correct boundary', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.defineBoundary('boundary1', { type: 'dirichlet' });
    service.defineBoundary('boundary2', { type: 'neumann' });

    const boundary1 = service.getBoundary('boundary1');
    assert.strictEqual(boundary1.name, 'boundary1', 'correct boundary retrieved');
    assert.strictEqual(boundary1.type, 'dirichlet', 'boundary has correct type');

    const boundary2 = service.getBoundary('boundary2');
    assert.strictEqual(boundary2.name, 'boundary2', 'correct boundary retrieved');
    assert.strictEqual(boundary2.type, 'neumann', 'boundary has correct type');
  });

  test('executeInSpace throws error for non-existent space', function (assert) {
    const service = this.owner.lookup('service:aten-space');

    assert.throws(
      () => service.executeInSpace('nonexistent', 'operation'),
      /Space not found: nonexistent/,
      'throws error for non-existent space'
    );
  });

  test('executeInSpace records operation in space', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('testSpace', {});

    const result = service.executeInSpace('testSpace', 'transform', { param: 'value' });

    assert.ok(result, 'operation result returned');
    assert.strictEqual(result.space, 'testSpace', 'result has correct space');
    assert.strictEqual(result.operation, 'transform', 'result has correct operation');
    assert.deepEqual(result.params, { param: 'value' }, 'result has correct params');

    const space = service.getSpace('testSpace');
    assert.strictEqual(space.operations.length, 1, 'operation recorded in space');
  });

  test('mapScopeToDomain creates boundary and space for global scope', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const scopeModel = {
      id: 'global',
      type: 'global',
      isGlobal: true,
      isOrg: false,
      isProject: false,
    };

    const domain = service.mapScopeToDomain(scopeModel);

    assert.ok(domain, 'domain created');
    assert.ok(domain.name.includes('global'), 'domain name includes global');
    assert.strictEqual(domain.dimensions, 1, 'global scope has 1 dimension');

    const boundaryName = 'boundary_global';
    const boundary = service.getBoundary(boundaryName);
    assert.ok(boundary, 'boundary created');
    assert.strictEqual(boundary.type, 'periodic', 'global boundary is periodic');
  });

  test('mapScopeToDomain creates boundary and space for org scope', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const scopeModel = {
      id: 'org-123',
      type: 'org',
      isGlobal: false,
      isOrg: true,
      isProject: false,
    };

    const domain = service.mapScopeToDomain(scopeModel);

    assert.ok(domain, 'domain created');
    assert.ok(domain.name.includes('org'), 'domain name includes org');
    assert.strictEqual(domain.dimensions, 2, 'org scope has 2 dimensions');

    const boundaryName = 'boundary_org';
    const boundary = service.getBoundary(boundaryName);
    assert.ok(boundary, 'boundary created');
    assert.strictEqual(boundary.type, 'dirichlet', 'org boundary is dirichlet');
  });

  test('mapScopeToDomain creates boundary and space for project scope', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const scopeModel = {
      id: 'project-456',
      type: 'project',
      isGlobal: false,
      isOrg: false,
      isProject: true,
    };

    const domain = service.mapScopeToDomain(scopeModel);

    assert.ok(domain, 'domain created');
    assert.ok(domain.name.includes('project'), 'domain name includes project');
    assert.strictEqual(domain.dimensions, 3, 'project scope has 3 dimensions');

    const boundaryName = 'boundary_project';
    const boundary = service.getBoundary(boundaryName);
    assert.ok(boundary, 'boundary created');
    assert.strictEqual(boundary.type, 'dirichlet', 'project boundary is dirichlet');
  });

  test('addLink creates link between atoms', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    const initialLinksCount = service.atomSpace.links.length;

    const link = service.addLink('atom1', 'atom2', 'relates-to');

    assert.ok(link, 'link created');
    assert.ok(link.id, 'link has id');
    assert.strictEqual(link.from, 'atom1', 'link has correct from');
    assert.strictEqual(link.to, 'atom2', 'link has correct to');
    assert.strictEqual(link.type, 'relates-to', 'link has correct type');
    assert.strictEqual(service.atomSpace.links.length, initialLinksCount + 1, 'link added to atomSpace');
  });

  test('queryAtomSpace finds matching atoms by type', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('space1', {});
    service.createSpace('space2', {});

    const results = service.queryAtomSpace({ type: 'space' });

    assert.ok(results.length >= 2, 'found matching atoms');
    assert.strictEqual(results[0].type, 'space', 'result has correct type');
  });

  test('queryAtomSpace finds matching atoms by name', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('testSpace1', {});
    service.createSpace('testSpace2', {});
    service.createSpace('otherSpace', {});

    const results = service.queryAtomSpace({ name: 'testSpace' });

    assert.strictEqual(results.length, 2, 'found 2 matching atoms');
  });

  test('multiple spaces can coexist', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.createSpace('space1', { dimensions: 1 });
    service.createSpace('space2', { dimensions: 2 });
    service.createSpace('space3', { dimensions: 3 });

    assert.strictEqual(Object.keys(service.spaceRegistry).length, 3, '3 spaces created');
    assert.ok(service.getSpace('space1'), 'space1 exists');
    assert.ok(service.getSpace('space2'), 'space2 exists');
    assert.ok(service.getSpace('space3'), 'space3 exists');
  });

  test('multiple boundaries can coexist', function (assert) {
    const service = this.owner.lookup('service:aten-space');
    service.defineBoundary('boundary1', { type: 'dirichlet' });
    service.defineBoundary('boundary2', { type: 'neumann' });
    service.defineBoundary('boundary3', { type: 'periodic' });

    assert.strictEqual(Object.keys(service.boundaries).length, 3, '3 boundaries created');
    assert.ok(service.getBoundary('boundary1'), 'boundary1 exists');
    assert.ok(service.getBoundary('boundary2'), 'boundary2 exists');
    assert.ok(service.getBoundary('boundary3'), 'boundary3 exists');
  });
});
