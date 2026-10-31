/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PackageInfo } from "../src/noldova.context.tooling/src/api/index.ts";

export default class Config {
  public static readonly VERSION: string = "0.0.3";
  public static readonly BUILD_FOLDER: string = "_build/node";
  public static readonly COVERAGE_FOLDER: string = "_build/coverage";
  public static readonly PACKAGES_FOLDER: string = "_packages";

  public static readonly PACKAGES_INFO: readonly PackageInfo[] = [
    new PackageInfo("noldova.context.core", "noldova.context.core", "@noldova/context.core", true),
    new PackageInfo("noldova.context.collections", "noldova.context.collections", "@noldova/context.collections", true),
    new PackageInfo("noldova.context.exceptions", "noldova.context.exceptions", "@noldova/context.exceptions", true),
    new PackageInfo("noldova.context.text", "noldova.context.text", "@noldova/context.text", true),
    new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true),
    new PackageInfo("noldova.context.testing", "noldova.context.testing", "@noldova/context.testing", true),
    new PackageInfo("noldova.context.diagnostics", "noldova.context.diagnostics", "@noldova/context.diagnostics", true),
    new PackageInfo("noldova.context.parsers", "parsers/noldova.context.parsers", "@noldova/context.parsers", true),
    new PackageInfo("noldova.context.parsers.regex", "parsers/noldova.context.parsers.regex", "@noldova/context.parsers.regex", true),
    new PackageInfo("noldova.context.parsers.typescript", "parsers/noldova.context.parsers.typescript", "@noldova/context.parsers.typescript", true),
    new PackageInfo("noldova.context.tooling", "noldova.context.tooling", "@noldova/context.tooling", false),
  ];
}
