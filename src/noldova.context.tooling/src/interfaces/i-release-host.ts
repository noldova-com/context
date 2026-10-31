/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ProcessResult } from "../models/process-result.ts";

export interface IReleaseHost {
  readonly environment: Readonly<Record<string, string | undefined>>;
  readGitAsync(arguments_: readonly string[]): Promise<ProcessResult>;
  readNPMAsync(arguments_: readonly string[]): Promise<ProcessResult>;
  runNPMAsync(arguments_: readonly string[]): Promise<void>;
  requestAsync(address: string, init: RequestInit): Promise<Response>;
  writeLogAsync(message: string): Promise<void>;
  now(): number;
  delayAsync(milliseconds: number): Promise<void>;
}
