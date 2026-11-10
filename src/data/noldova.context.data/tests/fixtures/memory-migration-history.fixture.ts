/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MigrationHistory } from "@noldova/context.data";

export class MemoryMigrationHistory extends MigrationHistory {
  public readonly applied: string[] = [];

  public override async getAppliedAsync(): Promise<readonly string[]> {
    return [...this.applied].sort();
  }

  public override async recordAsync(id: string): Promise<void> {
    this.applied.push(id);
  }
}
