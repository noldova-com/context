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
  private static readonly VERSION_FIELD: "version" = "version";
  private static readonly VERSION_FILE_ENCODING: BufferEncoding = "utf8";
  private static readonly VERSION_FILE_PATH: string = fileURLToPath(new URL("../version.json", import.meta.url));
  private static readonly VERSION_PATTERN: RegExp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u;

  public static readonly VERSION: string = Config.readVersion();
  public static readonly UPPER_BOUND: string = Config.upperBound(Config.VERSION);
  public static readonly BUILD_FOLDER: string = "_build/node";
  public static readonly COVERAGE_FOLDER: string = "_build/coverage";
  public static readonly PACKAGES_FOLDER: string = "_packages";
  public static readonly START_POSTGRESQL: boolean = true;
  public static readonly TEST_SCRIPTS: boolean = true;

  public static readonly PACKAGES_INFO: readonly PackageInfo[] = [
    new PackageInfo("noldova.context.core", "noldova.context.core", "@noldova/context.core"),
    new PackageInfo("noldova.context.exceptions", "noldova.context.exceptions", "@noldova/context.exceptions"),
    new PackageInfo("noldova.context.collections", "noldova.context.collections", "@noldova/context.collections"),
    new PackageInfo("noldova.context.text", "noldova.context.text", "@noldova/context.text"),
    new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json"),
    new PackageInfo("noldova.context.processes", "noldova.context.processes", "@noldova/context.processes"),
    new PackageInfo("noldova.context.threading", "noldova.context.threading", "@noldova/context.threading"),
    new PackageInfo("noldova.context", "noldova.context", "@noldova/context"),
    new PackageInfo("noldova.context.query.expressions", "query/noldova.context.query.expressions", "@noldova/context.query.expressions"),
    new PackageInfo("noldova.context.query", "query/noldova.context.query", "@noldova/context.query"),
    new PackageInfo("noldova.context.data", "data/noldova.context.data", "@noldova/context.data"),
    new PackageInfo("noldova.context.data.sql", "data/noldova.context.data.sql", "@noldova/context.data.sql"),
    new PackageInfo("noldova.context.data.sql.sqlite", "data/noldova.context.data.sql.sqlite", "@noldova/context.data.sql.sqlite"),
    new PackageInfo("noldova.context.data.sql.postgresql", "data/noldova.context.data.sql.postgresql", "@noldova/context.data.sql.postgresql"),
    new PackageInfo("noldova.context.testing", "noldova.context.testing", "@noldova/context.testing"),
    new PackageInfo("noldova.context.diagnostics", "noldova.context.diagnostics", "@noldova/context.diagnostics"),
    new PackageInfo("noldova.context.parsers", "parsers/noldova.context.parsers", "@noldova/context.parsers"),
    new PackageInfo("noldova.context.parsers.regex", "parsers/noldova.context.parsers.regex", "@noldova/context.parsers.regex"),
    new PackageInfo("noldova.context.parsers.typescript", "parsers/noldova.context.parsers.typescript", "@noldova/context.parsers.typescript"),
  ];

  private static readVersion(): string {
    const manifest: unknown = JSON.parse(fs.readFileSync(Config.VERSION_FILE_PATH, Config.VERSION_FILE_ENCODING));
    const version: unknown = typeof manifest === "object" && manifest !== null && Config.VERSION_FIELD in manifest ? manifest[Config.VERSION_FIELD] : undefined;
    if (typeof version !== "string")
      throw new CommandFailedException(Config.versionMissing());

    return version;
  }

  private static upperBound(version: string): string {
    const groups = Config.VERSION_PATTERN.exec(version)?.groups;
    if (groups?.["major"] === undefined || groups["minor"] === undefined)
      throw new CommandFailedException(Config.versionInvalid(version));

    const major = Number(groups["major"]);
    return major === 0 ? `0.${Number(groups["minor"]) + 1}.0` : `${major + 1}.0.0`;
  }

  private static versionInvalid(version: string): string {
    return `${Config.VERSION_FILE_PATH} holds "${version}", not a version of three numbers such as 0.0.4.`;
  }

  private static versionMissing(): string {
    return `${Config.VERSION_FILE_PATH} must hold the version as a string in "${Config.VERSION_FIELD}".`;
  }
}
