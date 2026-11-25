/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";
import Config from "./config.ts";
import PostgreSQLServer from "./postgresql-server.ts";
import Script from "./script.ts";
import TestProject from "./test-project.ts";

export default abstract class SuiteScript extends Script {
  protected static readonly HANG_LIMIT_MILLISECONDS: number = 60_000;
  protected static readonly FILTERS_VARIABLE: string = "CONTEXT_TEST_FILTERS";
  protected static readonly RESULTS_FILE_VARIABLE: string = "CONTEXT_TEST_RESULTS_FILE";
  protected static readonly TIMEOUT_VARIABLE: string = "CONTEXT_TEST_TIMEOUT_MILLISECONDS";
  private static readonly NEW_LINE: string = "\n";
  private static readonly POSTGRESQL_STARTED: string = "Started a PostgreSQL server for the data tests.";
  private static readonly SOURCE_MAPS_OPTION: string = "--enable-source-maps";
  private static readonly TEST_ENTRY_PATH: string = "node_modules/@noldova/context.testing/services/execution/test-run-entry-point.js";
  private static readonly SCRIPTS_TEST_PROJECT: TestProject = new TestProject("scripts", "scripts");

  protected async listTestProjectsAsync(): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const packageInfo of Config.PACKAGES_INFO) {
      const project = new TestProject(packageInfo.name, `${SuiteScript.SOURCE_DIRECTORY_NAME}/${packageInfo.path}`);
      if (await this.pathExistsAsync(project.tsconfigPath))
        projects.push(project);
    }

    projects.push(SuiteScript.SCRIPTS_TEST_PROJECT);
    return projects;
  }

  protected async runSuiteAsync(projects: readonly TestProject[], environment: Record<string, string>): Promise<void> {
    environment[SuiteScript.TIMEOUT_VARIABLE] = String(SuiteScript.HANG_LIMIT_MILLISECONDS);
    const server = process.env[PostgreSQLServer.URL_VARIABLE] === undefined ? await PostgreSQLServer.startAsync() : null;
    try {
      if (server !== null) {
        environment[PostgreSQLServer.URL_VARIABLE] = server.url;
        await this.writeLogAsync(SuiteScript.POSTGRESQL_STARTED);
      }

      await this.executeProcessAsync(
        process.execPath,
        [SuiteScript.SOURCE_MAPS_OPTION, SuiteScript.TEST_ENTRY_PATH, ...projects.flatMap(t => [t.name, t.buildDirectory])],
        process.cwd(),
        false,
        environment);
    }
    catch (exception) {
      try {
        await server?.[Symbol.asyncDispose]();
      }
      catch (cleanupException) {
        throw new CommandFailedException(SuiteScript.describe(exception) + SuiteScript.NEW_LINE + SuiteScript.describe(cleanupException));
      }
      throw exception;
    }

    await server?.[Symbol.asyncDispose]();
  }

  private static describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
