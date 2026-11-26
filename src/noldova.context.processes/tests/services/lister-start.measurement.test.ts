/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, parse } from "node:path";
import { createInterface } from "node:readline";

import { Resources } from "@noldova/context.processes/resources.js";
import { Assert, TestClass, TestMethod, Timeout } from "@noldova/context.testing";

@TestClass
export class ListerStartMeasurementTests {
  private static readonly ARGUMENTS: readonly string[] = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass"];
  private static readonly FIRST: string = "[Console]::Out.WriteLine('first')";
  private static readonly STARTS: number = 3;
  private static readonly AT_ONCE: number = 4;

  @Timeout(1_800_000)
  @TestMethod
  public async measuresWherePowerShellsStartGoesAsync(): Promise<void> {
    const script = `${ListerStartMeasurementTests.FIRST}\n${Resources.windowsListingScript}`;
    const rows = [`TEMP on ${parse(tmpdir()).root}, home on ${parse(homedir()).root}; ms from spawn() to: spawn event, first line, ready line, first listing`];
    const bare = ["-Command", `${ListerStartMeasurementTests.FIRST}; [Console]::Out.WriteLine('end'); $null = [Console]::In.ReadLine(); [Console]::Out.WriteLine('end')`];
    const encoded = ["-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")];
    for (let start = 0; start < ListerStartMeasurementTests.STARTS; start++) {
      rows.push(`bare ${await ListerStartMeasurementTests.measureAsync(bare)}`);
      rows.push(`file on TEMP ${await ListerStartMeasurementTests.measureFileAsync(tmpdir(), script)}`);
      rows.push(`file on home ${await ListerStartMeasurementTests.measureFileAsync(homedir(), script)}`);
      rows.push(`inline ${await ListerStartMeasurementTests.measureAsync(encoded)}`);
    }

    const atOnce = await Promise.all(Array.from({ length: ListerStartMeasurementTests.AT_ONCE }, () => ListerStartMeasurementTests.measureFileAsync(tmpdir(), script)));
    rows.push(...atOnce.map(t => `file on TEMP, ${ListerStartMeasurementTests.AT_ONCE} at once ${t}`));

    Assert.fail(`\n${rows.join("\n")}`);
  }

  private static async measureFileAsync(root: string, script: string): Promise<string> {
    const folder = await mkdtemp(join(root, "noldova-72-"));
    try {
      const file = join(folder, "list-processes.ps1");
      await writeFile(file, script, "utf8");
      return await ListerStartMeasurementTests.measureAsync(["-File", file]);
    }
    finally {
      await rm(folder, { recursive: true, force: true, maxRetries: 5 });
    }
  }

  private static async measureAsync(arguments_: readonly string[]): Promise<string> {
    const started = performance.now();
    const times: number[] = [];
    const child = spawn("powershell.exe", [...ListerStartMeasurementTests.ARGUMENTS, ...arguments_], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    child.once("spawn", () => times.push(performance.now() - started));
    const lines = createInterface({ input: child.stdout });
    let ends = 0;
    lines.on("line", (line: string) => {
      const text = line.trim();
      if (text === "first")
        times.push(performance.now() - started);
      else if (text === "end") {
        ends++;
        times.push(performance.now() - started);
        if (ends === 1)
          child.stdin.write("\n");
        else
          child.stdin.end();
      }
    });
    const guard = setTimeout(() => child.kill(), 120_000);
    await once(child, "close");
    clearTimeout(guard);

    return times.map(t => Math.round(t)).join(", ");
  }
}
