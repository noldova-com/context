/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import Config from "../../../../scripts/config.ts";
import Script from "../../../../scripts/script.ts";
import RegexConformanceLayout from "./regex-conformance-layout.ts";

export default class RegexKnownFailuresGenerator extends Script {
  private static readonly GENERATOR_ENTRY_PATH: string = "conformance/generate-known-failures.js";
  private static readonly TEST_BUILD_DIRECTORY: string = path.posix.join(Config.BUILD_FOLDER, "noldova.context.parsers.regex.tests");
  private static readonly TEST_TSCONFIG_PATH: string = path.posix.join(RegexConformanceLayout.TESTS_DIRECTORY, "tsconfig.json");

  public override async runAsync(): Promise<void> {
    await this.removeDirectoryAsync(RegexKnownFailuresGenerator.TEST_BUILD_DIRECTORY);
    await this.executeTypeScriptCompilerAsync([Script.TYPESCRIPT_PROJECT_OPTION, RegexKnownFailuresGenerator.TEST_TSCONFIG_PATH]);
    await import(pathToFileURL(path.resolve(RegexKnownFailuresGenerator.TEST_BUILD_DIRECTORY, RegexKnownFailuresGenerator.GENERATOR_ENTRY_PATH)).href);
  }
}
