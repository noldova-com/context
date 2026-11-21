/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, Enumerable, Grouping, HashSet, List, OrderedEnumerable } from "@noldova/context.collections";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";

@TestClass
export class EnumerableExtensionsTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public orderBySortsByTheKeyAscending(): void {
    const ordered = Enumerable.from(["bb", "a", "ccc"]).orderBy(t => t.length);

    Assert.isInstanceOf(ordered, OrderedEnumerable);
    Assert.areEqual("[\"a\",\"bb\",\"ccc\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public orderByUsesTheComparison(): void {
    Assert.areEqual("[3,2,1]", JSON.stringify(Enumerable.from([1, 3, 2]).orderBy(t => t, (left, right) => right - left).toArray()));
  }

  @TestMethod
  public orderByDescendingSortsByTheKeyDescending(): void {
    const ordered = Enumerable.from(["bb", "a", "ccc"]).orderByDescending(t => t.length);

    Assert.isInstanceOf(ordered, OrderedEnumerable);
    Assert.areEqual("[\"ccc\",\"bb\",\"a\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public orderByDescendingReversesTheComparison(): void {
    Assert.areEqual("[1,2,3]", JSON.stringify(Enumerable.from([1, 3, 2]).orderByDescending(t => t, (left, right) => right - left).toArray()));
  }

  @TestMethod
  public orderByDescendingKeepsItemsWithEqualKeysInSourceOrder(): void {
    Assert.areEqual("[\"b1\",\"c1\",\"a0\",\"d0\"]", JSON.stringify(Enumerable.from(["b1", "a0", "c1", "d0"]).orderByDescending(t => t.charAt(1)).toArray()));
  }

  @TestMethod
  public groupByGroupsItemsByKeyInFirstSeenOrder(): void {
    const groups = Enumerable.from(["apple", "bean", "avocado", "corn", "banana"]).groupBy(t => t.charAt(0));

    Assert.areEqual(
      "[\"a:apple|avocado\",\"b:bean|banana\",\"c:corn\"]",
      JSON.stringify(groups.select(t => `${t.key}:${t.toArray().join("|")}`).toArray()));
  }

  @TestMethod
  public groupByYieldsGroupings(): void {
    const group = Enumerable.from([1]).groupBy(t => t % 2).first();

    Assert.isInstanceOf(group, Grouping);
    Assert.areEqual(1, group.key);
  }

  @TestMethod
  public groupByKeepsTheFirstKeyOfKeysTheComparerCallsEqual(): void {
    const groups = Enumerable.from(["a1", "A2", "b1", "B2", "cc"]).groupBy(t => t.charAt(0), EnumerableExtensionsTests.caseInsensitive);

    Assert.areEqual("[\"a:a1|A2\",\"b:b1|B2\",\"c:cc\"]", JSON.stringify(groups.select(t => `${t.key}:${t.toArray().join("|")}`).toArray()));
  }

  @TestMethod
  public groupByGroupsOnlyWhenEnumeratedAndAgainEachTime(): void {
    let calls = 0;
    const groups = Enumerable.from([1, 2, 3]).groupBy(t => {
      calls++;

      return t % 2;
    });

    Assert.areEqual(0, calls);
    Assert.areEqual(2, groups.count());
    Assert.areEqual(3, calls);
    Assert.areEqual(2, groups.count());
    Assert.areEqual(6, calls);
  }

  @TestMethod
  public toListCopiesTheItemsIntoANewList(): void {
    const source = [1, 2];
    const list = Enumerable.from(source).toList();

    list.add(3);

    Assert.isInstanceOf(list, List);
    Assert.areEqual("[1,2,3]", JSON.stringify(list.toArray()));
    Assert.areEqual("[1,2]", JSON.stringify(source));
  }

  @TestMethod
  public toHashSetDropsEqualItems(): void {
    const set = Enumerable.from([1, 2, 1]).toHashSet();

    Assert.isInstanceOf(set, HashSet);
    Assert.areEqual("[1,2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public toHashSetUsesTheComparer(): void {
    const set = Enumerable.from(["a", "A", "b"]).toHashSet(EnumerableExtensionsTests.caseInsensitive);

    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(set.toArray()));
    Assert.isTrue(set.contains("B"));
  }

  @TestMethod
  public toDictionaryMapsEachItemsKeyToItsValue(): void {
    const dictionary = Enumerable.from(["a", "bb"]).toDictionary(t => t, t => t.length);

    Assert.isInstanceOf(dictionary, Dictionary);
    Assert.areEqual("[{\"key\":\"a\",\"value\":1},{\"key\":\"bb\",\"value\":2}]", JSON.stringify(dictionary.toArray()));
  }

  @TestMethod
  public toDictionaryUsesTheComparer(): void {
    const dictionary = Enumerable.from(["a", "bb"]).toDictionary(t => t, t => t.length, EnumerableExtensionsTests.caseInsensitive);

    Assert.areEqual(2, dictionary.get("BB"));
  }

  @TestMethod
  public toDictionaryThrowsForADuplicateKey(): void {
    const exception = Assert.throws(() => Enumerable.from(["a", "A"]).toDictionary(t => t, t => t.length, EnumerableExtensionsTests.caseInsensitive), ArgumentException);

    Assert.areEqual("An entry with the same key already exists. (Parameter 'key')", exception.message);
    Assert.areEqual("key", exception.parameterName);
  }
}
