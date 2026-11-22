/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { Assert } from "@noldova/context.testing";

export class ScriptRunner {
  public static readonly SCRIPTS_FOLDER: string = path.resolve("scripts");
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public static async runAsync(driver: string, scriptsFolder: string, arguments_: readonly string[]): Promise<string> {
    const environment = { ...process.env };
    delete environment[ScriptRunner.COVERAGE_VARIABLE];

    const scriptsUrl = pathToFileURL(scriptsFolder + path.sep).href;
    const child = spawn(process.execPath, ["--input-type=module", "--eval", driver, scriptsUrl, ...arguments_], { env: environment, stdio: ["ignore", "pipe", "inherit"] });
    const closed = new Promise<number | null>(resolve => child.once("close", resolve));
    let output = "";
    child.stdout.setEncoding(ScriptRunner.TEXT_ENCODING).on("data", (t: string) => { output += t; });
    const exitCode = await closed;

    Assert.areEqual<number | null>(0, exitCode, output);
    return output.trim();
  }
}
