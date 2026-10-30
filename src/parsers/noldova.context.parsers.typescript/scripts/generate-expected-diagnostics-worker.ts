/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TypeScriptExpectedDiagnosticsWorker from "./typescript-expected-diagnostics-worker.ts";

new TypeScriptExpectedDiagnosticsWorker().run(process.argv[2]!);
