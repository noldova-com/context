/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { parentPort } from "node:worker_threads";

// Stays idle until a message tells it to end, then closes its port so its thread ends by itself, as a test worker does.
parentPort?.on("message", () => parentPort?.close());
