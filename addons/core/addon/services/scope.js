/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

/**
 * This simple non-functional service is used to retain references to
 * lists of scopes (orgs and projects) and selected scopes (orgs and projects).
 * Enhanced with Tensor Logic, HyperMind, and ATenSpace integration.
 */
export default class ScopeService extends Service {
  @service tensorLogic;
  @service hypermind;
  @service atenSpace;

  // =attributes

  /**
   * @type {ScopeModel}
   */
  @tracked org;

  /**
   * @type {ScopeModel}
   */
  @tracked orgsList;

  /**
   * @type {ScopeModel}
   */
  @tracked project;

  /**
   * @type {ScopeModel}
   */
  @tracked projectsList;

  /**
   * Initialize scope with integrated frameworks
   * @param {ScopeModel} scopeModel - Scope model
   */
  initializeScopeFrameworks(scopeModel) {
    if (!scopeModel) return;

    // Initialize tensor variables for the scope
    this.tensorLogic.initTensor(
      `scope_${scopeModel.id}`,
      [1, 1],
      null
    );

    // Push scope into HyperMind for context management
    this.hypermind.pushScope({
      scopeId: scopeModel.id,
      scopeType: scopeModel.type,
      scopeModel,
    });

    // Map scope to ATenSpace domain
    this.atenSpace.mapScopeToDomain(scopeModel);
  }

  /**
   * Set org with framework integration
   * @param {ScopeModel} orgModel - Organization scope model
   */
  setOrg(orgModel) {
    this.org = orgModel;
    if (orgModel) {
      this.initializeScopeFrameworks(orgModel);
    }
  }

  /**
   * Set project with framework integration
   * @param {ScopeModel} projectModel - Project scope model
   */
  setProject(projectModel) {
    this.project = projectModel;
    if (projectModel) {
      this.initializeScopeFrameworks(projectModel);
    }
  }
}
