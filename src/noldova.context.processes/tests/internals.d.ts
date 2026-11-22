/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.processes/models/process-signals.js" {
  export class ProcessSignals {
    public readonly stop: NodeJS.Signals | number;
    public readonly resume: NodeJS.Signals | number;
    public readonly terminate: NodeJS.Signals | number;
    public readonly kill: NodeJS.Signals | number;

    public constructor(stop: NodeJS.Signals | number, resume: NodeJS.Signals | number, terminate: NodeJS.Signals | number, kill: NodeJS.Signals | number);
  }
}

declare module "@noldova/context.processes/models/process-listing.js" {
  import type { ProcessSignals } from "@noldova/context.processes/models/process-signals.js";

  export class ProcessListing {
    public readonly file: string;
    public readonly arguments: readonly string[];
    public readonly scriptFileName: string;
    public readonly script: string;
    public readonly signals: ProcessSignals;
    public readonly freezeRounds: number;
    public readonly readyMilliseconds: number;

    public constructor(file: string, arguments_: readonly string[], scriptFileName: string, script: string, signals: ProcessSignals, freezeRounds: number,
      readyMilliseconds: number);
  }
}

declare module "@noldova/context.processes/models/process-entry.js" {
  export class ProcessEntry {
    public readonly processId: number;
    public readonly parentId: number;
    public readonly groupId: number;
    public readonly isZombie: boolean;
    public readonly startTime: number;

    public static parse(line: string): ProcessEntry;
  }
}

declare module "@noldova/context.processes/models/process-tree-members.js" {
  import type { ProcessIdentity } from "@noldova/context.processes";
  import type { ProcessEntry } from "@noldova/context.processes/models/process-entry.js";

  export class ProcessTreeMembers {
    public readonly identities: readonly ProcessIdentity[];

    public constructor(root: ProcessIdentity);

    public collect(entries: readonly ProcessEntry[]): void;
  }
}

declare module "@noldova/context.processes/services/process-lister.js" {
  import type { ProcessEntry } from "@noldova/context.processes/models/process-entry.js";
  import type { ProcessListing } from "@noldova/context.processes/models/process-listing.js";

  export class ProcessLister {
    public readonly listing: ProcessListing;

    public static useAsync<T>(limitMilliseconds: number, action: (lister: ProcessLister) => Promise<T>, listings?: ReadonlyMap<string, ProcessListing>): Promise<T>;

    public listAsync(): Promise<readonly ProcessEntry[]>;
  }
}
