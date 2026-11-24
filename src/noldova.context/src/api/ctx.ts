#!/usr/bin/env node
/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import "@noldova/context.core";

import { ConsoleOutput } from "../models/console-output.js";
import { CommandHost } from "../services/command-host.js";

process.exitCode = await new CommandHost(new ConsoleOutput()).runAsync(process.argv.slice(2), process.cwd());
