/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";

export class ProcessTree {
  private readonly file: string;
  private readonly listingArguments: readonly string[];

  public constructor(platform: string) {
    const listing = Resources.processListings.get(platform);
    if (Object.isUndefined(listing))
      throw new TestingException(Resources.processListingUnsupported(platform));

    this.file = listing.file;
    this.listingArguments = listing.arguments;
  }

  public static end(processIds: readonly number[]): number {
    return processIds.filter(t => ProcessTree.tryEnd(t)).length;
  }

  public async listDescendantsAsync(rootProcessId: number): Promise<number[]> {
    const links = await this.listLinksAsync();
    const processIds: number[] = [];
    ProcessTree.collectLeavesFirst(links, rootProcessId, processIds);
    return processIds;
  }

  private static tryEnd(processId: number): boolean {
    try {
      process.kill(processId, Resources.killSignal);
      return true;
    }
    catch {
      return false;
    }
  }

  private static collectLeavesFirst(links: readonly (readonly [number, number])[], parentId: number, processIds: number[]): void {
    for (const [processId] of links.filter(t => t[1] === parentId)) {
      ProcessTree.collectLeavesFirst(links, processId, processIds);
      processIds.push(processId);
    }
  }

  private static parseLinks(output: string, listerProcessId: number | undefined): (readonly [number, number])[] {
    return output.split(Resources.lineSeparator)
      .map(t => t.trim().split(/\s+/u))
      .filter(t => t.length === 2)
      .map((t): readonly [number, number] => [Number(t[0]), Number(t[1])])
      .filter(t => t[0] !== listerProcessId);
  }

  private listLinksAsync(): Promise<(readonly [number, number])[]> {
    return new Promise<(readonly [number, number])[]>((resolve, reject) => {
      const lister = execFile(this.file, this.listingArguments, { encoding: Resources.textEncoding, windowsHide: true }, (error, output) => {
        if (Object.isNull(error))
          resolve(ProcessTree.parseLinks(output, lister.pid));
        else
          reject(new TestingException(Resources.processListingFailed(this.file), new ExceptionOptions(error)));
      });
    });
  }
}
