/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class TestFileTiming {
  public readonly file: string;
  public readonly medianMilliseconds: number | undefined;
  public readonly limitMilliseconds: number;
  public readonly isListed: boolean;
  public readonly isOver: boolean;

  public constructor(file: string, medianMilliseconds: number | undefined, limitMilliseconds: number, isListed: boolean) {
    this.file = file;
    this.medianMilliseconds = medianMilliseconds;
    this.limitMilliseconds = limitMilliseconds;
    this.isListed = isListed;
    this.isOver = Object.isUndefined(medianMilliseconds) || medianMilliseconds > limitMilliseconds;
  }
}
