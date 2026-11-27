/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class SnapshotForeignKey {
  public readonly principal: string;
  public readonly properties: IReadOnlyList<string>;

  public constructor(principal: string, properties: Iterable<string>) {
    this.principal = principal;
    this.properties = new List(properties).asReadOnly();
  }
}
