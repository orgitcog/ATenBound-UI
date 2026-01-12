/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | scope (with framework integration)', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:scope');
    assert.ok(service, 'service exists');
  });

  test('it has access to integrated services', function (assert) {
    const service = this.owner.lookup('service:scope');
    assert.ok(service.tensorLogic, 'has tensorLogic service');
    assert.ok(service.hypermind, 'has hypermind service');
    assert.ok(service.atenSpace, 'has atenSpace service');
  });

  test('initializeScopeFrameworks initializes tensor for scope', function (assert) {
    const service = this.owner.lookup('service:scope');
    const tensorLogic = this.owner.lookup('service:tensor-logic');

    const mockScope = {
      id: 'test-scope-123',
      type: 'org',
      isGlobal: false,
      isOrg: true,
      isProject: false,
    };

    service.initializeScopeFrameworks(mockScope);

    const tensor = tensorLogic.getTensor('scope_test-scope-123');
    assert.ok(tensor, 'tensor created for scope');
    assert.strictEqual(tensor.name, 'scope_test-scope-123', 'tensor has correct name');
  });

  test('initializeScopeFrameworks pushes scope to hypermind', function (assert) {
    const service = this.owner.lookup('service:scope');
    const hypermind = this.owner.lookup('service:hypermind');

    const mockScope = {
      id: 'test-scope-456',
      type: 'project',
      isGlobal: false,
      isOrg: false,
      isProject: true,
    };

    const initialStackLength = hypermind.scopeStack.length;
    service.initializeScopeFrameworks(mockScope);

    assert.strictEqual(hypermind.scopeStack.length, initialStackLength + 1, 'scope pushed to stack');
    const currentScope = hypermind.getCurrentScope();
    assert.strictEqual(currentScope.config.scopeId, 'test-scope-456', 'correct scope pushed');
  });

  test('initializeScopeFrameworks maps scope to aten-space domain', function (assert) {
    const service = this.owner.lookup('service:scope');
    const atenSpace = this.owner.lookup('service:aten-space');

    const mockScope = {
      id: 'test-scope-789',
      type: 'org',
      isGlobal: false,
      isOrg: true,
      isProject: false,
    };

    const initialSpaceCount = Object.keys(atenSpace.spaceRegistry).length;
    service.initializeScopeFrameworks(mockScope);

    const newSpaceCount = Object.keys(atenSpace.spaceRegistry).length;
    assert.ok(newSpaceCount > initialSpaceCount, 'space created in aten-space');
  });

  test('initializeScopeFrameworks handles null scope gracefully', function (assert) {
    const service = this.owner.lookup('service:scope');

    // Should not throw
    assert.expect(0);
    service.initializeScopeFrameworks(null);
    service.initializeScopeFrameworks(undefined);
  });

  test('setOrg integrates with frameworks', function (assert) {
    const service = this.owner.lookup('service:scope');
    const tensorLogic = this.owner.lookup('service:tensor-logic');
    const hypermind = this.owner.lookup('service:hypermind');

    const mockOrg = {
      id: 'org-123',
      type: 'org',
      isGlobal: false,
      isOrg: true,
      isProject: false,
    };

    service.setOrg(mockOrg);

    assert.strictEqual(service.org, mockOrg, 'org is set');
    assert.ok(tensorLogic.getTensor('scope_org-123'), 'tensor created for org');
    assert.ok(hypermind.getCurrentScope(), 'scope pushed to hypermind');
  });

  test('setProject integrates with frameworks', function (assert) {
    const service = this.owner.lookup('service:scope');
    const tensorLogic = this.owner.lookup('service:tensor-logic');
    const hypermind = this.owner.lookup('service:hypermind');

    const mockProject = {
      id: 'project-456',
      type: 'project',
      isGlobal: false,
      isOrg: false,
      isProject: true,
    };

    service.setProject(mockProject);

    assert.strictEqual(service.project, mockProject, 'project is set');
    assert.ok(tensorLogic.getTensor('scope_project-456'), 'tensor created for project');
    assert.ok(hypermind.getCurrentScope(), 'scope pushed to hypermind');
  });

  test('full integration: org and project scopes', function (assert) {
    const service = this.owner.lookup('service:scope');
    const tensorLogic = this.owner.lookup('service:tensor-logic');
    const hypermind = this.owner.lookup('service:hypermind');
    const atenSpace = this.owner.lookup('service:aten-space');

    const mockOrg = {
      id: 'org-abc',
      type: 'org',
      isGlobal: false,
      isOrg: true,
      isProject: false,
    };

    const mockProject = {
      id: 'project-xyz',
      type: 'project',
      isGlobal: false,
      isOrg: false,
      isProject: true,
    };

    // Set org
    service.setOrg(mockOrg);
    assert.ok(tensorLogic.getTensor('scope_org-abc'), 'org tensor created');
    const orgScope = hypermind.getCurrentScope();
    assert.strictEqual(orgScope.config.scopeId, 'org-abc', 'org scope in hypermind');

    // Set project
    service.setProject(mockProject);
    assert.ok(tensorLogic.getTensor('scope_project-xyz'), 'project tensor created');
    const projectScope = hypermind.getCurrentScope();
    assert.strictEqual(projectScope.config.scopeId, 'project-xyz', 'project scope in hypermind');

    // Verify scopes are in stack
    assert.strictEqual(hypermind.scopeStack.length, 2, 'both scopes in stack');

    // Verify aten-space domains created
    assert.ok(Object.keys(atenSpace.spaceRegistry).length >= 2, 'domains created for both scopes');
  });
});
