/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RegexAlternativeBranch {
  public readonly alternativeIndex: number;
  public readonly disjunctionIndex: number;

  public constructor(disjunctionIndex: number, alternativeIndex: number) {
    this.disjunctionIndex = disjunctionIndex;
    this.alternativeIndex = alternativeIndex;
  }
}
