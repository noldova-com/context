/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PropertyType } from "../../enums/property-type.js";

export class SnapshotProperty {
  public readonly name: string;
  public readonly type: PropertyType;
  public readonly isOptional: boolean;

  public constructor(name: string, type: PropertyType, isOptional: boolean) {
    this.name = name;
    this.type = type;
    this.isOptional = isOptional;
  }
}
