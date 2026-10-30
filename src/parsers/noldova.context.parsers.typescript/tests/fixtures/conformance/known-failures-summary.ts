/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonObject } from "./json-object.js";

export class KnownFailuresSummary {
  public readonly applicable: number;
  public readonly passing: number;
  public readonly statedDifferences: number;
  public readonly checkerDecided: number;
  public readonly failing: number;

  public constructor(applicable: number, passing: number, statedDifferences: number, checkerDecided: number, failing: number) {
    this.applicable = applicable;
    this.passing = passing;
    this.statedDifferences = statedDifferences;
    this.checkerDecided = checkerDecided;
    this.failing = failing;
  }

  public static from(object: JsonObject): KnownFailuresSummary {
    return new KnownFailuresSummary(object.number("applicable"), object.number("passing"), object.number("statedDifferences"),
      object.number("checkerDecided"), object.number("failing"));
  }
}
