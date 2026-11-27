/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PropertyType } from "../../enums/property-type.js";

export class EntityProperty {
  public readonly name: string;
  public readonly type: PropertyType;
  public readonly columnName: string;
  public readonly isRequired: boolean;

  public constructor(name: string, type: PropertyType, columnName: string, isRequired: boolean) {
    this.name = name;
    this.type = type;
    this.columnName = columnName;
    this.isRequired = isRequired;
  }
}
