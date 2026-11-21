/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DefaultEqualityComparer, EqualityComparers, KeyEqualityComparer } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CaseInsensitiveComparer } from "../fixtures/case-insensitive-comparer.fixture.js";
import { Person } from "../fixtures/person.fixture.js";

@TestClass
export class EqualityComparersTests {
  private static readonly caseInsensitive: CaseInsensitiveComparer = new CaseInsensitiveComparer();

  @TestMethod
  public defaultIsOneDefaultEqualityComparer(): void {
    Assert.isInstanceOf(EqualityComparers.default, DefaultEqualityComparer);
    Assert.areEqual(EqualityComparers.default, EqualityComparers.default);
  }

  @TestMethod
  public byComparesTheKeysWithTheDefaultComparer(): void {
    const comparer = EqualityComparers.by((t: Person) => t.id);

    Assert.isInstanceOf(comparer, KeyEqualityComparer);

    Assert.isTrue(comparer.equals(new Person(1, "Ann"), new Person(1, "Bob")));
    Assert.isFalse(comparer.equals(new Person(1, "Ann"), new Person(2, "Ann")));
    Assert.areEqual(EqualityComparers.default.hash(1), comparer.hash(new Person(1, "Ann")));
  }

  @TestMethod
  public byComparesTheKeysWithTheGivenComparer(): void {
    const comparer = EqualityComparers.by((t: Person) => t.name, EqualityComparersTests.caseInsensitive);

    Assert.isTrue(comparer.equals(new Person(1, "Ann"), new Person(2, "aNN")));
    Assert.isFalse(comparer.equals(new Person(1, "Ann"), new Person(1, "Bob")));
    Assert.areEqual(3, comparer.hash(new Person(1, "Ann")));
  }
}
