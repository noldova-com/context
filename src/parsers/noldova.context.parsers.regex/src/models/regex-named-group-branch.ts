/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RegexNamedGroupBranch {
  public readonly disjunctions: Map<number, Map<number, RegexNamedGroupBranch>> = new Map();
  public isTerminal: boolean = false;
}
