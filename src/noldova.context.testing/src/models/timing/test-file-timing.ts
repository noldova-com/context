/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Resources } from "../../resources.js";

export class TestFileTiming {
  public readonly file: string;
  public readonly medianMilliseconds: number | undefined;
  public readonly limitMilliseconds: number;
  public readonly budgetLimitMilliseconds: number;
  public readonly isListed: boolean;
  public readonly isOver: boolean;
  public readonly isStale: boolean;

  public constructor(file: string, medianMilliseconds: number | undefined, limitMilliseconds: number, budgetLimitMilliseconds: number, isListed: boolean) {
    this.file = file;
    this.medianMilliseconds = medianMilliseconds;
    this.limitMilliseconds = limitMilliseconds;
    this.budgetLimitMilliseconds = budgetLimitMilliseconds;
    this.isListed = isListed;
    this.isOver = Object.isUndefined(medianMilliseconds) || medianMilliseconds > limitMilliseconds;
    this.isStale = isListed && !Object.isUndefined(medianMilliseconds) && medianMilliseconds <= budgetLimitMilliseconds;
  }

  public format(): string {
    const median = Object.isUndefined(this.medianMilliseconds) ? Resources.notRun : `${Math.round(this.medianMilliseconds)} ms`;
    if (this.isOver)
      return Resources.fileTimingOver(this.file, median, this.limitMilliseconds);

    return this.isStale
      ? Resources.fileTimingStale(this.file, median, this.budgetLimitMilliseconds)
      : Resources.fileTimingWithin(this.file, median, this.limitMilliseconds);
  }
}
