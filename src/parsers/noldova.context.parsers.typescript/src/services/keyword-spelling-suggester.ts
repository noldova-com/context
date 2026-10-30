/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Resources } from "../resources.js";
import { TypeScriptKeywordNodeFactory } from "./typescript-keyword-node-factory.js";

export class KeywordSpellingSuggester {
  private static readonly CANDIDATES: readonly string[] =
    TypeScriptKeywordNodeFactory.KEYWORDS.filter(t => t.length >= Resources.suggestibleKeywordMinimumLength).sort();

  public suggest(word: string): string | undefined {
    return this.suggestBySpelling(word) ?? this.suggestBySpace(word);
  }

  private suggestBySpelling(word: string): string | undefined {
    const characters = [...word];
    const maximumLengthDifference = Math.max(Resources.spellingLengthDifferenceMinimum,
      Math.trunc(characters.length * Resources.spellingLengthDifferenceRatio));
    let bestDistance = Math.floor(characters.length * Resources.spellingDistanceBudgetRatio) + Resources.spellingDistanceBudgetOffset;
    let best: string | undefined;

    for (const keyword of KeywordSpellingSuggester.CANDIDATES) {
      if (keyword === word || Math.abs(keyword.length - characters.length) > maximumLengthDifference)
        continue;

      const distance = KeywordSpellingSuggester.distance(characters, [...keyword], bestDistance);
      if (Object.isUndefined(distance))
        continue;

      if (distance < bestDistance || Object.isUndefined(best)) {
        bestDistance = distance;
        best = keyword;
      }
    }

    return best;
  }

  private suggestBySpace(word: string): string | undefined {
    for (const keyword of KeywordSpellingSuggester.CANDIDATES)
      if (word.length > keyword.length + Resources.spellingSpaceMinimumExcess && word.startsWith(keyword))
        return `${keyword}${Resources.space}${word.slice(keyword.length)}`;

    return undefined;
  }

  private static distance(source: readonly string[], target: readonly string[], budget: number): number | undefined {
    let previous = target.map((_, index) => index + 1);
    previous.unshift(0);
    let current = new Array<number>(target.length + 1);
    const beyond = budget + Resources.spellingBudgetMargin;

    for (let row = 1; row <= source.length; row++) {
      const character = source[row - 1]!;
      const firstColumn = Math.max(Math.ceil(row - budget), 1);
      const lastColumn = Math.min(Math.floor(budget + row), target.length);
      let columnMinimum = row;
      current[0] = row;
      for (let column = 1; column < firstColumn; column++)
        current[column] = beyond;
      for (let column = firstColumn; column <= lastColumn; column++) {
        const other = target[column - 1]!;
        const substitution = previous[column - 1]! + (character.toLowerCase() === other.toLowerCase()
          ? Resources.spellingCaseChangeCost
          : Resources.spellingSubstitutionCost);
        const distance = character === other
          ? previous[column - 1]!
          : Math.min(previous[column]! + Resources.spellingEditCost, current[column - 1]! + Resources.spellingEditCost, substitution);
        current[column] = distance;
        columnMinimum = Math.min(columnMinimum, distance);
      }
      for (let column = lastColumn + 1; column <= target.length; column++)
        current[column] = beyond;
      if (columnMinimum > budget)
        return undefined;

      [previous, current] = [current, previous];
    }

    const result = previous[target.length]!;

    return result > budget ? undefined : result;
  }
}
