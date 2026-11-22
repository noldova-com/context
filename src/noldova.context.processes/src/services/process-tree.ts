/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { setTimeout } from "node:timers/promises";

import { ProcessTreeEndException } from "../exceptions/process-tree-end.exception.js";
import type { ProcessEntry } from "../models/process-entry.js";
import type { ProcessIdentity } from "../models/process-identity.js";
import { ProcessTreeEndOptions } from "../models/process-tree-end-options.js";
import { ProcessTreeMembers } from "../models/process-tree-members.js";
import { Resources } from "../resources.js";
import { ProcessLister } from "./process-lister.js";

export class ProcessTree {
  private readonly lister: ProcessLister;
  private readonly root: ProcessIdentity;
  private readonly members: ProcessTreeMembers;
  private entries: readonly ProcessEntry[];

  private constructor(lister: ProcessLister, root: ProcessIdentity) {
    this.lister = lister;
    this.root = root;
    this.members = new ProcessTreeMembers(root);
    this.entries = [];
  }

  public static endAsync(root: ProcessIdentity, options: ProcessTreeEndOptions = new ProcessTreeEndOptions()): Promise<readonly ProcessIdentity[]> {
    return ProcessLister.useAsync(options.limitMilliseconds, t => new ProcessTree(t, root).endTreeAsync(options, performance.now() + options.limitMilliseconds));
  }

  private async endTreeAsync(options: ProcessTreeEndOptions, deadline: number): Promise<readonly ProcessIdentity[]> {
    this.entries = await this.lister.listAsync();
    if (this.entries.some(t => t.processId === this.root.processId && t.startTime !== this.root.startTime))
      return [];

    this.members.collect(this.entries);
    for (let round = 0, count = 0; round < this.lister.listing.freezeRounds && this.members.size > count; round++) {
      count = this.members.size;
      await ProcessTree.signalAsync(this.lister.listing.signals.stop, this.alive());
      await this.listAsync();
    }

    if (options.graceMilliseconds > 0)
      await this.waitOutGraceAsync(performance.now() + options.graceMilliseconds);

    for (;;) {
      const alive = this.alive();
      if (alive.length === 0)
        return this.members.identities;

      await ProcessTree.signalAsync(this.lister.listing.signals.kill, alive);
      if (performance.now() >= deadline)
        throw new ProcessTreeEndException(alive.map(t => t.identity), options.limitMilliseconds);

      await setTimeout(Resources.roundMilliseconds);
      await this.listAsync();
    }
  }

  private async waitOutGraceAsync(graceEnd: number): Promise<void> {
    await ProcessTree.signalAsync(this.lister.listing.signals.terminate, this.alive());
    await ProcessTree.signalAsync(this.lister.listing.signals.resume, this.alive());
    while (this.alive().length > 0 && performance.now() < graceEnd) {
      await setTimeout(Resources.roundMilliseconds);
      await this.listAsync();
    }
  }

  private static async signalAsync(signal: NodeJS.Signals | number, entries: readonly ProcessEntry[]): Promise<void> {
    await Promise.allSettled(entries.map(async t => process.kill(t.processId, signal)));
  }

  private async listAsync(): Promise<void> {
    this.entries = await this.lister.listAsync();
    this.members.collect(this.entries);
  }

  private alive(): readonly ProcessEntry[] {
    return this.entries.filter(t => !t.isZombie && this.members.has(t));
  }
}
