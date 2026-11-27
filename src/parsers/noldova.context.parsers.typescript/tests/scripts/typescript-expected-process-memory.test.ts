/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ScriptDriver } from "../fixtures/scripts/script-driver.fixture.js";

@TestClass
export class TypeScriptExpectedProcessMemoryTests {
  private static readonly ROOT_SCRIPT: string = "const child = require(\"node:child_process\").spawn(process.execPath, [process.argv[1]], { stdio: \"inherit\" }); " +
    "console.log(\"child \" + child.pid); setInterval(() => undefined, 1_000);";
  private static readonly IDLE_SCRIPT: string = "setInterval(() => undefined, 1_000);";
  private static readonly ENDING_SCRIPT: string = "console.log(\"ready\"); process.stdin.once(\"data\", () => process.exit(1));";

  @TestMethod
  public async countsTheMemoryOfAProcessAndEveryProcessItStartedAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts").then(t => t.startAsync());
      const root = spawn(process.execPath, ["--eval", ${JSON.stringify(TypeScriptExpectedProcessMemoryTests.ROOT_SCRIPT)}, growPath], { stdio: ["ignore", "pipe", "inherit"] });
      let childId;
      await new Promise(resolve => readline.createInterface({ input: root.stdout }).on("line", t => {
        if (t.startsWith("child "))
          childId = Number(t.slice("child ".length));
        else if (t === "grown")
          resolve();
      }));
      const treeBytes = await memory.readTreeBytesAsync(root.pid);
      const childBytes = await memory.readTreeBytesAsync(childId);
      root.kill();
      await memory.closeAsync();
      console.log("tree at least its grown child: " + (treeBytes >= childBytes));
    `);

    Assert.areEqual("tree at least its grown child: true", output);
  }

  @TestMethod
  public async leavesOutTheMemoryOfAnotherProcessAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts").then(t => t.startAsync());
      const other = spawn(process.execPath, [growPath], { stdio: ["ignore", "pipe", "inherit"] });
      await lineOf(other, "grown");
      const root = spawn(process.execPath, ["--eval", ${JSON.stringify(TypeScriptExpectedProcessMemoryTests.IDLE_SCRIPT)}], { stdio: "ignore" });
      const rootBytes = await memory.readTreeBytesAsync(root.pid);
      const otherBytes = await memory.readTreeBytesAsync(other.pid);
      root.kill();
      other.kill();
      await memory.closeAsync();
      console.log("root below the other: " + (rootBytes < otherBytes));
    `);

    Assert.areEqual("root below the other: true", output);
  }

  @TestMethod
  public async rejectsAPlatformItCannotMeasureAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts");
      try {
        memory.listingFor("aix");
      }
      catch (exception) {
        console.log(exception.name + ": " + exception.message);
      }
    `);

    Assert.areEqual("TypeScriptScriptException: The worker's memory cannot be measured on aix; the generator lists processes on darwin, linux and win32.", output);
  }

  @TestMethod
  public async rejectsTheStartAndRemovesItsScriptWhenTheListerEndsBeforeItIsReadyAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts");
      const listing = await load("typescript-expected-process-listing.ts");
      try {
        await memory.startAsync(new listing(process.execPath, [memory.SCRIPT_ARGUMENT], "process.exit(1);", 1));
      }
      catch (exception) {
        console.log(exception.name + ": " + exception.message);
      }
      console.log("left " + readdirSync(tmpdir()).length);
    `);

    Assert.areEqual(`TypeScriptScriptException: The process lister ${process.execPath} ended before it was ready, so the worker's memory cannot be measured.\nleft 0`, output);
  }

  @TestMethod
  public async rejectsEveryReadingOnceTheListerHasEndedAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts");
      const listing = await load("typescript-expected-process-listing.ts");
      const started = await memory.startAsync(new listing(process.execPath, ["--eval", ${JSON.stringify(TypeScriptExpectedProcessMemoryTests.ENDING_SCRIPT)}], undefined, 1));
      for (let index = 0; index < 2; index++)
        await started.readTreeBytesAsync(process.pid).catch(error => { console.log(error.name + ": " + error.message); });
      await started.closeAsync();
    `);

    const message = "TypeScriptScriptException: The process lister ended, so the worker's memory can no longer be measured.";
    Assert.areEqual(`${message}\n${message}`, output);
  }
}
