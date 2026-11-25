/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class PostgreSQLServer implements AsyncDisposable {
  public static readonly URL_VARIABLE: string = "NOLDOVA_SUITE_SCRIPT_TESTS_POSTGRESQL_URL";
  private static readonly STARTED_URL: string = "started";

  public get url(): string {
    return PostgreSQLServer.STARTED_URL;
  }

  public static async startAsync(): Promise<PostgreSQLServer> {
    return new PostgreSQLServer();
  }

  public async [Symbol.asyncDispose](): Promise<void> {
  }
}
