/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";
import Config from "./config.ts";
import type PackageInfo from "./package-info.ts";
import PostgreSQLServer from "./postgresql-server.ts";
import Script from "./script.ts";

export default abstract class SuiteScript extends Script {
  protected static readonly HANG_LIMIT_MILLISECONDS: number = 60_000;
  protected static readonly FILTERS_VARIABLE: string = "CONTEXT_TEST_FILTERS";
  protected static readonly RESULTS_FILE_VARIABLE: string = "CONTEXT_TEST_RESULTS_FILE";
  protected static readonly TIMEOUT_VARIABLE: string = "CONTEXT_TEST_TIMEOUT_MILLISECONDS";
  private static readonly NEW_LINE: string = "\n";
  private static readonly POSTGRESQL_STARTED: string = "Started a PostgreSQL server for the data tests.";
  private static readonly SOURCE_MAPS_OPTION: string = "--enable-source-maps";
  private static readonly TEST_ENTRY_PATH: string = "node_modules/@noldova/context.testing/services/execution/test-run-entry-point.js";
  private static readonly TEST_PROJECT_SUFFIX: string = ".tests";
  private static readonly TEST_TSCONFIG_PATH: string = "tests/tsconfig.json";

  protected async listTestProjectsAsync(): Promise<PackageInfo[]> {
    const projects: PackageInfo[] = [];
    for (const packageInfo of Config.PACKAGES_INFO)
      if (await this.pathExistsAsync(SuiteScript.testTsconfigPath(packageInfo)))
        projects.push(packageInfo);

    return projects;
  }

  protected static testTsconfigPath(packageInfo: PackageInfo): string {
    return `${SuiteScript.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${SuiteScript.TEST_TSCONFIG_PATH}`;
  }

  protected static testProjectName(packageInfo: PackageInfo): string {
    return `${packageInfo.name}${SuiteScript.TEST_PROJECT_SUFFIX}`;
  }

  protected static testBuildDirectory(packageInfo: PackageInfo): string {
    return `${Config.BUILD_FOLDER}/${SuiteScript.testProjectName(packageInfo)}`;
  }

  protected async runSuiteAsync(projects: readonly PackageInfo[], environment: Record<string, string>): Promise<void> {
    environment[SuiteScript.TIMEOUT_VARIABLE] = String(SuiteScript.HANG_LIMIT_MILLISECONDS);
    const server = process.env[PostgreSQLServer.URL_VARIABLE] === undefined ? await PostgreSQLServer.startAsync() : null;
    try {
      if (server !== null) {
        environment[PostgreSQLServer.URL_VARIABLE] = server.url;
        await this.writeLogAsync(SuiteScript.POSTGRESQL_STARTED);
      }

      await this.executeProcessAsync(
        process.execPath,
        [SuiteScript.SOURCE_MAPS_OPTION, SuiteScript.TEST_ENTRY_PATH, ...projects.flatMap(t => [t.name, SuiteScript.testBuildDirectory(t)])],
        process.cwd(),
        false,
        environment);
    }
    catch (error) {
      try {
        await server?.[Symbol.asyncDispose]();
      }
      catch (cleanupError) {
        throw new CommandFailedException(SuiteScript.describe(error) + SuiteScript.NEW_LINE + SuiteScript.describe(cleanupError));
      }
      throw error;
    }

    await server?.[Symbol.asyncDispose]();
  }

  private static describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
