/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { SnapshotNavigation } from "./snapshot-navigation.js";
import type { SnapshotProperty } from "./snapshot-property.js";

export class SnapshotEntity {
  public readonly name: string;
  public readonly properties: IReadOnlyList<SnapshotProperty>;
  public readonly navigations: IReadOnlyList<SnapshotNavigation>;

  public constructor(name: string, properties: Iterable<SnapshotProperty>, navigations: Iterable<SnapshotNavigation>) {
    this.name = name;
    this.properties = new List(properties).asReadOnly();
    this.navigations = new List(navigations).asReadOnly();
  }
}
