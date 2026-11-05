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
import TypeScriptConformanceLayout from "./typescript-conformance-layout.ts";

export default class TypeScriptKnownFailuresGenerator extends Script {
  private static readonly GENERATOR_ENTRY_PATH: string = "conformance/generate-known-failures.js";
  private static readonly TEST_BUILD_DIRECTORY: string = path.posix.join(Config.BUILD_FOLDER, "noldova.context.parsers.typescript.tests");
  private static readonly TEST_TSCONFIG_PATH: string = path.posix.join(TypeScriptConformanceLayout.TESTS_DIRECTORY, "tsconfig.json");

  public override async runAsync(): Promise<void> {
    await this.removeDirectoryAsync(TypeScriptKnownFailuresGenerator.TEST_BUILD_DIRECTORY);
    await this.executeTypeScriptCompilerAsync([Script.TYPESCRIPT_PROJECT_OPTION, TypeScriptKnownFailuresGenerator.TEST_TSCONFIG_PATH]);
    await import(pathToFileURL(path.resolve(TypeScriptKnownFailuresGenerator.TEST_BUILD_DIRECTORY, TypeScriptKnownFailuresGenerator.GENERATOR_ENTRY_PATH)).href);
  }
}
