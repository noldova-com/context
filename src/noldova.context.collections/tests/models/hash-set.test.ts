/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EqualityComparers, HashSet } from "@noldova/context.collections";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";

@TestClass
export class HashSetTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public startsEmptyByDefault(): void {
    Assert.areEqual(0, new HashSet<number>().count());
  }

  @TestMethod
  public keepsTheFirstOfEqualItemsInOrder(): void {
    const set = new HashSet([3, 1, 3, Number.NaN, 2, Number.NaN]);

    Assert.areEqual(4, set.count());
    Assert.areEqual("[3,1,null,2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public countsAllOrTheMatchingItems(): void {
    const set = new HashSet([1, 2, 3]);

    Assert.areEqual(3, set.count());
    Assert.areEqual(2, set.count(t => t > 1));
  }

  @TestMethod
  public addReturnsWhetherTheItemWasNew(): void {
    const set = new HashSet([1]);

    Assert.isTrue(set.add(2));
    Assert.isFalse(set.add(1));
    Assert.areEqual("[1,2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public removeReturnsWhetherTheItemWasPresent(): void {
    const set = new HashSet([1, 2]);

    Assert.isTrue(set.remove(1));
    Assert.isFalse(set.remove(1));
    Assert.areEqual("[2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public clearRemovesEveryItem(): void {
    const set = new HashSet([1, 2]);

    set.clear();

    Assert.areEqual(0, set.count());
    Assert.isFalse(set.contains(1));
  }

  @TestMethod
  public containsTellsWhetherTheItemIsPresent(): void {
    const set = new HashSet([1, Number.NaN]);

    Assert.isTrue(set.contains(Number.NaN));
    Assert.isFalse(set.contains(2));
  }

  @TestMethod
  public containsUsesTheSetsComparer(): void {
    const set = new HashSet(["a", "b"], HashSetTests.caseInsensitive);

    Assert.isTrue(set.contains("B"));
    Assert.isFalse(set.contains("c"));
    Assert.isFalse(set.contains("bb"));
  }

  @TestMethod
  public containsUsesAComparerItIsGiven(): void {
    const set = new HashSet(["a", "b"], HashSetTests.caseInsensitive);

    Assert.isFalse(set.contains("B", EqualityComparers.default));
    Assert.isTrue(new HashSet(["a", "b"]).contains("B", HashSetTests.caseInsensitive));
  }

  @TestMethod
  public findsAndRemovesItemsWithTheComparer(): void {
    const set = new HashSet(["a", "B"], HashSetTests.caseInsensitive);

    Assert.isFalse(set.add("A"));
    Assert.isFalse(set.remove("c"));
    Assert.isFalse(set.remove("cc"));
    Assert.isTrue(set.remove("A"));
    Assert.isTrue(set.remove("b"));
    Assert.isFalse(set.remove("b"));
    Assert.isTrue(set.add("C"));
    Assert.areEqual("[\"C\"]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public unionWithAddsTheOtherItems(): void {
    const set = new HashSet([1, 2]);

    set.unionWith([2, 3, 3]);

    Assert.areEqual("[1,2,3]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public unionWithItselfChangesNothing(): void {
    const set = new HashSet([1, 2]);

    set.unionWith(set);

    Assert.areEqual("[1,2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public intersectWithKeepsOnlyTheItemsAlsoInTheOther(): void {
    const set = new HashSet([1, 2, 3]);

    set.intersectWith([3, 1, 4]);

    Assert.areEqual("[1,3]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public intersectWithItselfChangesNothing(): void {
    const set = new HashSet([1, 2]);

    set.intersectWith(set);

    Assert.areEqual("[1,2]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public exceptWithRemovesTheOtherItems(): void {
    const set = new HashSet([1, 2, 3]);

    set.exceptWith([2, 4]);

    Assert.areEqual("[1,3]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public exceptWithItselfRemovesEveryItem(): void {
    const set = new HashSet([1, 2]);

    set.exceptWith(set);

    Assert.areEqual(0, set.count());
  }

  @TestMethod
  public symmetricExceptWithKeepsTheItemsInExactlyOneOfTheTwo(): void {
    const set = new HashSet([1, 2, 3]);

    set.symmetricExceptWith([3, 4, 4]);

    Assert.areEqual("[1,2,4]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public symmetricExceptWithItselfRemovesEveryItem(): void {
    const set = new HashSet([1, 2]);

    set.symmetricExceptWith(set);

    Assert.areEqual(0, set.count());
  }

  @TestMethod
  public isSubsetOfTellsWhetherEveryItemIsInTheOther(): void {
    const set = new HashSet([1, 2]);

    Assert.isTrue(set.isSubsetOf([2, 1, 3]));
    Assert.isFalse(set.isSubsetOf([1, 4]));
    Assert.isTrue(set.isSubsetOf(set));
    Assert.isTrue(new HashSet<number>().isSubsetOf([]));
  }

  @TestMethod
  public isSupersetOfTellsWhetherEveryOtherItemIsInTheSet(): void {
    const set = new HashSet([1, 2, 3]);

    Assert.isTrue(set.isSupersetOf([3, 1, 1]));
    Assert.isFalse(set.isSupersetOf([1, 4]));
    Assert.isTrue(set.isSupersetOf([]));
    Assert.isTrue(set.isSupersetOf(set));
  }

  @TestMethod
  public overlapsTellsWhetherAnyOtherItemIsInTheSet(): void {
    const set = new HashSet([1, 2]);

    Assert.isTrue(set.overlaps([3, 2]));
    Assert.isFalse(set.overlaps([3]));
    Assert.isFalse(set.overlaps([]));
    Assert.isTrue(set.overlaps(set));
  }

  @TestMethod
  public setEqualsTellsWhetherBothHoldTheSameItems(): void {
    const set = new HashSet([1, 2]);

    Assert.isTrue(set.setEquals([2, 1, 1]));
    Assert.isFalse(set.setEquals([1]));
    Assert.isFalse(set.setEquals([1, 3]));
    Assert.isTrue(set.setEquals(set));
  }

  @TestMethod
  public setOperationsCompareWithTheSetsComparer(): void {
    const set = new HashSet(["a", "B"], HashSetTests.caseInsensitive);

    Assert.isTrue(set.isSubsetOf(["A", "b", "c"]));
    Assert.isTrue(set.isSupersetOf(["b"]));
    Assert.isTrue(set.overlaps(["A"]));
    Assert.isTrue(set.setEquals(["A", "b"]));
  }

  @TestMethod
  public unionWithUsesTheSetsComparer(): void {
    const set = new HashSet(["a", "B"], HashSetTests.caseInsensitive);

    set.unionWith(["A", "dd"]);

    Assert.areEqual("[\"a\",\"B\",\"dd\"]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public intersectWithUsesTheSetsComparer(): void {
    const set = new HashSet(["a", "B", "c"], HashSetTests.caseInsensitive);

    set.intersectWith(["A", "C"]);

    Assert.areEqual("[\"a\",\"c\"]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public exceptWithUsesTheSetsComparer(): void {
    const set = new HashSet(["a", "B"], HashSetTests.caseInsensitive);

    set.exceptWith(["b"]);

    Assert.areEqual("[\"a\"]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public symmetricExceptWithUsesTheSetsComparer(): void {
    const set = new HashSet(["a", "B"], HashSetTests.caseInsensitive);

    set.symmetricExceptWith(["A", "C", "c"]);

    Assert.areEqual("[\"B\",\"C\"]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public changingTheSetWhileEnumeratingItThrows(): void {
    const set = new HashSet([1, 2]);
    const enumerateWhileAdding = (): void => {
      for (const item of set)
        set.add(item + 10);
    };

    const exception = Assert.throws(enumerateWhileAdding, InvalidOperationException);

    Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    Assert.areEqual("[1,2,11]", JSON.stringify(set.toArray()));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((set: HashSet<number>) => void)[] = [
      t => t.add(9),
      t => t.remove(1),
      t => t.clear(),
      t => t.unionWith([9]),
      t => t.intersectWith([1]),
      t => t.exceptWith([1]),
      t => t.symmetricExceptWith([9])
    ];

    for (const change of changes) {
      const set = new HashSet([1, 2]);
      const iterator = set[Symbol.iterator]();
      iterator.next();

      change(set);

      Assert.throws(() => iterator.next(), InvalidOperationException);
    }
  }

  @TestMethod
  public anAttemptThatChangesNothingLeavesAnEnumerationRunning(): void {
    const set = new HashSet([1, 2]);
    const items: number[] = [];

    for (const item of set) {
      set.add(1);
      set.remove(9);
      set.unionWith([2]);
      set.intersectWith([1, 2]);
      set.exceptWith([9]);
      items.push(item);
    }

    Assert.areEqual("[1,2]", JSON.stringify(items));
  }
}
