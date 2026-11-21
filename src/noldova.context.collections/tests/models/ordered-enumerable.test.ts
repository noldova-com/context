/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Comparer, Enumerable } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class OrderedEnumerableTests {
  @TestMethod
  public sortsWithEachComparisonInTurn(): void {
    const ordered = Enumerable.from(["bb", "a", "ab", "b"]).orderBy(t => t.length).thenBy(t => t, Comparer.compare);

    Assert.areEqual("[\"a\",\"b\",\"ab\",\"bb\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public keepsItemsWithEqualKeysInSourceOrder(): void {
    const ordered = Enumerable.from(["b1", "a0", "c1", "d0"]).orderBy(t => t.charAt(1));

    Assert.areEqual("[\"a0\",\"d0\",\"b1\",\"c1\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public sortsUndefinedFirstUnderTheDefaultComparer(): void {
    const ascending = Enumerable.from<number | undefined>([2, undefined, 1]).orderBy(t => t).toArray();
    const descending = Enumerable.from<number | undefined>([2, undefined, 1]).orderByDescending(t => t).toArray();

    Assert.areEqual(3, ascending.length);
    Assert.isUndefined(ascending[0]);
    Assert.areEqual(1, ascending[1]);
    Assert.areEqual(2, ascending[2]);
    Assert.areEqual(3, descending.length);
    Assert.areEqual(2, descending[0]);
    Assert.areEqual(1, descending[1]);
    Assert.isUndefined(descending[2]);
  }

  @TestMethod
  public sortsNullAfterUndefinedAndBeforeValues(): void {
    const ordered = Enumerable.from<string | null | undefined>(["b", null, undefined, "a"]).orderBy(t => t).toArray();

    Assert.isUndefined(ordered[0]);
    Assert.isNull(ordered[1]);
    Assert.areEqual("a", ordered[2]);
    Assert.areEqual("b", ordered[3]);
  }

  @TestMethod
  public thenByBreaksTiesOfTheEarlierKeys(): void {
    const ordered = Enumerable.from(["bb", "a", "ab", "b"]).orderBy(t => t.length).thenBy(t => t);

    Assert.areEqual("[\"a\",\"b\",\"ab\",\"bb\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public thenByUsesTheComparison(): void {
    const ordered = Enumerable.from(["bb", "a", "ab", "b"]).orderBy(t => t.length).thenBy(t => t, (left, right) => Comparer.compare(right, left));

    Assert.areEqual("[\"b\",\"a\",\"bb\",\"ab\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public thenByDescendingBreaksTiesInReverse(): void {
    const ordered = Enumerable.from(["bb", "a", "ab", "b"]).orderBy(t => t.length).thenByDescending(t => t);

    Assert.areEqual("[\"b\",\"a\",\"bb\",\"ab\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public thenByDescendingReversesTheComparison(): void {
    const ordered = Enumerable.from(["bb", "a", "ab", "b"]).orderBy(t => t.length).thenByDescending(t => t, (left, right) => Comparer.compare(right, left));

    Assert.areEqual("[\"a\",\"b\",\"ab\",\"bb\"]", JSON.stringify(ordered.toArray()));
  }

  @TestMethod
  public thenByLeavesTheEarlierOrderingUnchanged(): void {
    const byLength = Enumerable.from(["bb", "b", "ab", "a"]).orderBy(t => t.length);

    byLength.thenBy(t => t).toArray();

    Assert.areEqual("[\"b\",\"a\",\"bb\",\"ab\"]", JSON.stringify(byLength.toArray()));
  }

  @TestMethod
  public callsEachKeyOnceForEachElement(): void {
    let lengthCalls = 0;
    let textCalls = 0;
    const ordered = Enumerable.from(["bb", "a", "ab", "b", "ba", "aa"])
      .orderBy(t => {
        lengthCalls++;
        return t.length;
      })
      .thenByDescending(t => {
        textCalls++;
        return t;
      });

    Assert.areEqual("[\"b\",\"a\",\"bb\",\"ba\",\"ab\",\"aa\"]", JSON.stringify(ordered.toArray()));
    Assert.areEqual(6, lengthCalls);
    Assert.areEqual(6, textCalls);
  }

  @TestMethod
  public sortsTheSourceAsItIsWhenEnumerated(): void {
    const source = [3, 1];
    const ordered = Enumerable.from(source).orderBy(t => t);

    source.push(2);

    Assert.areEqual("[1,2,3]", JSON.stringify(ordered.toArray()));
    Assert.areEqual("[3,1,2]", JSON.stringify(source));
  }
}
