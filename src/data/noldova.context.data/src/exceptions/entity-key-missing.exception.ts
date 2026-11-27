/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class EntityKeyMissingException extends DataException {
  public readonly entity: string;

  public constructor(entity: string) {
    super(Resources.formatEntityKeyMissing(entity, entity + Resources.keySuffix));

    this.entity = entity;
  }
}
