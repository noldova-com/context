/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";

export class RecordedSnapshot extends ModelSnapshot {
  private readonly record: (builder: SnapshotBuilder) => void;

  public constructor(record: (builder: SnapshotBuilder) => void) {
    super();

    this.record = record;
  }

  protected override buildModel(builder: SnapshotBuilder): void {
    this.record(builder);
  }
}
