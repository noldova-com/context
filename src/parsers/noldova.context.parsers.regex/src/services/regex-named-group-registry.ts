/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RegexAlternativeBranch } from "../models/regex-alternative-branch.js";
import { RegexNamedGroupBranch } from "../models/regex-named-group-branch.js";

export class RegexNamedGroupRegistry {
  private readonly groups: Map<string, RegexNamedGroupBranch> = new Map();

  public hasConflict(groupName: string, branches: readonly RegexAlternativeBranch[]): boolean {
    let current = this.groups.get(groupName);
    if (Object.isUndefined(current))
      return false;

    for (const branch of branches) {
      const alternatives: Map<number, RegexNamedGroupBranch> | undefined = current.disjunctions.get(branch.disjunctionIndex);
      if (Object.isUndefined(alternatives) || current.isTerminal || current.disjunctions.size > 1)
        return true;

      const next: RegexNamedGroupBranch | undefined = alternatives.get(branch.alternativeIndex);
      if (Object.isUndefined(next))
        return false;

      current = next;
    }

    return true;
  }

  public add(groupName: string, branches: readonly RegexAlternativeBranch[]): void {
    let current = this.groups.get(groupName);
    if (Object.isUndefined(current)) {
      current = new RegexNamedGroupBranch();
      this.groups.set(groupName, current);
    }

    for (const branch of branches) {
      let alternatives: Map<number, RegexNamedGroupBranch> | undefined = current.disjunctions.get(branch.disjunctionIndex);
      if (Object.isUndefined(alternatives)) {
        alternatives = new Map();
        current.disjunctions.set(branch.disjunctionIndex, alternatives);
      }

      let next: RegexNamedGroupBranch | undefined = alternatives.get(branch.alternativeIndex);
      if (Object.isUndefined(next)) {
        next = new RegexNamedGroupBranch();
        alternatives.set(branch.alternativeIndex, next);
      }

      current = next;
    }

    current.isTerminal = true;
  }
}
