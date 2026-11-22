/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Resources } from "../../resources.js";

export class ProcessDescendants {
  public readonly processIds: readonly number[];
  public readonly isWarm: boolean;
  public readonly milliseconds: number;
  public readonly listedCount: number;
  public readonly brokenChains: readonly string[] | undefined;
  public readonly incompleteListings: readonly string[];

  public constructor(processIds: readonly number[], isWarm: boolean, milliseconds: number, listedCount: number, brokenChains: readonly string[] | undefined,
    incompleteListings: readonly string[]) {
    this.processIds = processIds;
    this.isWarm = isWarm;
    this.milliseconds = milliseconds;
    this.listedCount = listedCount;
    this.brokenChains = brokenChains;
    this.incompleteListings = incompleteListings;
  }

  public describe(): string {
    const described = Resources.processListingDescribed(
      this.isWarm ? Resources.warmListingKind : Resources.oneOffListingKind,
      this.milliseconds,
      this.listedCount,
      this.describeBrokenChains());
    return this.incompleteListings.length === 0 ? described : `${described} ${Resources.processListingsRetried(this.incompleteListings)}`;
  }

  private describeBrokenChains(): string {
    if (Object.isUndefined(this.brokenChains))
      return Resources.noStartTimes;

    if (this.brokenChains.length === 0)
      return Resources.noBrokenChains;

    return Resources.brokenChainsListed(this.brokenChains);
  }
}
