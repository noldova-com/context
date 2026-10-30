/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TypeScriptKnownFailuresGenerator from "./typescript-known-failures-generator.ts";

await new TypeScriptKnownFailuresGenerator().runAsEntryPointAsync();
