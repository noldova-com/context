/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class EntityPropertyMissingException extends DataException {
  public readonly entity: string;
  public readonly property: string;

  public constructor(entity: string, property: string) {
    super(Resources.formatEntityPropertyMissing(entity, property));

    this.entity = entity;
    this.property = property;
  }
}
