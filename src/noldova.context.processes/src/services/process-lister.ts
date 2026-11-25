/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import "@noldova/context.core";

import { Dictionary, type IReadOnlyDictionary, type IReadOnlyList } from "@noldova/context.collections";

import { ProcessesException } from "../exceptions/processes.exception.js";
import { ProcessEntry } from "../models/process-entry.js";
import type { ProcessListing } from "../models/process-listing.js";
import { Resources } from "../resources.js";
import { ListerProcess } from "./lister-process.js";

export class ProcessLister {
  private static readonly started: Dictionary<ProcessListing, Promise<ListerProcess>> = new Dictionary<ProcessListing, Promise<ListerProcess>>();
  public readonly listing: ProcessListing;
  private readonly lister: ListerProcess;
  private readonly deadline: number;

  private constructor(lister: ListerProcess, listing: ProcessListing, deadline: number) {
    this.lister = lister;
    this.listing = listing;
    this.deadline = deadline;
  }

  public static async useAsync<T>(limitMilliseconds: number, action: (lister: ProcessLister) => Promise<T>,
    listings: IReadOnlyDictionary<string, ProcessListing> = Resources.listings): Promise<T> {
    const listing = listings.tryGet(process.platform);
    if (Object.isUndefined(listing))
      throw new ProcessesException(Resources.formatPlatformUnsupported(process.platform));

    const lister = await ProcessLister.startAsync(listing);
    const deadline = performance.now() + limitMilliseconds;
    const timer = setTimeout(lister.stop.bind(lister), limitMilliseconds + Resources.listerMarginMilliseconds);
    try {
      return await action(new ProcessLister(lister, listing, deadline));
    }
    finally {
      clearTimeout(timer);
    }
  }

  public async listAsync(): Promise<IReadOnlyList<ProcessEntry>> {
    for (let tries = 1; ; tries++) {
      const entries = await this.lister.listAsync();
      if (entries.any(t => t.processId === process.pid))
        return entries;

      if (tries === Resources.listingTries || performance.now() >= this.deadline)
        throw new ProcessesException(Resources.formatListingIncomplete(this.listing.file, tries));
    }
  }

  private static startAsync(listing: ProcessListing): Promise<ListerProcess> {
    const started = ProcessLister.started.tryGet(listing);
    if (!Object.isUndefined(started))
      return started;

    const starting = ListerProcess.startAsync(listing, () => ProcessLister.forget(listing, starting));
    ProcessLister.started.set(listing, starting);
    starting.catch(() => ProcessLister.forget(listing, starting));
    return starting;
  }

  private static forget(listing: ProcessListing, starting: Promise<ListerProcess>): void {
    if (ProcessLister.started.tryGet(listing) === starting)
      ProcessLister.started.remove(listing);
  }
}
