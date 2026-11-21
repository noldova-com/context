/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DefaultEqualityComparer } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Person } from "../fixtures/person.fixture.js";

@TestClass
export class DefaultEqualityComparerTests {
  private static readonly comparer: DefaultEqualityComparer = new DefaultEqualityComparer();

  @TestMethod
  public callsSameValuesEqual(): void {
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(1, 1));
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals("text", "text"));
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(null, null));
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(undefined, undefined));
  }

  @TestMethod
  public callsDifferentValuesUnequal(): void {
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(1, 2));
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(1, "1"));
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(null, undefined));
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(Number.NaN, 1));
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(1, Number.NaN));
  }

  @TestMethod
  public callsNaNEqualToNaN(): void {
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(Number.NaN, Number.NaN));
  }

  @TestMethod
  public callsTheZerosEqual(): void {
    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(0, -0));
  }

  @TestMethod
  public comparesObjectsByReference(): void {
    const person = new Person(1, "Ann");

    Assert.isTrue(DefaultEqualityComparerTests.comparer.equals(person, person));
    Assert.isFalse(DefaultEqualityComparerTests.comparer.equals(person, new Person(1, "Ann")));
  }

  @TestMethod
  public hashIsTheFnv1aHashOfTheText(): void {
    Assert.areEqual(2166136261, DefaultEqualityComparerTests.comparer.hash(""));
    Assert.areEqual(3826002220, DefaultEqualityComparerTests.comparer.hash("a"));
  }

  @TestMethod
  public hashesAPrimitiveByItsText(): void {
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("12"), DefaultEqualityComparerTests.comparer.hash(12));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("12"), DefaultEqualityComparerTests.comparer.hash(12n));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("true"), DefaultEqualityComparerTests.comparer.hash(true));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("null"), DefaultEqualityComparerTests.comparer.hash(null));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("undefined"), DefaultEqualityComparerTests.comparer.hash(undefined));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash("Symbol(name)"), DefaultEqualityComparerTests.comparer.hash(Symbol("name")));
    Assert.areNotEqual(DefaultEqualityComparerTests.comparer.hash("a"), DefaultEqualityComparerTests.comparer.hash("b"));
  }

  @TestMethod
  public hashesEqualNumbersAlike(): void {
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash(Number.NaN), DefaultEqualityComparerTests.comparer.hash(Number.NaN));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash(0), DefaultEqualityComparerTests.comparer.hash(-0));
  }

  @TestMethod
  public givesEachObjectItsOwnStableHash(): void {
    const first = new Person(1, "Ann");
    const second = new Person(1, "Ann");
    const action = (): number => 1;

    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash(first), DefaultEqualityComparerTests.comparer.hash(first));
    Assert.areEqual(DefaultEqualityComparerTests.comparer.hash(action), DefaultEqualityComparerTests.comparer.hash(action));
    Assert.areNotEqual(DefaultEqualityComparerTests.comparer.hash(first), DefaultEqualityComparerTests.comparer.hash(second));
    Assert.areNotEqual(DefaultEqualityComparerTests.comparer.hash(first), DefaultEqualityComparerTests.comparer.hash(action));
  }

  @TestMethod
  public numbersObjectsApartFromAnotherComparer(): void {
    const first = new Person(1, "Ann");
    const second = new Person(2, "Bob");

    Assert.areEqual(new DefaultEqualityComparer().hash(first), new DefaultEqualityComparer().hash(second));
  }
}
