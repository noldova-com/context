/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcessByStdio, spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";

import "@noldova/context.core";
import { ProcessIdentity } from "@noldova/context.processes";
import type { ProcessEntry } from "@noldova/context.processes/models/process-entry.js";
import { ProcessLister } from "@noldova/context.processes/services/process-lister.js";
import { Assert } from "@noldova/context.testing";

import type { TreeShape } from "./tree-shape.fixture.js";

export class StartedTree {
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly LINE_EVENT: string = "line";
  private static readonly CLOSE_EVENT: string = "close";
  private static readonly GONE_LIMIT_MILLISECONDS: number = 10_000;
  private static readonly SCRIPT: string = `
    import { spawn } from "node:child_process";
    import { once } from "node:events";
    import { createInterface } from "node:readline";
    const [script, shapeText, watched] = process.argv.slice(1);
    const shape = JSON.parse(shapeText);
    const start = (childShape, detached, cwd) => spawn(process.execPath, ["--input-type=module", "--eval", script, script, JSON.stringify(childShape), watched],
      { detached, cwd, stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
    setInterval(() => { try { process.kill(Number(watched), 0); } catch { process.exit(); } }, 200);
    if (shape.ignoresTerminate)
      process.on("SIGTERM", () => undefined);
    const processIds = [process.pid];
    const children = shape.forks ? [...shape.children, { children: [] }] : shape.children;
    for (const child of children) {
      const [line] = await once(createInterface({ input: start(child, child.detached, child.folder).stdout }), "line");
      processIds.push(...JSON.parse(line));
    }
    console.log(JSON.stringify(processIds));
    if (shape.forks)
      setInterval(() => start({ children: [] }, false, undefined), 50);
    if (shape.exits)
      process.exit();
  `;

  public readonly root: ChildProcessByStdio<null, Readable, null>;
  public readonly identity: ProcessIdentity;
  public readonly processIds: readonly number[];
  private readonly closed: Promise<unknown>;

  private constructor(root: ChildProcessByStdio<null, Readable, null>, identity: ProcessIdentity, processIds: readonly number[], closed: Promise<unknown>) {
    this.root = root;
    this.identity = identity;
    this.processIds = processIds;
    this.closed = closed;
  }

  public static async startAsync(shape: TreeShape): Promise<StartedTree> {
    const environment = { ...process.env };
    Reflect.deleteProperty(environment, StartedTree.COVERAGE_VARIABLE);
    const root = spawn(process.execPath, ["--input-type=module", "--eval", StartedTree.SCRIPT, StartedTree.SCRIPT, JSON.stringify(shape), String(process.pid)],
      { detached: true, env: environment, stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
    const closed = once(root, StartedTree.CLOSE_EVENT);
    const rootProcessId = root.pid;
    Assert.isDefined(rootProcessId, "The tree's root did not start.");
    const [line] = await once(createInterface({ input: root.stdout }), StartedTree.LINE_EVENT);
    const processIds: number[] = JSON.parse(String(line));
    const identity = await ProcessIdentity.readAsync(rootProcessId);
    Assert.isDefined(identity);
    return new StartedTree(root, identity, processIds, closed);
  }

  public processIdAt(index: number): number {
    const processId = this.processIds[index];
    Assert.isDefined(processId, `The tree has no process at ${index}; its processes are ${this.processIds.join(", ")}.`);
    return processId;
  }

  public async waitUntilClosedAsync(): Promise<void> {
    await this.closed;
  }

  public static async waitUntilGoneAsync(processIds: readonly number[]): Promise<void> {
    await ProcessLister.useAsync(StartedTree.GONE_LIMIT_MILLISECONDS, async lister => {
      const deadline = performance.now() + StartedTree.GONE_LIMIT_MILLISECONDS;
      while (StartedTree.listsAny(await lister.listAsync(), processIds))
        Assert.isTrue(performance.now() < deadline, processIds.join());
    });
  }

  public static async areGoneAsync(processIds: readonly number[]): Promise<boolean> {
    return !StartedTree.listsAny(await ProcessLister.useAsync(StartedTree.GONE_LIMIT_MILLISECONDS, t => t.listAsync()), processIds);
  }

  private static listsAny(entries: readonly ProcessEntry[], processIds: readonly number[]): boolean {
    return entries.some(t => !t.isZombie && processIds.includes(t.processId));
  }
}
