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
export class TypeScriptExpectedWorkerSupervisorTests {
  private static readonly BUDGET_BYTES: number = ScriptDriver.GROWN_BYTES / 2;
  private static readonly START_EVENT: string = "console.log(JSON.stringify({ event: \"start\", path: \"case.ts\" }));";
  private static readonly GATED_WORKER: string = "const fs = require(\"node:fs\"); const gate = process.argv[2]; " +
    "fs.writeFileSync(gate + \".pid\", String(process.pid)); " +
    `${TypeScriptExpectedWorkerSupervisorTests.START_EVENT} ` +
    "const wait = () => { if (!fs.existsSync(gate)) { setTimeout(wait, 10); return; } " +
    "console.log(JSON.stringify({ event: \"result\", path: \"case.ts\", record: { path: \"case.ts\" } })); }; wait();";
  private static readonly GROWING_WORKER: string = `${TypeScriptExpectedWorkerSupervisorTests.START_EVENT} ` +
    "require(\"node:child_process\").spawn(process.execPath, [require(\"node:path\").join(__dirname, \"grow.cjs\")], { stdio: \"ignore\" }); " +
    "setInterval(() => undefined, 1_000);";
  private static readonly ENDING_LISTER: string = "const fs = require(\"node:fs\"); const pidPath = process.argv[1]; console.log(\"ready\"); " +
    "process.stdin.on(\"data\", () => { if (fs.existsSync(pidPath)) process.exit(1); else console.log(\"end\"); });";
  private static readonly WORKER_FILE_NAME: string = "worker.cjs";

  @TestMethod
  public async finishesTheCaseWhenAnotherProcessGrowsPastTheBudgetAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts").then(t => t.startAsync());
      const supervisor = await load("typescript-expected-worker-supervisor.ts");
      const gatePath = fileIn("gate");
      let readings = 0;
      let grownAt;
      const counting = {
        readTreeBytesAsync: async processId => {
          const bytes = await memory.readTreeBytesAsync(processId);
          readings++;
          if (grownAt !== undefined && readings >= grownAt + 2)
            writeFileSync(gatePath, "");
          return bytes;
        },
      };
      const results = [];
      const running = new supervisor(fileIn("${TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME}"), gatePath, 60_000, ${TypeScriptExpectedWorkerSupervisorTests.BUDGET_BYTES}, counting)
        .runAsync(t => { results.push(t.path); });
      const other = spawn(process.execPath, [growPath], { stdio: ["ignore", "pipe", "inherit"] });
      await lineOf(other, "grown");
      grownAt = readings;
      const outcome = await running;
      other.kill();
      await memory.closeAsync();
      console.log("reason " + outcome.reason + ", results " + results.join());
    `, new Map([[TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME, TypeScriptExpectedWorkerSupervisorTests.GATED_WORKER]]));

    Assert.areEqual("reason undefined, results case.ts", output);
  }

  @TestMethod
  public async chargesTheCaseWhenAProcessTheWorkerStartedGrowsPastTheBudgetAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memory = await load("typescript-expected-process-memory.ts").then(t => t.startAsync());
      const supervisor = await load("typescript-expected-worker-supervisor.ts");
      const outcome = await new supervisor(fileIn("${TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME}"), fileIn("batch.json"), 60_000,
        ${TypeScriptExpectedWorkerSupervisorTests.BUDGET_BYTES}, memory).runAsync(() => undefined);
      await memory.closeAsync();
      console.log("reason " + outcome.reason + ", charged " + outcome.chargedPath);
    `, new Map([[TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME, TypeScriptExpectedWorkerSupervisorTests.GROWING_WORKER]]));

    Assert.areEqual("reason memory, charged case.ts", output);
  }

  @TestMethod
  public async failsTheRunAndEndsTheWorkerWhenAReadingFailsAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(`
      const memoryType = await load("typescript-expected-process-memory.ts");
      const listing = await load("typescript-expected-process-listing.ts");
      const supervisor = await load("typescript-expected-worker-supervisor.ts");
      const gatePath = fileIn("gate");
      const pidPath = gatePath + ".pid";
      const memory = await memoryType.startAsync(new listing(process.execPath, ["--eval", ${JSON.stringify(TypeScriptExpectedWorkerSupervisorTests.ENDING_LISTER)}, pidPath], undefined, 1));
      try {
        await new supervisor(fileIn("${TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME}"), gatePath, 60_000, ${TypeScriptExpectedWorkerSupervisorTests.BUDGET_BYTES}, memory)
          .runAsync(() => undefined);
      }
      catch (error) {
        console.log(error.name + ": " + error.message);
      }
      const workerId = Number(readFileSync(pidPath, "utf8"));
      const isRunning = () => { try { process.kill(workerId, 0); return true; } catch { return false; } };
      while (isRunning())
        await tick();
      await memory.closeAsync();
      console.log("worker ended");
    `, new Map([[TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME, TypeScriptExpectedWorkerSupervisorTests.GATED_WORKER]]));

    Assert.areEqual("TypeScriptScriptException: The process lister ended, so the worker's memory can no longer be measured.\nworker ended", output);
  }

  @TestMethod
  public async ignoresAReadingOverTheBudgetThatSettlesAfterTheWorkerExitedAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(
      TypeScriptExpectedWorkerSupervisorTests.lateReadingDriver(`held.resolve(${TypeScriptExpectedWorkerSupervisorTests.BUDGET_BYTES * 4});`),
      new Map([[TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME, TypeScriptExpectedWorkerSupervisorTests.GATED_WORKER]]));

    Assert.areEqual("reason undefined, kills 0", output);
  }

  @TestMethod
  public async ignoresAReadingThatFailsAfterTheWorkerExitedAsync(): Promise<void> {
    const output = await ScriptDriver.runAsync(
      TypeScriptExpectedWorkerSupervisorTests.lateReadingDriver("held.reject(new Error(\"The lister ended.\"));"),
      new Map([[TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME, TypeScriptExpectedWorkerSupervisorTests.GATED_WORKER]]));

    Assert.areEqual("reason undefined, kills 0", output);
  }

  private static lateReadingDriver(settle: string): string {
    return `
      const supervisor = await load("typescript-expected-worker-supervisor.ts");
      const gatePath = fileIn("gate");
      const held = Promise.withResolvers();
      const holding = { readTreeBytesAsync: () => { writeFileSync(gatePath, ""); return held.promise; } };
      const kill = process.kill;
      let kills = 0;
      process.kill = (...rest) => { kills++; return kill.apply(process, rest); };
      const outcome = await new supervisor(fileIn("${TypeScriptExpectedWorkerSupervisorTests.WORKER_FILE_NAME}"), gatePath, 60_000,
        ${TypeScriptExpectedWorkerSupervisorTests.BUDGET_BYTES}, holding).runAsync(() => undefined);
      ${settle}
      await new Promise(resolve => setImmediate(resolve));
      process.kill = kill;
      console.log("reason " + outcome.reason + ", kills " + kills);
    `;
  }
}
