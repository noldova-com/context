/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export abstract class MigrationHistory {
  public abstract getAppliedAsync(): Promise<readonly string[]>;

  public abstract recordAsync(id: string): Promise<void>;
}
