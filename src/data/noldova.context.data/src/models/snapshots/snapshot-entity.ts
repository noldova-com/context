/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { SnapshotForeignKey } from "./snapshot-foreign-key.js";
import type { SnapshotNavigation } from "./snapshot-navigation.js";
import type { SnapshotProperty } from "./snapshot-property.js";

export class SnapshotEntity {
  public readonly name: string;
  public readonly tableName: string;
  public readonly properties: IReadOnlyList<SnapshotProperty>;
  public readonly key: IReadOnlyList<string>;
  public readonly foreignKeys: IReadOnlyList<SnapshotForeignKey>;
  public readonly navigations: IReadOnlyList<SnapshotNavigation>;

  public constructor(name: string, tableName: string, properties: Iterable<SnapshotProperty>, key: Iterable<string>, foreignKeys: Iterable<SnapshotForeignKey>,
    navigations: Iterable<SnapshotNavigation>) {
    this.name = name;
    this.tableName = tableName;
    this.properties = new List(properties).asReadOnly();
    this.key = new List(key).asReadOnly();
    this.foreignKeys = new List(foreignKeys).asReadOnly();
    this.navigations = new List(navigations).asReadOnly();
  }
}
