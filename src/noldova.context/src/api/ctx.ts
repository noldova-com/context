#!/usr/bin/env node
/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.
// It writes its checks out instead of using @noldova/context.core: it runs beside the project host's copy of core
// and loads none of the context packages before it knows which copy to use.

import { fileURLToPath, pathToFileURL } from "node:url";

import { HostLocatorService } from "../services/host-locator.service.js";

const projectEntryPath = HostLocatorService.locate(process.cwd(), fileURLToPath(import.meta.url));
if (projectEntryPath === undefined) {
  const { ConsoleOutput } = await import("../models/console-output.js");
  const { CommandHost } = await import("../services/command-host.js");
  process.exitCode = await new CommandHost(new ConsoleOutput()).runAsync(process.argv.slice(2), process.cwd());
}
else
  await import(pathToFileURL(projectEntryPath).href);
