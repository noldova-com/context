/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class QueryCost {
  public estimate: number | null;
  public alone: boolean | null = null;

  public constructor(estimate: number | null = null) {
    this.estimate = estimate;
  }
}
