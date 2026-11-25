/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// One run of a process: its id, which the system may give to a later process, and its start time, which tells the two apart.
export interface IProcessIdentity {
  readonly processId: number;
  readonly startTime: number;
}
