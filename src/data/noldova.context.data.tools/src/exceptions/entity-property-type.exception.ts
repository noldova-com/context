/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataToolsException } from "./data-tools.exception.js";

export class EntityPropertyTypeException extends DataToolsException {
  public readonly entity: string;
  public readonly property: string;

  public constructor(entity: string, property: string) {
    super(Resources.formatPropertyTypeUnmapped(entity, property));

    this.entity = entity;
    this.property = property;
  }
}
