/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type PackageInfo from "../../../../scripts/package-info.ts";
import Script from "../../../../scripts/script.ts";
import TypeScriptDiagnosticCatalogGenerator from "./typescript-diagnostic-catalog-generator.ts";
import TypeScriptExpectedDiagnosticsGenerator from "./typescript-expected-diagnostics-generator.ts";

export class Build extends Script {
  private static readonly SCRIPTS_TSCONFIG_PATH: string = "src/parsers/noldova.context.parsers.typescript/scripts/tsconfig.json";

  public override async runAsync(packageInfo: PackageInfo): Promise<void> {
    await this.executeTypeScriptCompilerAsync([Build.TYPESCRIPT_PROJECT_OPTION, Build.SCRIPTS_TSCONFIG_PATH]);
    await new TypeScriptDiagnosticCatalogGenerator().verifyAsync();
    await new TypeScriptExpectedDiagnosticsGenerator().verifyAsync();
    await this.compilePackageAsync(packageInfo);
  }
}
