/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Enumerable } from "@noldova/context.collections";
import { ArgumentOutOfRangeException, InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";
import { TrackedSequence } from "../fixtures/tracked-sequence.fixture.js";

@TestClass
export class EnumerableTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public fromReadsTheSourceWhenEnumerated(): void {
    const source = [1, 2];
    const query = Enumerable.from(source);

    source.push(3);

    Assert.areEqual("[1,2,3]", JSON.stringify(query.toArray()));
    Assert.areEqual("[1,2,3]", JSON.stringify(query.toArray()));
  }

  @TestMethod
  public emptyHasNoItems(): void {
    Assert.areEqual("[]", JSON.stringify(Enumerable.empty<number>().toArray()));
  }

  @TestMethod
  public rangeCountsUpFromTheStart(): void {
    Assert.areEqual("[-2,-1,0,1]", JSON.stringify(Enumerable.range(-2, 4).toArray()));
    Assert.areEqual("[]", JSON.stringify(Enumerable.range(5, 0).toArray()));
  }

  @TestMethod
  public rangeRejectsAFractionalStart(): void {
    const exception = Assert.throws(() => Enumerable.range(0.5, 1), ArgumentOutOfRangeException);

    Assert.areEqual("start", exception.parameterName);
    Assert.areEqual<unknown>(0.5, exception.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(1.5)
  public rangeRejectsACountThatIsNotANonNegativeInteger(count: number): void {
    const exception = Assert.throws(() => Enumerable.range(0, count), ArgumentOutOfRangeException);

    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(count, exception.actualValue);
  }

  @TestMethod
  public rangeEndsAtTheLargestSafeInteger(): void {
    Assert.areEqual("[9007199254740990,9007199254740991]", JSON.stringify(Enumerable.range(9_007_199_254_740_990, 2).toArray()));
    Assert.areEqual("[]", JSON.stringify(Enumerable.range(9_007_199_254_740_991, 0).toArray()));
  }

  @TestMethod
  public rangeRejectsACountThatGoesPastTheLargestSafeInteger(): void {
    const exception = Assert.throws(() => Enumerable.range(9_007_199_254_740_991, 2), ArgumentOutOfRangeException);

    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(2, exception.actualValue);
    Assert.isTrue(exception.message.startsWith("Every integer of the range must be a safe integer"), exception.message);
  }

  @TestMethod
  public rangeRejectsAStartBelowTheSmallestSafeInteger(): void {
    const exception = Assert.throws(() => Enumerable.range(-9_007_199_254_740_992, 1), ArgumentOutOfRangeException);

    Assert.areEqual("start", exception.parameterName);
    Assert.areEqual<unknown>(-9_007_199_254_740_992, exception.actualValue);
    Assert.isTrue(exception.message.startsWith("Every integer of the range must be a safe integer"), exception.message);
  }

  @TestMethod
  public repeatYieldsTheValueCountTimes(): void {
    Assert.areEqual("[\"a\",\"a\",\"a\"]", JSON.stringify(Enumerable.repeat("a", 3).toArray()));
    Assert.areEqual("[]", JSON.stringify(Enumerable.repeat("a", 0).toArray()));
  }

  @TestMethod
  @TestData(-1)
  @TestData(2.5)
  public repeatRejectsACountThatIsNotANonNegativeInteger(count: number): void {
    const exception = Assert.throws(() => Enumerable.repeat("a", count), ArgumentOutOfRangeException);

    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(count, exception.actualValue);
  }

  @TestMethod
  public queryRunsItsCallbackOnlyWhenEnumeratedAndAgainEachTime(): void {
    let calls = 0;
    const query = Enumerable.from([1, 2, 3]).select(t => {
      calls++;

      return t * 2;
    });

    Assert.areEqual(0, calls);
    Assert.areEqual("[2,4,6]", JSON.stringify(query.toArray()));
    Assert.areEqual(3, calls);
    Assert.areEqual("[2,4,6]", JSON.stringify(query.toArray()));
    Assert.areEqual(6, calls);
  }

  @TestMethod
  public whereKeepsTheMatchingItems(): void {
    Assert.areEqual("[7,8]", JSON.stringify(Enumerable.from([5, 6, 7, 8]).where(t => t > 6).toArray()));
  }

  @TestMethod
  public wherePassesTheIndex(): void {
    Assert.areEqual("[5,7]", JSON.stringify(Enumerable.from([5, 6, 7, 8]).where((_item, index) => index % 2 === 0).toArray()));
  }

  @TestMethod
  public whereNarrowsWithATypeGuard(): void {
    const texts = Enumerable.from<string | number>(["a", 1, "b"]).where((t: string | number): t is string => Object.isString(t));

    Assert.areEqual("[\"A\",\"B\"]", JSON.stringify(texts.select(t => t.toUpperCase()).toArray()));
  }

  @TestMethod
  public selectProjectsEachItemWithItsIndex(): void {
    Assert.areEqual("[\"a0\",\"b1\"]", JSON.stringify(Enumerable.from(["a", "b"]).select((item, index) => `${item}${index}`).toArray()));
  }

  @TestMethod
  public selectManyFlattensEachItemsSequence(): void {
    const flattened = Enumerable.from([1, 2]).selectMany((item, index) => Enumerable.repeat(item, index + 1));

    Assert.areEqual("[1,2,2]", JSON.stringify(flattened.toArray()));
  }

  @TestMethod
  public joinPairsEachOuterItemWithItsMatchingInnerItems(): void {
    const joined = Enumerable.from(["a", "b", "c"]).join(["a1", "c1", "a2"], t => t, t => t.charAt(0), (outer, inner) => `${outer}:${inner}`);

    Assert.areEqual("[\"a:a1\",\"a:a2\",\"c:c1\"]", JSON.stringify(joined.toArray()));
  }

  @TestMethod
  public joinMatchesKeysWithTheComparer(): void {
    const joined = Enumerable.from(["A", "b", "c"]).join(
      ["a1", "B2"],
      t => t,
      t => t.charAt(0),
      (outer, inner) => `${outer}:${inner}`,
      EnumerableTests.caseInsensitive);

    Assert.areEqual("[\"A:a1\",\"b:B2\"]", JSON.stringify(joined.toArray()));
  }

  @TestMethod
  public groupJoinGivesEachOuterItemAllItsMatches(): void {
    const joined = Enumerable.from(["a", "b", "c"]).groupJoin(
      ["a1", "c1", "a2"],
      t => t,
      t => t.charAt(0),
      (outer, matches) => `${outer}:${matches.toArray().join("|")}`);

    Assert.areEqual("[\"a:a1|a2\",\"b:\",\"c:c1\"]", JSON.stringify(joined.toArray()));
  }

  @TestMethod
  public groupJoinMatchesKeysWithTheComparer(): void {
    const joined = Enumerable.from(["A", "b"]).groupJoin(
      ["a1", "a2", "c1"],
      t => t,
      t => t.charAt(0),
      (outer, matches) => `${outer}:${matches.count()}`,
      EnumerableTests.caseInsensitive);

    Assert.areEqual("[\"A:2\",\"b:0\"]", JSON.stringify(joined.toArray()));
  }

  @TestMethod
  public distinctKeepsTheFirstOfEqualItems(): void {
    Assert.areEqual("[3,1,2]", JSON.stringify(Enumerable.from([3, 1, 3, 2, 1]).distinct().toArray()));
    Assert.areEqual(2, Enumerable.from([Number.NaN, Number.NaN, 0, -0]).distinct().count());
  }

  @TestMethod
  public distinctUsesTheComparer(): void {
    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(Enumerable.from(["a", "A", "b"]).distinct(EnumerableTests.caseInsensitive).toArray()));
  }

  @TestMethod
  public distinctByKeepsTheFirstItemOfEachKey(): void {
    Assert.areEqual("[\"apple\",\"banana\"]", JSON.stringify(Enumerable.from(["apple", "avocado", "banana"]).distinctBy(t => t.charAt(0)).toArray()));
  }

  @TestMethod
  public distinctByComparesKeysWithTheComparer(): void {
    const distinct = Enumerable.from(["Apple", "avocado", "banana"]).distinctBy(t => t.charAt(0), EnumerableTests.caseInsensitive);

    Assert.areEqual("[\"Apple\",\"banana\"]", JSON.stringify(distinct.toArray()));
  }

  @TestMethod
  public unionKeepsTheDistinctItemsOfBothInOrder(): void {
    Assert.areEqual("[1,2,3,4]", JSON.stringify(Enumerable.from([1, 2, 2]).union([3, 2, 1, 4]).toArray()));
  }

  @TestMethod
  public unionUsesTheComparer(): void {
    Assert.areEqual("[\"a\",\"B\",\"c\"]", JSON.stringify(Enumerable.from(["a", "B"]).union(["A", "c"], EnumerableTests.caseInsensitive).toArray()));
  }

  @TestMethod
  public intersectKeepsEachSourceItemAlsoInTheOtherOnce(): void {
    Assert.areEqual("[2,4]", JSON.stringify(Enumerable.from([1, 2, 2, 3, 4]).intersect([4, 2, 5]).toArray()));
  }

  @TestMethod
  public intersectUsesTheComparer(): void {
    const common = Enumerable.from(["A", "b", "dd", "c", "C"]).intersect(["a", "C"], EnumerableTests.caseInsensitive);

    Assert.areEqual("[\"A\",\"c\"]", JSON.stringify(common.toArray()));
  }

  @TestMethod
  public exceptKeepsEachSourceItemNotInTheOtherOnce(): void {
    Assert.areEqual("[1,3,4]", JSON.stringify(Enumerable.from([1, 2, 1, 3, 4]).except([2, 5]).toArray()));
  }

  @TestMethod
  public exceptUsesTheComparer(): void {
    Assert.areEqual("[\"a\",\"c\"]", JSON.stringify(Enumerable.from(["a", "B", "c", "A"]).except(["b"], EnumerableTests.caseInsensitive).toArray()));
  }

  @TestMethod
  public concatYieldsTheOtherAfterTheSource(): void {
    Assert.areEqual("[1,2,3]", JSON.stringify(Enumerable.from([1, 2]).concat([3]).toArray()));
  }

  @TestMethod
  public appendAddsTheItemAtTheEnd(): void {
    Assert.areEqual("[1,2,3]", JSON.stringify(Enumerable.from([1, 2]).append(3).toArray()));
  }

  @TestMethod
  public prependAddsTheItemAtTheStart(): void {
    Assert.areEqual("[0,1,2]", JSON.stringify(Enumerable.from([1, 2]).prepend(0).toArray()));
  }

  @TestMethod
  @TestData(-1, "[1,2,3]")
  @TestData(0, "[1,2,3]")
  @TestData(2, "[3]")
  @TestData(5, "[]")
  public skipLeavesOutTheFirstItems(count: number, expected: string): void {
    Assert.areEqual(expected, JSON.stringify(Enumerable.from([1, 2, 3]).skip(count).toArray()));
  }

  @TestMethod
  @TestData(-1, "[]")
  @TestData(0, "[]")
  @TestData(2, "[1,2]")
  @TestData(5, "[1,2,3]")
  public takeKeepsTheFirstItems(count: number, expected: string): void {
    Assert.areEqual(expected, JSON.stringify(Enumerable.from([1, 2, 3]).take(count).toArray()));
  }

  @TestMethod
  @TestData(-1, "[1,2,3]")
  @TestData(0, "[1,2,3]")
  @TestData(2, "[1]")
  @TestData(5, "[]")
  public skipLastLeavesOutTheLastItems(count: number, expected: string): void {
    Assert.areEqual(expected, JSON.stringify(Enumerable.from([1, 2, 3]).skipLast(count).toArray()));
  }

  @TestMethod
  @TestData(-1, "[]")
  @TestData(0, "[]")
  @TestData(2, "[2,3]")
  @TestData(5, "[1,2,3]")
  public takeLastKeepsTheLastItems(count: number, expected: string): void {
    Assert.areEqual(expected, JSON.stringify(Enumerable.from([1, 2, 3]).takeLast(count).toArray()));
  }

  @TestMethod
  @TestData(1.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  public countOperatorsRejectACountThatIsNotAnIntegerWhenCalled(count: number): void {
    const source = Enumerable.from([1, 2, 3]);
    const calls: readonly (() => void)[] = [() => source.skip(count), () => source.take(count), () => source.skipLast(count), () => source.takeLast(count)];

    for (const call of calls) {
      const exception = Assert.throws(call, ArgumentOutOfRangeException);

      Assert.areEqual("count", exception.parameterName);
      Assert.areEqual<unknown>(count, exception.actualValue);
    }
  }

  @TestMethod
  public skipWhileSkipsUntilThePredicateFirstFails(): void {
    let calls = 0;
    const remaining = Enumerable.from([1, 2, 5, 1, 6]).skipWhile(t => {
      calls++;

      return t < 3;
    });

    Assert.areEqual("[5,1,6]", JSON.stringify(remaining.toArray()));
    Assert.areEqual(3, calls);
  }

  @TestMethod
  public skipWhilePassesTheIndex(): void {
    Assert.areEqual("[5,1]", JSON.stringify(Enumerable.from([1, 2, 5, 1]).skipWhile((_item, index) => index < 2).toArray()));
  }

  @TestMethod
  public takeWhileTakesUntilThePredicateFirstFails(): void {
    Assert.areEqual("[1,2]", JSON.stringify(Enumerable.from([1, 2, 5, 1]).takeWhile(t => t < 3).toArray()));
    Assert.areEqual("[1,2]", JSON.stringify(Enumerable.from([1, 2]).takeWhile(t => t < 3).toArray()));
  }

  @TestMethod
  public takeWhilePassesTheIndex(): void {
    Assert.areEqual("[1]", JSON.stringify(Enumerable.from([1, 2, 5]).takeWhile((_item, index) => index < 1).toArray()));
  }

  @TestMethod
  public reverseYieldsTheItemsBackwardsAndLeavesTheSource(): void {
    const source = [1, 2, 3];

    Assert.areEqual("[3,2,1]", JSON.stringify(Enumerable.from(source).reverse().toArray()));
    Assert.areEqual("[1,2,3]", JSON.stringify(source));
  }

  @TestMethod
  public chunkSplitsIntoChunksOfTheSizeWithAShorterLastChunk(): void {
    Assert.areEqual("[[1,2],[3,4],[5]]", JSON.stringify(Enumerable.range(1, 5).chunk(2).toArray()));
    Assert.areEqual("[[1,2],[3,4]]", JSON.stringify(Enumerable.range(1, 4).chunk(2).toArray()));
    Assert.areEqual("[]", JSON.stringify(Enumerable.empty<number>().chunk(2).toArray()));
  }

  @TestMethod
  @TestData(0)
  @TestData(-1)
  @TestData(1.5)
  public chunkRejectsASizeThatIsNotAPositiveInteger(size: number): void {
    const exception = Assert.throws(() => Enumerable.from([1]).chunk(size), ArgumentOutOfRangeException);

    Assert.areEqual("size", exception.parameterName);
    Assert.areEqual<unknown>(size, exception.actualValue);
  }

  @TestMethod
  public zipCombinesItemsUntilTheShorterSequenceEnds(): void {
    Assert.areEqual("[\"1a\",\"2b\"]", JSON.stringify(Enumerable.from([1, 2, 3]).zip(["a", "b"], (number, letter) => `${number}${letter}`).toArray()));
    Assert.areEqual("[\"1a\"]", JSON.stringify(Enumerable.from([1]).zip(["a", "b"], (number, letter) => `${number}${letter}`).toArray()));
  }

  @TestMethod
  public zipClosesASequenceItStopsReading(): void {
    const sequence = new TrackedSequence([10, 20, 30]);

    const sums = Enumerable.from([1]).zip(sequence, (left, right) => left + right).toArray();

    Assert.areEqual("[11]", JSON.stringify(sums));
    Assert.isTrue(sequence.closed);
  }

  @TestMethod
  public zipStopsWhenASequenceEnds(): void {
    const sequence = new TrackedSequence([10]);

    const sums = Enumerable.from([1, 2, 3]).zip(sequence, (left, right) => left + right).toArray();

    Assert.areEqual("[11]", JSON.stringify(sums));
    Assert.isTrue(sequence.closed);
  }

  @TestMethod
  public firstReturnsTheFirstMatchingItem(): void {
    Assert.areEqual(1, Enumerable.from([1, 2, 3, 4]).first());
    Assert.areEqual(3, Enumerable.from([1, 2, 3, 4]).first(t => t > 2));
  }

  @TestMethod
  public firstReturnsAnItemThatIsUndefined(): void {
    Assert.isUndefined(Enumerable.from([undefined, 1]).first());
    Assert.isUndefined(Enumerable.from([1, undefined]).first(t => Object.isUndefined(t)));
  }

  @TestMethod
  public firstThrowsForAnEmptySequence(): void {
    const exception = Assert.throws(() => Enumerable.empty<number>().first(), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", exception.message);
  }

  @TestMethod
  public firstThrowsWhenNoItemMatches(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2]).first(t => t > 5), InvalidOperationException);

    Assert.areEqual("The sequence contains no matching element.", exception.message);
  }

  @TestMethod
  public firstOrDefaultReturnsUndefinedWhenNoItemMatches(): void {
    Assert.areEqual(1, Enumerable.from([1, 2]).firstOrDefault());
    Assert.areEqual(2, Enumerable.from([1, 2]).firstOrDefault(t => t > 1));
    Assert.isUndefined(Enumerable.empty<number>().firstOrDefault());
    Assert.isUndefined(Enumerable.from([1, 2]).firstOrDefault(t => t > 5));
  }

  @TestMethod
  public lastReturnsTheLastMatchingItem(): void {
    Assert.areEqual(4, Enumerable.from([1, 2, 3, 4]).last());
    Assert.areEqual(2, Enumerable.from([1, 2, 3, 4]).last(t => t < 3));
  }

  @TestMethod
  public lastReturnsAnItemThatIsUndefined(): void {
    Assert.isUndefined(Enumerable.from([1, undefined]).last());
    Assert.isUndefined(Enumerable.from([undefined, 1]).last(t => Object.isUndefined(t)));
  }

  @TestMethod
  public lastThrowsForAnEmptySequence(): void {
    const exception = Assert.throws(() => Enumerable.empty<number>().last(), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", exception.message);
  }

  @TestMethod
  public lastThrowsWhenNoItemMatches(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2]).last(t => t > 5), InvalidOperationException);

    Assert.areEqual("The sequence contains no matching element.", exception.message);
  }

  @TestMethod
  public lastOrDefaultReturnsUndefinedWhenNoItemMatches(): void {
    Assert.areEqual(2, Enumerable.from([1, 2]).lastOrDefault());
    Assert.areEqual(1, Enumerable.from([1, 2]).lastOrDefault(t => t < 2));
    Assert.isUndefined(Enumerable.empty<number>().lastOrDefault());
    Assert.isUndefined(Enumerable.from([1, 2]).lastOrDefault(t => t > 5));
  }

  @TestMethod
  public singleReturnsTheOnlyMatchingItem(): void {
    Assert.areEqual(7, Enumerable.from([7]).single());
    Assert.areEqual(2, Enumerable.from([1, 2, 3]).single(t => t === 2));
  }

  @TestMethod
  public singleReturnsAnItemThatIsUndefined(): void {
    Assert.isUndefined(Enumerable.from([undefined]).single());
    Assert.isUndefined(Enumerable.from([1, undefined]).single(t => Object.isUndefined(t)));
  }

  @TestMethod
  public singleThrowsForAnEmptySequence(): void {
    const exception = Assert.throws(() => Enumerable.empty<number>().single(), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", exception.message);
  }

  @TestMethod
  public singleThrowsWhenNoItemMatches(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2]).single(t => t > 5), InvalidOperationException);

    Assert.areEqual("The sequence contains no matching element.", exception.message);
  }

  @TestMethod
  public singleThrowsForMoreThanOneItem(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2]).single(), InvalidOperationException);

    Assert.areEqual("The sequence contains more than one element.", exception.message);
  }

  @TestMethod
  public singleThrowsForMoreThanOneMatchingItem(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2, 3]).single(t => t > 1), InvalidOperationException);

    Assert.areEqual("The sequence contains more than one matching element.", exception.message);
  }

  @TestMethod
  public singleOrDefaultReturnsUndefinedWhenNoItemMatches(): void {
    Assert.areEqual(5, Enumerable.from([5]).singleOrDefault());
    Assert.areEqual(2, Enumerable.from([1, 2]).singleOrDefault(t => t > 1));
    Assert.isUndefined(Enumerable.empty<number>().singleOrDefault());
    Assert.isUndefined(Enumerable.from([1, 2]).singleOrDefault(t => t > 5));
  }

  @TestMethod
  public singleOrDefaultThrowsForMoreThanOneItem(): void {
    const exception = Assert.throws(() => Enumerable.from([1, 2]).singleOrDefault(), InvalidOperationException);
    const matching = Assert.throws(() => Enumerable.from([1, 2]).singleOrDefault(t => t > 0), InvalidOperationException);

    Assert.areEqual("The sequence contains more than one element.", exception.message);
    Assert.areEqual("The sequence contains more than one matching element.", matching.message);
  }

  @TestMethod
  public singleAndSingleOrDefaultThrowForMoreThanOneItemThatIsUndefined(): void {
    const exception = Assert.throws(() => Enumerable.from([undefined, undefined]).single(), InvalidOperationException);
    const orDefault = Assert.throws(() => Enumerable.from([undefined, undefined]).singleOrDefault(), InvalidOperationException);

    Assert.areEqual("The sequence contains more than one element.", exception.message);
    Assert.areEqual("The sequence contains more than one element.", orDefault.message);
  }

  @TestMethod
  public elementAtReturnsTheItemAtTheIndex(): void {
    Assert.areEqual("b", Enumerable.from(["a", "b", "c"]).elementAt(1));
  }

  @TestMethod
  public elementAtReturnsAnItemThatIsUndefined(): void {
    Assert.isUndefined(Enumerable.from(["a", undefined]).elementAt(1));
  }

  @TestMethod
  @TestData(-1)
  @TestData(3)
  @TestData(0.5)
  public elementAtThrowsForAnIndexOutsideTheSequence(index: number): void {
    const exception = Assert.throws(() => Enumerable.from(["a", "b", "c"]).elementAt(index), ArgumentOutOfRangeException);

    Assert.areEqual("The argument must be within the valid range. (Parameter 'index')", exception.message);
    Assert.areEqual<unknown>(index, exception.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(0.5)
  public elementAtRejectsAPositionNoElementCanHaveWithoutReadingAnEndlessSequence(index: number): void {
    const exception = Assert.throws(() => Enumerable.from(EnumerableTests.naturals()).elementAt(index), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
  }

  @TestMethod
  public elementAtOrDefaultReturnsUndefinedOutsideTheSequence(): void {
    Assert.areEqual("c", Enumerable.from(["a", "b", "c"]).elementAtOrDefault(2));
    Assert.isUndefined(Enumerable.from(["a", "b", "c"]).elementAtOrDefault(3));
  }

  @TestMethod
  @TestData(-1)
  @TestData(0.5)
  public elementAtOrDefaultReturnsUndefinedForAPositionNoElementCanHaveWithoutReadingAnEndlessSequence(index: number): void {
    Assert.isUndefined(Enumerable.from(EnumerableTests.naturals()).elementAtOrDefault(index));
  }

  @TestMethod
  public anyFindsAnItemThatIsUndefined(): void {
    Assert.isTrue(Enumerable.from([undefined]).any());
    Assert.isTrue(Enumerable.from([1, undefined]).any(t => Object.isUndefined(t)));
  }

  @TestMethod
  public anyTellsWhetherAnItemMatches(): void {
    Assert.isFalse(Enumerable.empty<number>().any());
    Assert.isTrue(Enumerable.from([1]).any());
    Assert.isTrue(Enumerable.from([1, 6]).any(t => t > 5));
    Assert.isFalse(Enumerable.from([1, 2]).any(t => t > 5));
  }

  @TestMethod
  public allTellsWhetherEveryItemMatches(): void {
    Assert.isTrue(Enumerable.empty<number>().all(t => t > 5));
    Assert.isTrue(Enumerable.from([6, 7]).all(t => t > 5));
    Assert.isFalse(Enumerable.from([6, 1]).all(t => t > 5));
  }

  @TestMethod
  public containsFindsAnEqualItem(): void {
    Assert.isTrue(Enumerable.from([1, Number.NaN]).contains(Number.NaN));
    Assert.isFalse(Enumerable.from([1, 2]).contains(3));
  }

  @TestMethod
  public containsUsesTheComparer(): void {
    Assert.isTrue(Enumerable.from(["a", "b"]).contains("B", EnumerableTests.caseInsensitive));
    Assert.isFalse(Enumerable.from(["a", "b"]).contains("B"));
  }

  @TestMethod
  public countCountsAllOrTheMatchingItems(): void {
    Assert.areEqual(3, Enumerable.from([1, 2, 3]).count());
    Assert.areEqual(2, Enumerable.from([1, 2, 3]).count(t => t > 1));
    Assert.areEqual(0, Enumerable.empty<number>().count());
  }

  @TestMethod
  public sumAddsTheNumbers(): void {
    Assert.areEqual(6, Enumerable.from([1, 2, 3]).sum());
    Assert.areEqual(0, Enumerable.empty<number>().sum());
  }

  @TestMethod
  public sumAddsTheSelectedNumbers(): void {
    Assert.areEqual(3, Enumerable.from(["a", "bb"]).sum(t => t.length));
  }

  @TestMethod
  public sumThrowsForTheHoleOfASparseArray(): void {
    const exception = Assert.throws(() => Enumerable.from(new Array<number>(1)).sum(), InvalidOperationException);
    const selected = Assert.throws(() => Enumerable.from(new Array<number>(1)).sum(t => t), InvalidOperationException);

    Assert.areEqual("The sequence contains a value that is not a number.", exception.message);
    Assert.areEqual("The sequence contains a value that is not a number.", selected.message);
  }

  @TestMethod
  public averageDividesTheSumByTheCount(): void {
    Assert.areEqual(2.5, Enumerable.from([1, 2, 3, 4]).average());
    Assert.areEqual(2, Enumerable.from(["a", "bbb"]).average(t => t.length));
  }

  @TestMethod
  public averageThrowsForAnEmptySequence(): void {
    const exception = Assert.throws(() => Enumerable.empty<number>().average(), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", exception.message);
  }

  @TestMethod
  public averageThrowsForTheHoleOfASparseArray(): void {
    const exception = Assert.throws(() => Enumerable.from(new Array<number>(1)).average(), InvalidOperationException);
    const selected = Assert.throws(() => Enumerable.from(new Array<number>(1)).average(t => t), InvalidOperationException);

    Assert.areEqual("The sequence contains a value that is not a number.", exception.message);
    Assert.areEqual("The sequence contains a value that is not a number.", selected.message);
  }

  @TestMethod
  public minAndMaxUseTheDefaultComparer(): void {
    Assert.areEqual(1, Enumerable.from([3, 1, 2]).min());
    Assert.areEqual(3, Enumerable.from([3, 1, 2]).max());
    Assert.areEqual("a", Enumerable.from(["b", "a", "c"]).min());
    Assert.areEqual("c", Enumerable.from(["b", "a", "c"]).max());
  }

  @TestMethod
  public minAndMaxUseTheComparison(): void {
    Assert.areEqual(3, Enumerable.from([3, 1, 2]).min((left, right) => right - left));
    Assert.areEqual(1, Enumerable.from([3, 1, 2]).max((left, right) => right - left));
  }

  @TestMethod
  public minAndMaxOrderAnUndefinedItemFirst(): void {
    Assert.isUndefined(Enumerable.from([2, undefined, 1]).min());
    Assert.areEqual(2, Enumerable.from([undefined, 2, 1]).max());
  }

  @TestMethod
  public minAndMaxThrowForAnEmptySequence(): void {
    const min = Assert.throws(() => Enumerable.empty<number>().min(), InvalidOperationException);
    const max = Assert.throws(() => Enumerable.empty<number>().max(), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", min.message);
    Assert.areEqual("The sequence contains no elements.", max.message);
  }

  @TestMethod
  public minByAndMaxByReturnTheItemWithTheExtremeKey(): void {
    Assert.areEqual("a", Enumerable.from(["ccc", "a", "bb"]).minBy(t => t.length));
    Assert.areEqual("ccc", Enumerable.from(["bb", "ccc", "a"]).maxBy(t => t.length));
  }

  @TestMethod
  public minByAndMaxByKeepTheFirstOfEqualKeys(): void {
    Assert.areEqual("x", Enumerable.from(["x", "y"]).minBy(t => t.length));
    Assert.areEqual("ab", Enumerable.from(["ab", "cd", "e"]).maxBy(t => t.length));
  }

  @TestMethod
  public minByAndMaxByUseTheComparison(): void {
    Assert.areEqual("ccc", Enumerable.from(["a", "ccc", "bb"]).minBy(t => t.length, (left, right) => right - left));
    Assert.areEqual("a", Enumerable.from(["bb", "a", "ccc"]).maxBy(t => t.length, (left, right) => right - left));
  }

  @TestMethod
  public minByAndMaxByCloseASequenceWhoseKeyThrows(): void {
    const first = new TrackedSequence([1, 2]);
    const later = new TrackedSequence([1, 2]);

    Assert.throws(() => Enumerable.from(first).minBy(t => EnumerableTests.keyUnder(1, t)), InvalidOperationException);
    Assert.throws(() => Enumerable.from(later).maxBy(t => EnumerableTests.keyUnder(2, t)), InvalidOperationException);
    Assert.isTrue(first.closed);
    Assert.isTrue(later.closed);
  }

  @TestMethod
  public minByAndMaxByThrowForAnEmptySequence(): void {
    const min = Assert.throws(() => Enumerable.empty<string>().minBy(t => t.length), InvalidOperationException);
    const max = Assert.throws(() => Enumerable.empty<string>().maxBy(t => t.length), InvalidOperationException);

    Assert.areEqual("The sequence contains no elements.", min.message);
    Assert.areEqual("The sequence contains no elements.", max.message);
  }

  @TestMethod
  public aggregateFoldsTheItemsFromTheSeed(): void {
    Assert.areEqual(">123", Enumerable.from([1, 2, 3]).aggregate(">", (total, item) => `${total}${item}`));
    Assert.areEqual(">", Enumerable.empty<number>().aggregate(">", (total, item) => `${total}${item}`));
  }

  @TestMethod
  public sequenceEqualComparesItemByItem(): void {
    Assert.isTrue(Enumerable.from([1, 2, 3]).sequenceEqual([1, 2, 3]));
    Assert.isTrue(Enumerable.empty<number>().sequenceEqual([]));
    Assert.isFalse(Enumerable.from([1, 2, 3]).sequenceEqual([1, 9, 3]));
  }

  @TestMethod
  public sequenceEqualIsFalseForDifferentLengths(): void {
    Assert.isFalse(Enumerable.from([1, 2, 3]).sequenceEqual([1, 2]));
    Assert.isFalse(Enumerable.from([1, 2]).sequenceEqual([1, 2, 3]));
  }

  @TestMethod
  public sequenceEqualUsesTheComparer(): void {
    Assert.isTrue(Enumerable.from(["a", "B"]).sequenceEqual(["A", "b"], EnumerableTests.caseInsensitive));
    Assert.isFalse(Enumerable.from(["a", "B"]).sequenceEqual(["A", "b"]));
  }

  @TestMethod
  public sequenceEqualClosesAGeneratorItStopsReading(): void {
    const longer = new TrackedSequence([1, 2, 3]);
    const different = new TrackedSequence([1, 2, 3]);

    Assert.isFalse(Enumerable.from([1, 2]).sequenceEqual(longer));
    Assert.isFalse(Enumerable.from([1, 9]).sequenceEqual(different));
    Assert.isTrue(longer.closed);
    Assert.isTrue(different.closed);
  }

  @TestMethod
  public toArrayReturnsANewArrayEachTime(): void {
    const query = Enumerable.from([1, 2]);

    Assert.areNotEqual(query.toArray(), query.toArray());
    Assert.areEqual("[1,2]", JSON.stringify(query.toArray()));
  }

  private static keyUnder(limit: number, item: number): number {
    if (item >= limit)
      throw new InvalidOperationException("No key.");

    return item;
  }

  private static *naturals(): Generator<number> {
    for (let value = 0; ; value++)
      yield value;
  }
}
