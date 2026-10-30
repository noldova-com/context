/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageInfo from "./package-info.ts";

export default class Config {
  public static readonly VERSION: string = "0.0.1";
  public static readonly BUILD_FOLDER: string = "_build/node";
  public static readonly COVERAGE_FOLDER: string = "_build/coverage";
  public static readonly PACKAGES_FOLDER: string = "_packages";

  public static readonly PACKAGES_INFO: readonly PackageInfo[] = [
    new PackageInfo("noldova.context.core", "noldova.context.core", "@noldova/context.core"),
    new PackageInfo("noldova.context.collections", "noldova.context.collections", "@noldova/context.collections"),
    new PackageInfo("noldova.context.exceptions", "noldova.context.exceptions", "@noldova/context.exceptions"),
    new PackageInfo("noldova.context.text", "noldova.context.text", "@noldova/context.text"),
    new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json"),
    new PackageInfo("noldova.context.testing", "noldova.context.testing", "@noldova/context.testing"),
    new PackageInfo("noldova.context.diagnostics", "noldova.context.diagnostics", "@noldova/context.diagnostics"),
    new PackageInfo("noldova.context.parsers", "parsers/noldova.context.parsers", "@noldova/context.parsers"),
    new PackageInfo("noldova.context.parsers.regex", "parsers/noldova.context.parsers.regex", "@noldova/context.parsers.regex"),
    new PackageInfo("noldova.context.parsers.typescript", "parsers/noldova.context.parsers.typescript", "@noldova/context.parsers.typescript"),
  ];
}
