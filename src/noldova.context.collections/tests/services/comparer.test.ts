/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Comparer } from "@noldova/context.collections";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { Person } from "../fixtures/person.fixture.js";

@TestClass
export class ComparerTests {
  @TestMethod
  @TestData(1, 2, -1)
  @TestData(2, 1, 1)
  @TestData(1, 1, 0)
  @TestData(-0, 0, 0)
  @TestData(Number.NEGATIVE_INFINITY, -1, -1)
  @TestData("a", "b", -1)
  @TestData("b", "a", 1)
  @TestData("a", "a", 0)
  @TestData("B", "a", -1)
  @TestData(false, true, -1)
  @TestData(true, false, 1)
  @TestData(true, true, 0)
  public comparesTwoValuesOfTheSameType(left: unknown, right: unknown, expected: number): void {
    Assert.areEqual(expected, Comparer.compare(left, right));
  }

  @TestMethod
  public comparesBigints(): void {
    Assert.areEqual(-1, Comparer.compare(1n, 2n));
    Assert.areEqual(1, Comparer.compare(2n, 1n));
    Assert.areEqual(0, Comparer.compare(2n, 2n));
  }

  @TestMethod
  public comparesDatesByTheirTime(): void {
    Assert.areEqual(-1, Comparer.compare(new Date(1000), new Date(2000)));
    Assert.areEqual(1, Comparer.compare(new Date(2000), new Date(1000)));
    Assert.areEqual(0, Comparer.compare(new Date(1000), new Date(1000)));
  }

  @TestMethod
  public putsNaNBeforeEveryOtherNumber(): void {
    Assert.areEqual(0, Comparer.compare(Number.NaN, Number.NaN));
    Assert.areEqual(-1, Comparer.compare(Number.NaN, Number.NEGATIVE_INFINITY));
    Assert.areEqual(1, Comparer.compare(Number.NEGATIVE_INFINITY, Number.NaN));
    Assert.areEqual(0, Comparer.compare(new Date(Number.NaN), new Date(Number.NaN)));
  }

  @TestMethod
  public putsUndefinedFirstAndNullSecond(): void {
    Assert.areEqual(-1, Comparer.compare<unknown>(undefined, null));
    Assert.areEqual(1, Comparer.compare<unknown>(null, undefined));
    Assert.areEqual(-1, Comparer.compare<unknown>(undefined, 1));
    Assert.areEqual(1, Comparer.compare<unknown>("a", undefined));
    Assert.areEqual(-1, Comparer.compare<unknown>(null, Number.NaN));
    Assert.areEqual(1, Comparer.compare<unknown>(false, null));
    Assert.areEqual(0, Comparer.compare<unknown>(undefined, undefined));
    Assert.areEqual(0, Comparer.compare<unknown>(null, null));
  }

  @TestMethod
  @TestData(1, "1")
  @TestData(1n, 1)
  @TestData("1", 1)
  @TestData(true, 1)
  @TestData(new Date(1000), 1000)
  @TestData(new Person(1, "Ann"), new Person(2, "Bob"))
  @TestData([1], [2])
  public throwsForValuesItCannotCompare(left: unknown, right: unknown): void {
    const exception = Assert.throws(() => Comparer.compare(left, right), ArgumentException);

    Assert.areEqual("Only two numbers, bigints, booleans, strings or Dates, or null or undefined, can be compared. (Parameter 'left')", exception.message);
    Assert.areEqual("left", exception.parameterName);
  }

  @TestMethod
  public callsTheSameObjectEqualWithoutComparingIt(): void {
    const person = new Person(1, "Ann");

    Assert.areEqual(0, Comparer.compare(person, person));
  }

  @TestMethod
  public descendingReversesAComparison(): void {
    const descending = Comparer.descending<number>(Comparer.compare);

    Assert.areEqual(1, descending(1, 2));
    Assert.areEqual(-1, descending(2, 1));
    Assert.areEqual(0, descending(2, 2));
  }

  @TestMethod
  public descendingPassesTheArgumentsSwapped(): void {
    const calls: string[] = [];
    const descending = Comparer.descending((left: string, right: string): number => {
      calls.push(`${left}${right}`);

      return 0;
    });

    descending("a", "b");

    Assert.areEqual("ba", calls.join(","));
  }
}
