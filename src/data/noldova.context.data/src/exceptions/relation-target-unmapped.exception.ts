/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class RelationTargetUnmappedException extends DataException {
  public readonly entity: string;
  public readonly navigation: string;
  public readonly target: string;

  public constructor(entity: string, navigation: string, target: string) {
    super(Resources.formatRelationTargetUnmapped(entity, navigation, target));

    this.entity = entity;
    this.navigation = navigation;
    this.target = target;
  }
}
