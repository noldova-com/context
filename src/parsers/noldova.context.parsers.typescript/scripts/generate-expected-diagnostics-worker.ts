/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TypeScriptExpectedDiagnosticsWorker from "./typescript-expected-diagnostics-worker.ts";

const [batchPath] = process.argv.slice(2);
if (batchPath === undefined)
  throw new Error(TypeScriptExpectedDiagnosticsWorker.BATCH_PATH_MISSING);

new TypeScriptExpectedDiagnosticsWorker().run(batchPath);
