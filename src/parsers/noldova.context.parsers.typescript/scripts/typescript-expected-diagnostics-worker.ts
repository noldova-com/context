/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readFileSync, writeSync } from "node:fs";

import TypeScriptConformanceCase from "./typescript-conformance-case.ts";
import TypeScriptExpectedBatch from "./typescript-expected-batch.ts";
import TypeScriptExpectedInapplicableRecord from "./typescript-expected-inapplicable-record.ts";
import TypeScriptExpectedWorkerEvent from "./typescript-expected-worker-event.ts";
import TypeScriptReferenceCompiler from "./typescript-reference-compiler.ts";

export default class TypeScriptExpectedDiagnosticsWorker {
  private static readonly LINE_FEED: string = "\n";
  private static readonly STANDARD_OUTPUT: number = 1;
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public run(batchPath: string): void {
    const batch = TypeScriptExpectedBatch.parse(readFileSync(batchPath, TypeScriptExpectedDiagnosticsWorker.TEXT_ENCODING));
    const compiler = new TypeScriptReferenceCompiler(batch.librariesDirectory);

    for (const casePath of batch.cases) {
      this.emit(TypeScriptExpectedWorkerEvent.start(casePath));

      const conformanceCase = TypeScriptConformanceCase.read(batch.casesDirectory, casePath);
      const record = conformanceCase.isApplicable ? compiler.evaluate(conformanceCase) : new TypeScriptExpectedInapplicableRecord(conformanceCase);

      this.emit(TypeScriptExpectedWorkerEvent.result(record));
    }
  }

  private emit(event: TypeScriptExpectedWorkerEvent): void {
    writeSync(TypeScriptExpectedDiagnosticsWorker.STANDARD_OUTPUT, `${JSON.stringify(event)}${TypeScriptExpectedDiagnosticsWorker.LINE_FEED}`);
  }
}
