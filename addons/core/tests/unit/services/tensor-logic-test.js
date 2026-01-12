/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | tensor-logic', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    assert.ok(service, 'service exists');
  });

  test('it initializes empty registries', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    assert.ok(service.tensorRegistry, 'tensorRegistry exists');
    assert.ok(service.rulesRegistry, 'rulesRegistry exists');
    assert.strictEqual(Object.keys(service.tensorRegistry).length, 0, 'tensorRegistry is empty');
    assert.strictEqual(Object.keys(service.rulesRegistry).length, 0, 'rulesRegistry is empty');
  });

  test('initTensor creates a tensor with correct properties', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const tensor = service.initTensor('testTensor', [2, 3]);

    assert.ok(tensor, 'tensor is created');
    assert.strictEqual(tensor.name, 'testTensor', 'tensor has correct name');
    assert.deepEqual(tensor.shape, [2, 3], 'tensor has correct shape');
    assert.ok(Array.isArray(tensor.data), 'tensor data is an array');
    assert.strictEqual(tensor.data.length, 6, 'tensor data has correct length');
    assert.ok(tensor.metadata, 'tensor has metadata');
    assert.strictEqual(tensor.metadata.type, 'tensor', 'tensor has correct type');
  });

  test('initTensor stores tensor in registry', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    service.initTensor('testTensor', [2, 3]);

    assert.ok(service.tensorRegistry.testTensor, 'tensor is stored in registry');
    assert.strictEqual(service.tensorRegistry.testTensor.name, 'testTensor', 'stored tensor has correct name');
  });

  test('initTensor with custom data', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const customData = [1, 2, 3, 4];
    const tensor = service.initTensor('testTensor', [2, 2], customData);

    assert.deepEqual(tensor.data, customData, 'tensor uses custom data');
  });

  test('registerRule creates a rule with correct properties', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const equation = (x) => x * 2;
    const rule = service.registerRule('testRule', equation);

    assert.ok(rule, 'rule is created');
    assert.strictEqual(rule.name, 'testRule', 'rule has correct name');
    assert.strictEqual(rule.equation, equation, 'rule has correct equation');
    assert.ok(rule.metadata, 'rule has metadata');
    assert.strictEqual(rule.metadata.type, 'rule', 'rule has correct type');
  });

  test('registerRule stores rule in registry', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const equation = (x) => x * 2;
    service.registerRule('testRule', equation);

    assert.ok(service.rulesRegistry.testRule, 'rule is stored in registry');
    assert.strictEqual(service.rulesRegistry.testRule.name, 'testRule', 'stored rule has correct name');
  });

  test('getTensor retrieves correct tensor', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    service.initTensor('tensor1', [2, 2]);
    service.initTensor('tensor2', [3, 3]);

    const retrieved = service.getTensor('tensor1');
    assert.strictEqual(retrieved.name, 'tensor1', 'correct tensor retrieved');
    assert.deepEqual(retrieved.shape, [2, 2], 'tensor has correct shape');
  });

  test('getRule retrieves correct rule', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const equation1 = (x) => x * 2;
    const equation2 = (x) => x * 3;
    service.registerRule('rule1', equation1);
    service.registerRule('rule2', equation2);

    const retrieved = service.getRule('rule1');
    assert.strictEqual(retrieved.name, 'rule1', 'correct rule retrieved');
    assert.strictEqual(retrieved.equation, equation1, 'rule has correct equation');
  });

  test('executeOperation handles join operation', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const tensor1 = service.initTensor('t1', [2, 2]);
    const tensor2 = service.initTensor('t2', [2, 2]);

    const result = service.executeOperation('join', [tensor1, tensor2]);

    assert.ok(result, 'operation returns result');
    assert.strictEqual(result.operation, 'join', 'result has correct operation type');
    assert.ok(Array.isArray(result.inputs), 'result has inputs array');
    assert.strictEqual(result.inputs.length, 2, 'result has correct number of inputs');
  });

  test('executeOperation handles projection operation', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const tensor = service.initTensor('t1', [3, 3]);

    const result = service.executeOperation('projection', [tensor], { axis: 0 });

    assert.ok(result, 'operation returns result');
    assert.strictEqual(result.operation, 'projection', 'result has correct operation type');
    assert.ok(result.input, 'result has input');
    assert.deepEqual(result.options.axis, 0, 'result has correct options');
  });

  test('executeOperation handles contraction operation', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const tensor1 = service.initTensor('t1', [2, 2]);
    const tensor2 = service.initTensor('t2', [2, 2]);

    const result = service.executeOperation('contraction', [tensor1, tensor2]);

    assert.ok(result, 'operation returns result');
    assert.strictEqual(result.operation, 'contraction', 'result has correct operation type');
  });

  test('executeOperation throws error for unknown operation', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const tensor = service.initTensor('t1', [2, 2]);

    assert.throws(
      () => service.executeOperation('unknown', [tensor]),
      /Unknown operation: unknown/,
      'throws error for unknown operation'
    );
  });

  test('query returns query result object', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    const result = service.query('test query', { context: 'test' });

    assert.ok(result, 'query returns result');
    assert.strictEqual(result.query, 'test query', 'result has correct query');
    assert.deepEqual(result.context, { context: 'test' }, 'result has correct context');
    assert.ok(result.timestamp, 'result has timestamp');
  });

  test('multiple tensors can be created and retrieved', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    service.initTensor('tensor1', [2, 2]);
    service.initTensor('tensor2', [3, 3]);
    service.initTensor('tensor3', [4, 4]);

    assert.strictEqual(Object.keys(service.tensorRegistry).length, 3, 'registry has 3 tensors');
    assert.ok(service.getTensor('tensor1'), 'tensor1 exists');
    assert.ok(service.getTensor('tensor2'), 'tensor2 exists');
    assert.ok(service.getTensor('tensor3'), 'tensor3 exists');
  });

  test('multiple rules can be registered and retrieved', function (assert) {
    const service = this.owner.lookup('service:tensor-logic');
    service.registerRule('rule1', (x) => x * 2);
    service.registerRule('rule2', (x) => x * 3);
    service.registerRule('rule3', (x) => x * 4);

    assert.strictEqual(Object.keys(service.rulesRegistry).length, 3, 'registry has 3 rules');
    assert.ok(service.getRule('rule1'), 'rule1 exists');
    assert.ok(service.getRule('rule2'), 'rule2 exists');
    assert.ok(service.getRule('rule3'), 'rule3 exists');
  });
});
