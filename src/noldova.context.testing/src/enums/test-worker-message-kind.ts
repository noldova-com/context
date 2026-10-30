/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TestWorkerMessageKind {
  Imported = "Imported",
  Ready = "Ready",
  Started = "Started",
  MethodCompleted = "MethodCompleted",
  TimedOut = "TimedOut",
  ClassCompleted = "ClassCompleted"
}
