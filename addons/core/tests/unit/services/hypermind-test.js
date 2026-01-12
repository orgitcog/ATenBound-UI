/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | hypermind', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    assert.ok(service, 'service exists');
  });

  test('it initializes with empty memory store', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    assert.ok(service.memoryStore, 'memoryStore exists');
    assert.ok(service.memoryStore.hot, 'hot tier exists');
    assert.ok(service.memoryStore.warm, 'warm tier exists');
    assert.ok(service.memoryStore.cold, 'cold tier exists');
    assert.ok(service.memoryStore.archived, 'archived tier exists');
  });

  test('it initializes with empty scope stack', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    assert.ok(Array.isArray(service.scopeStack), 'scopeStack is an array');
    assert.strictEqual(service.scopeStack.length, 0, 'scopeStack is empty');
  });

  test('it initializes with empty context graph', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    assert.ok(service.contextGraph, 'contextGraph exists');
    assert.ok(Array.isArray(service.contextGraph.nodes), 'nodes is an array');
    assert.ok(Array.isArray(service.contextGraph.edges), 'edges is an array');
  });

  test('pushScope adds scope to stack', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const config = { name: 'test', type: 'org' };
    const scope = service.pushScope(config);

    assert.ok(scope, 'scope is returned');
    assert.ok(scope.id, 'scope has id');
    assert.deepEqual(scope.config, config, 'scope has correct config');
    assert.strictEqual(service.scopeStack.length, 1, 'scope added to stack');
  });

  test('pushScope creates scope with timestamp', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const scope = service.pushScope({ name: 'test' });

    assert.ok(scope.timestamp, 'scope has timestamp');
    assert.ok(new Date(scope.timestamp).getTime() > 0, 'timestamp is valid');
  });

  test('pushScope creates scope with parent reference', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const parent = service.pushScope({ name: 'parent' });
    const child = service.pushScope({ name: 'child' });

    assert.strictEqual(child.parent, parent, 'child has correct parent reference');
    assert.strictEqual(parent.parent, null, 'parent has no parent');
  });

  test('getCurrentScope returns current scope', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    assert.strictEqual(service.getCurrentScope(), null, 'returns null when empty');

    const scope1 = service.pushScope({ name: 'scope1' });
    assert.strictEqual(service.getCurrentScope(), scope1, 'returns first scope');

    const scope2 = service.pushScope({ name: 'scope2' });
    assert.strictEqual(service.getCurrentScope(), scope2, 'returns second scope');
  });

  test('popScope removes scope from stack', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const scope1 = service.pushScope({ name: 'scope1' });
    const scope2 = service.pushScope({ name: 'scope2' });

    assert.strictEqual(service.scopeStack.length, 2, 'stack has 2 scopes');

    const popped = service.popScope();
    assert.strictEqual(popped, scope2, 'correct scope popped');
    assert.strictEqual(service.scopeStack.length, 1, 'stack has 1 scope');
    assert.strictEqual(service.getCurrentScope(), scope1, 'current scope is correct');
  });

  test('popScope throws error when stack is empty', function (assert) {
    const service = this.owner.lookup('service:hypermind');

    assert.throws(
      () => service.popScope(),
      /Cannot pop from empty scope stack/,
      'throws error when empty'
    );
  });

  test('storeContext stores in hot tier by default', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'value1' });

    assert.ok(service.memoryStore.hot.key1, 'context stored in hot tier');
    assert.strictEqual(service.memoryStore.hot.key1.key, 'key1', 'key is correct');
    assert.deepEqual(service.memoryStore.hot.key1.value, { data: 'value1' }, 'value is correct');
  });

  test('storeContext stores in specified tier', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'value1' }, { tier: 'warm' });

    assert.ok(service.memoryStore.warm.key1, 'context stored in warm tier');
    assert.notOk(service.memoryStore.hot.key1, 'context not in hot tier');
  });

  test('storeContext creates metadata', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'value1' });

    const entry = service.memoryStore.hot.key1;
    assert.ok(entry.metadata, 'metadata exists');
    assert.ok(entry.metadata.timestamp, 'timestamp exists');
    assert.strictEqual(entry.metadata.accessCount, 0, 'access count is 0');
    assert.strictEqual(entry.metadata.significance, 1.0, 'default significance is 1.0');
  });

  test('retrieveContext finds context in hot tier', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const testData = { data: 'value1' };
    service.storeContext('key1', testData);

    const retrieved = service.retrieveContext('key1');
    assert.deepEqual(retrieved, testData, 'correct data retrieved');
  });

  test('retrieveContext searches across all tiers', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'hot' }, { tier: 'hot' });
    service.storeContext('key2', { data: 'warm' }, { tier: 'warm' });
    service.storeContext('key3', { data: 'cold' }, { tier: 'cold' });
    service.storeContext('key4', { data: 'archived' }, { tier: 'archived' });

    assert.deepEqual(service.retrieveContext('key1'), { data: 'hot' }, 'retrieves from hot');
    assert.deepEqual(service.retrieveContext('key2'), { data: 'warm' }, 'retrieves from warm');
    assert.deepEqual(service.retrieveContext('key3'), { data: 'cold' }, 'retrieves from cold');
    assert.deepEqual(service.retrieveContext('key4'), { data: 'archived' }, 'retrieves from archived');
  });

  test('retrieveContext returns null for missing key', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const result = service.retrieveContext('nonexistent');
    assert.strictEqual(result, null, 'returns null for missing key');
  });

  test('retrieveContext increments access count', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'value1' });

    assert.strictEqual(service.memoryStore.hot.key1.metadata.accessCount, 0, 'initial count is 0');

    service.retrieveContext('key1');
    assert.strictEqual(service.memoryStore.hot.key1.metadata.accessCount, 1, 'count incremented to 1');

    service.retrieveContext('key1');
    assert.strictEqual(service.memoryStore.hot.key1.metadata.accessCount, 2, 'count incremented to 2');
  });

  test('searchContexts with chronological search', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('test1', { data: 'value1' });
    service.storeContext('test2', { data: 'value2' });
    service.storeContext('other', { data: 'value3' });

    const results = service.searchContexts({ searchType: 'chronological', term: 'test' });

    assert.strictEqual(results.length, 2, 'found 2 matching contexts');
    assert.ok(results[0].key.includes('test'), 'first result contains term');
    assert.ok(results[1].key.includes('test'), 'second result contains term');
  });

  test('searchContexts with graph search', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.pushScope({ name: 'test-scope' });

    const results = service.searchContexts({ searchType: 'graph', term: 'test-scope' });

    assert.ok(results.length > 0, 'found matching nodes');
  });

  test('context graph is updated when scope is pushed', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const initialNodes = service.contextGraph.nodes.length;

    service.pushScope({ name: 'scope1' });

    assert.strictEqual(service.contextGraph.nodes.length, initialNodes + 1, 'node added to graph');
  });

  test('context graph edges are created for parent-child relationships', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const initialEdges = service.contextGraph.edges.length;

    service.pushScope({ name: 'parent' });
    service.pushScope({ name: 'child' });

    assert.strictEqual(service.contextGraph.edges.length, initialEdges + 1, 'edge added for parent-child');
  });

  test('scope is archived when popped', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    const scope = service.pushScope({ name: 'scope1' });
    service.popScope();

    const archiveKey = `scope_${scope.id}`;
    const archived = service.retrieveContext(archiveKey);

    assert.ok(archived, 'scope was archived');
    assert.strictEqual(archived.id, scope.id, 'archived scope has correct id');
  });

  test('memory promotion based on access count', function (assert) {
    const service = this.owner.lookup('service:hypermind');
    service.storeContext('key1', { data: 'value1' }, { tier: 'cold' });

    // Access many times to trigger promotion
    for (let i = 0; i < 12; i++) {
      service.retrieveContext('key1');
    }

    assert.notOk(service.memoryStore.cold.key1, 'context removed from cold tier');
    assert.ok(service.memoryStore.warm.key1, 'context promoted to warm tier');
  });
});
