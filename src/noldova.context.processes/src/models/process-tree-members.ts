/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ProcessEntry } from "./process-entry.js";
import type { ProcessIdentity } from "./process-identity.js";

export class ProcessTreeMembers {
  private readonly root: ProcessIdentity;
  private readonly members: Map<string, ProcessIdentity>;

  public constructor(root: ProcessIdentity) {
    this.root = root;
    this.members = new Map([[ProcessEntry.keyOf(root.processId, root.startTime), root]]);
  }

  public get size(): number {
    return this.members.size;
  }

  public get identities(): readonly ProcessIdentity[] {
    return [...this.members.values()];
  }

  public has(entry: ProcessEntry): boolean {
    return this.members.has(entry.key);
  }

  public collect(entries: readonly ProcessEntry[]): void {
    for (const entry of entries.toSorted((first, second) => first.startTime - second.startTime))
      if (this.belongs(entry, entries))
        this.members.set(entry.key, entry.identity);
  }

  private belongs(entry: ProcessEntry, entries: readonly ProcessEntry[]): boolean {
    return entry.groupId === this.root.processId ||
      this.members.values().some(t => t.processId === entry.parentId && t.startTime <= entry.startTime && !ProcessTreeMembers.isReused(t, entry, entries));
  }

  private static isReused(member: ProcessIdentity, entry: ProcessEntry, entries: readonly ProcessEntry[]): boolean {
    return entries.some(t => t.processId === member.processId && t.startTime > member.startTime && t.startTime <= entry.startTime);
  }
}
