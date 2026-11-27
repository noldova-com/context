/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, type IReadOnlyList } from "@noldova/context.collections";

import type { EntityClass } from "../../types/entity-class.js";

export class EntityTypeDefinition {
  public readonly type: EntityClass<object>;
  public readonly columnNames: Dictionary<string, string> = new Dictionary();
  public readonly foreignKeys: Dictionary<string, IReadOnlyList<string>> = new Dictionary();
  public tableName: string;
  public key: IReadOnlyList<string> | null = null;

  public constructor(type: EntityClass<object>) {
    this.type = type;
    this.tableName = type.name;
  }
}
