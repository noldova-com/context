/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import CommandFailedException from "./command-failed.exception.ts";
import PackageInfo from "./package-info.ts";

export default class Config {
  private static readonly VERSION_FIELD: string = "version";
  private static readonly VERSION_FILE_ENCODING: BufferEncoding = "utf8";
  private static readonly VERSION_FILE_PATH: string = fileURLToPath(new URL("../version.json", import.meta.url));

  public static readonly VERSION: string = Config.readVersion();
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

  private static readVersion(): string {
    const manifest: unknown = JSON.parse(fs.readFileSync(Config.VERSION_FILE_PATH, Config.VERSION_FILE_ENCODING));
    const version: unknown = typeof manifest === "object" && manifest !== null ? (manifest as Record<string, unknown>)[Config.VERSION_FIELD] : undefined;
    if (typeof version !== "string")
      throw new CommandFailedException(Config.versionMissing());

    return version;
  }

  private static versionMissing(): string {
    return `${Config.VERSION_FILE_PATH} must hold the version as a string in "${Config.VERSION_FIELD}".`;
  }
}
