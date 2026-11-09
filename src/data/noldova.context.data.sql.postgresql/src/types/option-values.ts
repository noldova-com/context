/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ClientOptions } from "../models/client-options.js";

export type OptionValues = { -readonly [K in keyof ClientOptions]?: ClientOptions[K] };
