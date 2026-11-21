/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Frame } from "../models/frame.js";

export type Evaluator = (frame: Frame) => unknown;
