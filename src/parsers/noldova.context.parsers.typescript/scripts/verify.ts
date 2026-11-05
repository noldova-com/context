/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Script from "../../../../scripts/script.ts";
import TypeScriptDiagnosticCatalogGenerator from "./typescript-diagnostic-catalog-generator.ts";
import TypeScriptExpectedDiagnosticsGenerator from "./typescript-expected-diagnostics-generator.ts";

export class Verify extends Script {
  private static readonly SCRIPTS_TSCONFIG_PATH: string = "src/parsers/noldova.context.parsers.typescript/scripts/tsconfig.json";

  public override async runAsync(): Promise<void> {
    await this.executeTypeScriptCompilerAsync([Verify.TYPESCRIPT_PROJECT_OPTION, Verify.SCRIPTS_TSCONFIG_PATH]);
    await new TypeScriptDiagnosticCatalogGenerator().verifyAsync();
    await new TypeScriptExpectedDiagnosticsGenerator().verifyAsync();
  }
}

await new Verify().runAsEntryPointAsync();
