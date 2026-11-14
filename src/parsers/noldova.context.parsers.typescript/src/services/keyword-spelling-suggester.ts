/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TypeScriptSpellingDistanceRow } from "../models/typescript-spelling-distance-row.js";
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
    const beyond = budget + Resources.spellingBudgetMargin;
    let previous = new TypeScriptSpellingDistanceRow(beyond);
    for (let column = 0; column <= target.length; column++)
      previous.write(column, column);

    for (const [sourceIndex, character] of source.entries()) {
      const row = sourceIndex + 1;
      const firstColumn = Math.max(Math.ceil(row - budget), 1);
      const lastColumn = Math.min(Math.floor(budget + row), target.length);
      const current = new TypeScriptSpellingDistanceRow(beyond);
      let columnMinimum = row;
      current.write(0, row);
      for (const [offset, other] of target.slice(firstColumn - 1, lastColumn).entries()) {
        const column = firstColumn + offset;
        const substitution = previous.read(column - 1) + (character.toLowerCase() === other.toLowerCase()
          ? Resources.spellingCaseChangeCost
          : Resources.spellingSubstitutionCost);
        const distance = character === other
          ? previous.read(column - 1)
          : Math.min(previous.read(column) + Resources.spellingEditCost, current.read(column - 1) + Resources.spellingEditCost, substitution);
        current.write(column, distance);
        columnMinimum = Math.min(columnMinimum, distance);
      }
      if (columnMinimum > budget)
        return undefined;

      previous = current;
    }

    const result = previous.read(target.length);

    return result > budget ? undefined : result;
  }
}
