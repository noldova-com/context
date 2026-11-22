/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { Assert } from "@noldova/context.testing";

export class ScriptDriver {
  public static readonly GROWN_BYTES: number = 384 * 1024 * 1024;
  private static readonly DIRECTORY_PREFIX: string = "noldova-script-driver-";
  private static readonly GROW_FILE_NAME: string = "grow.cjs";
  private static readonly GROW_SCRIPT: string = `globalThis.held = require("node:crypto").randomFillSync(Buffer.allocUnsafe(${ScriptDriver.GROWN_BYTES})); ` +
    "console.log(\"grown\"); const parent = process.ppid; " +
    "setInterval(() => { try { process.kill(parent, 0); } catch { process.exit(); } }, 100);";
  private static readonly PRELUDE: string = `
    import { spawn } from "node:child_process";
    import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
    import { tmpdir } from "node:os";
    import path from "node:path";
    import readline from "node:readline";
    const [scriptsUrl, directory, grownText] = process.argv.slice(1);
    const grownBytes = Number(grownText);
    const growPath = path.join(directory, "${ScriptDriver.GROW_FILE_NAME}");
    const fileIn = name => path.join(directory, name);
    const load = async name => (await import(new URL(name, scriptsUrl).href)).default;
    const lineOf = (child, text) => new Promise(resolve => readline.createInterface({ input: child.stdout }).on("line", t => { if (t === text) resolve(); }));
    const tick = () => new Promise(resolve => setTimeout(resolve, 10));
  `;
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly SCRIPTS_DIRECTORY: string = "src/parsers/noldova.context.parsers.typescript/scripts";
  private static readonly TEMPORARY_DIRECTORY_NAME: string = "temporary";
  private static readonly TEMPORARY_DIRECTORY_VARIABLES: readonly string[] = ["TMPDIR", "TEMP", "TMP"];
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public static async runAsync(driver: string, files: ReadonlyMap<string, string> = new Map()): Promise<string> {
    const directory = mkdtempSync(path.join(tmpdir(), ScriptDriver.DIRECTORY_PREFIX));
    try {
      const temporaryDirectory = path.join(directory, ScriptDriver.TEMPORARY_DIRECTORY_NAME);
      mkdirSync(temporaryDirectory);
      for (const [name, content] of new Map([[ScriptDriver.GROW_FILE_NAME, ScriptDriver.GROW_SCRIPT], ...files]))
        writeFileSync(path.join(directory, name), content);

      const environment = { ...process.env };
      delete environment["NODE_V8_COVERAGE"];
      for (const variable of ScriptDriver.TEMPORARY_DIRECTORY_VARIABLES)
        environment[variable] = temporaryDirectory;

      const scriptsUrl = pathToFileURL(path.resolve(ScriptDriver.SCRIPTS_DIRECTORY) + path.sep).href;
      const child = spawn(process.execPath, ["--input-type=module", "--eval", ScriptDriver.PRELUDE + driver, scriptsUrl, directory, String(ScriptDriver.GROWN_BYTES)],
        { env: environment, stdio: ["ignore", "pipe", "inherit"] });
      const closed = new Promise<number | null>(resolve => child.once("close", resolve));
      let output = "";
      child.stdout.setEncoding(ScriptDriver.TEXT_ENCODING).on("data", (t: string) => { output += t; });
      const exitCode = await closed;

      Assert.areEqual<number | null>(0, exitCode, output);
      return output.trim();
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: ScriptDriver.REMOVAL_RETRIES });
    }
  }
}
