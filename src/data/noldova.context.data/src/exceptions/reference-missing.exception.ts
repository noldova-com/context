/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { DataException } from "./data.exception.js";

export class ReferenceMissingException extends DataException {
  public readonly entity: string;
  public readonly navigation: string;

  public constructor(entity: string, navigation: string) {
    super(Resources.formatReferenceMissing(entity, navigation));

    this.entity = entity;
    this.navigation = navigation;
  }
}
