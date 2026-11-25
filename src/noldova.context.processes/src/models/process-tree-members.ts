/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, type Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import type { IProcessIdentity } from "../interfaces/i-process-identity.js";
import type { ProcessEntry } from "./process-entry.js";
import type { ProcessIdentity } from "./process-identity.js";
import { ProcessIdentityComparer } from "./process-identity-comparer.js";

export class ProcessTreeMembers {
  private readonly root: ProcessIdentity;
  private readonly members: Dictionary<IProcessIdentity, ProcessIdentity>;

  public constructor(root: ProcessIdentity) {
    this.root = root;
    this.members = new Dictionary<IProcessIdentity, ProcessIdentity>([], ProcessIdentityComparer.instance);
    this.members.set(root, root);
  }

  public get size(): number {
    return this.members.count();
  }

  public get identities(): Enumerable<ProcessIdentity> {
    return this.members.values();
  }

  public has(entry: ProcessEntry): boolean {
    return this.members.containsKey(entry);
  }

  public collect(entries: IReadOnlyList<ProcessEntry>): void {
    for (const entry of entries.orderBy(t => t.startTime))
      if (this.belongs(entry, entries))
        this.members.set(entry, entry.identity);
  }

  private belongs(entry: ProcessEntry, entries: IReadOnlyList<ProcessEntry>): boolean {
    return entry.groupId === this.root.processId ||
      this.members.values().any(t => t.processId === entry.parentId && t.startTime <= entry.startTime && !ProcessTreeMembers.isReused(t, entry, entries));
  }

  private static isReused(member: ProcessIdentity, entry: ProcessEntry, entries: IReadOnlyList<ProcessEntry>): boolean {
    return entries.any(t => t.processId === member.processId && t.startTime > member.startTime && t.startTime <= entry.startTime);
  }
}
