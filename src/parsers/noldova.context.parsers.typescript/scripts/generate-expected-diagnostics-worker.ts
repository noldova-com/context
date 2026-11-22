/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import TypeScriptExpectedDiagnosticsWorker from "./typescript-expected-diagnostics-worker.ts";
import TypeScriptScriptException from "./typescript-script.exception.ts";

const [batchPath] = process.argv.slice(2);
if (Object.isUndefined(batchPath))
  throw new TypeScriptScriptException(TypeScriptExpectedDiagnosticsWorker.BATCH_PATH_MISSING);

new TypeScriptExpectedDiagnosticsWorker().run(batchPath);
