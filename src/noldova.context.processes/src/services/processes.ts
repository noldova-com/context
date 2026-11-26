/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ProcessEntry } from "../models/process-entry.js";
import { Resources } from "../resources.js";
import { ProcessLister } from "./process-lister.js";

export class Processes {
  public static async listAsync(): Promise<IReadOnlyList<ProcessEntry>> {
    const entries = await ProcessLister.useAsync(Resources.readLimitMilliseconds, t => t.listAsync());
    return entries.where(t => t.processId > 0).toList();
  }
}
