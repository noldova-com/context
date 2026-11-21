/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable, HashSet, ReadOnlySet } from "@noldova/context.collections";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";

@TestClass
export class ReadOnlySetTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public readsTheItemsOfItsSet(): void {
    const view = new HashSet([1, 2]).asReadOnly();

    Assert.isInstanceOf(view, ReadOnlySet);
    Assert.areEqual("[1,2]", JSON.stringify(view.toArray()));
    Assert.isTrue(view.contains(2));
    Assert.isFalse(view.contains(3));
  }

  @TestMethod
  public containsUsesTheComparerOfItsSetOrTheOneItIsGiven(): void {
    const view = new HashSet(["a"], ReadOnlySetTests.caseInsensitive).asReadOnly();
    const plain = new HashSet(["a"]).asReadOnly();

    Assert.isTrue(view.contains("A"));
    Assert.isFalse(plain.contains("A"));
    Assert.isTrue(plain.contains("A", ReadOnlySetTests.caseInsensitive));
  }

  @TestMethod
  public countsAllOrTheMatchingItemsOfItsSet(): void {
    const view = new HashSet([1, 2, 3]).asReadOnly();

    Assert.areEqual(3, view.count());
    Assert.areEqual(1, view.count(t => t > 2));
  }

  @TestMethod
  public comparesItsSetWithAnother(): void {
    const view = new HashSet([1, 2]).asReadOnly();

    Assert.isTrue(view.isSubsetOf([1, 2, 3]));
    Assert.isFalse(view.isSubsetOf([1]));
    Assert.isTrue(view.isSupersetOf([2]));
    Assert.isFalse(view.isSupersetOf([3]));
    Assert.isTrue(view.overlaps([2, 3]));
    Assert.isFalse(view.overlaps([3]));
    Assert.isTrue(view.setEquals([2, 1]));
    Assert.isFalse(view.setEquals([1, 3]));
  }

  @TestMethod
  public showsLaterChangesToItsSet(): void {
    const set = new HashSet([1]);
    const view = set.asReadOnly();

    set.add(2);

    Assert.areEqual(2, view.count());
    Assert.isTrue(view.contains(2));
  }

  @TestMethod
  public enumeratesWithTheChecksOfItsSet(): void {
    const set = new HashSet([1, 2]);
    const view = set.asReadOnly();
    const enumerateWhileAdding = (): void => {
      for (const item of view)
        set.add(item + 10);
    };

    Assert.throws(enumerateWhileAdding, InvalidOperationException);
  }

  @TestMethod
  public cannotBeTurnedBackIntoTheSet(): void {
    const view = new HashSet([1]).asReadOnly();

    Assert.isFalse(view instanceof HashSet);
    Assert.isFalse("add" in view);
    Assert.isInstanceOf(view, Enumerable);
  }
}
