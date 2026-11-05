/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Script from "../../../../scripts/script.ts";
import RegexExpectedPatternsGenerator from "./regex-expected-patterns-generator.ts";

export class Verify extends Script {
  private static readonly SCRIPTS_TSCONFIG_PATH: string = "src/parsers/noldova.context.parsers.regex/scripts/tsconfig.json";

  public override async runAsync(): Promise<void> {
    await this.executeTypeScriptCompilerAsync([Verify.TYPESCRIPT_PROJECT_OPTION, Verify.SCRIPTS_TSCONFIG_PATH]);
    await new RegexExpectedPatternsGenerator().verifyAsync();
  }
}

await new Verify().runAsEntryPointAsync();
