/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Readable, Writable } from "node:stream";

import type { Result } from "../models/result.js";
import type { StatementDescription } from "../models/statement-description.js";

export type QueryOutcome = Result | Readable | Writable | StatementDescription | readonly QueryOutcome[] | null;
