/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.
// It imports none of the context packages: ctx runs it before it knows which copy of them to load.

import { realpathSync } from "node:fs";
import { createRequire } from "node:module";

import { Resources } from "../resources.js";

export class HostLocatorService {
  public static locate(directory: string, ownEntryPath: string): string | undefined {
    let entryPath: string;
    try {
      entryPath = createRequire(ownEntryPath).resolve(Resources.hostEntryModule, { paths: [directory] });
    }
    catch (exception: unknown) {
      if (exception instanceof Error && "code" in exception && exception.code === Resources.moduleNotFoundErrorCode)
        return undefined;

      throw exception;
    }

    return realpathSync(entryPath) === realpathSync(ownEntryPath) ? undefined : entryPath;
  }
}
