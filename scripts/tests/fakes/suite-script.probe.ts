/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PostgreSQLServer from "../../postgresql-server.ts";
import SuiteScript from "../../suite-script.ts";

export default class SuiteScriptProbe extends SuiteScript {
  private static readonly NO_URL: string = "none";
  private url: string = SuiteScriptProbe.NO_URL;

  public override async runAsync(): Promise<void> {
    const projects = await this.listTestProjectsAsync();
    await this.runSuiteAsync(projects, {});
    console.log([...projects.map(t => t.name), this.url].join(" "));
  }

  protected override async executeProcessAsync(_command: string, _arguments: readonly string[], _workingDirectory: string, _silent?: boolean, environment?: Record<string, string>): Promise<void> {
    this.url = environment?.[PostgreSQLServer.URL_VARIABLE] ?? SuiteScriptProbe.NO_URL;
  }

  protected override async writeLogAsync(_message: string): Promise<void> {
  }
}
