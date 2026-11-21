/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Evaluation } from "../../fixtures/evaluation.fixture.js";

@TestClass
export class BinaryExpressionExtensionsTests {
  private static readonly CHAIN_LENGTH: number = 100_000;
  private static readonly NESTING_DEPTH: number = 1_000;

  private readonly failing: Expression = Expression.member(Expression.constant(null), "missing");

  @TestMethod
  public async appliesArithmeticToNumbersAndBigintsAsync(): Promise<void> {
    const operators = [BinaryOperator.Add, BinaryOperator.Subtract, BinaryOperator.Multiply, BinaryOperator.Divide];
    const numbers = await Promise.all(operators.map(t => this.applyAsync(t, 7, 2)));
    const bigints = await Promise.all(operators.map(t => this.applyAsync(t, 7n, 2n)));

    Assert.areEqual("9,5,14,3.5", numbers.join(","));
    Assert.areEqual("9,5,14,3", bigints.join(","));
    Assert.areEqual(9n, bigints[0]);
  }

  @TestMethod
  public async concatenatesAStringOnEitherSideOfPlusAsync(): Promise<void> {
    Assert.areEqual("a1", await this.applyAsync(BinaryOperator.Add, "a", 1));
    Assert.areEqual("1a", await this.applyAsync(BinaryOperator.Add, 1, "a"));
    Assert.areEqual("ab", await this.applyAsync(BinaryOperator.Add, "a", "b"));
  }

  @TestMethod
  public async rejectsOtherArithmeticOperandsAsync(): Promise<void> {
    const mixed = await Assert.throwsAsync(() => this.applyAsync(BinaryOperator.Add, 1, 1n), InvalidOperationException);
    await Assert.throwsAsync(() => this.applyAsync(BinaryOperator.Subtract, "a", 1), InvalidOperationException);

    Assert.areEqual("An arithmetic operator needs two numbers or two bigints, or, for +, a string on either side.", mixed.message);
  }

  @TestMethod
  public async comparesNumbersBigintsStringsAndDatesAsync(): Promise<void> {
    const operators = [BinaryOperator.LessThan, BinaryOperator.LessThanOrEqual, BinaryOperator.GreaterThan, BinaryOperator.GreaterThanOrEqual];
    const earlier = new Date(2026, 0, 1);
    const later = new Date(2026, 0, 2);

    Assert.areEqual("true,true,false,false", (await Promise.all(operators.map(t => this.applyAsync(t, 1, 2)))).join(","));
    Assert.areEqual("false,true,false,true", (await Promise.all(operators.map(t => this.applyAsync(t, 2n, 2)))).join(","));
    Assert.areEqual("false,false,true,true", (await Promise.all(operators.map(t => this.applyAsync(t, "b", "a")))).join(","));
    Assert.areEqual("true,true,false,false", (await Promise.all(operators.map(t => this.applyAsync(t, earlier, later)))).join(","));
  }

  @TestMethod
  public async rejectsOtherComparisonOperandsAsync(): Promise<void> {
    const mixed = await Assert.throwsAsync(() => this.applyAsync(BinaryOperator.LessThan, "1", 2), InvalidOperationException);

    Assert.areEqual("A comparison needs two numbers or bigints, two strings or two dates.", mixed.message);
  }

  @TestMethod
  public async testsEqualityWithoutConversionAsync(): Promise<void> {
    const value = new Date(2026, 0, 1);

    Assert.areEqual(true, await this.applyAsync(BinaryOperator.Equal, value, value));
    Assert.areEqual(false, await this.applyAsync(BinaryOperator.Equal, "1", 1));
    Assert.areEqual(true, await this.applyAsync(BinaryOperator.NotEqual, value, new Date(2026, 0, 1)));
  }

  @TestMethod
  public async evaluatesTheRightOperandOnlyWhenTheLeftDoesNotDecideAsync(): Promise<void> {
    Assert.areEqual(0, await this.evaluateAsync(BinaryOperator.And, [1, 0, this.failing]));
    Assert.areEqual(5, await this.evaluateAsync(BinaryOperator.And, [true, 5]));
    Assert.areEqual("a", await this.evaluateAsync(BinaryOperator.Or, [0, "a", this.failing]));
    Assert.areEqual(0, await this.evaluateAsync(BinaryOperator.Or, ["", 0]));
    Assert.areEqual(0, await this.evaluateAsync(BinaryOperator.Coalesce, [null, 0, this.failing]));
    Assert.isUndefined(await this.evaluateAsync(BinaryOperator.Coalesce, [null, undefined]));
  }

  @TestMethod
  public async evaluatesOtherOperatorsNestedToTheSupportedDepthAsync(): Promise<void> {
    let leftDeep: Expression = Evaluation.x;
    let rightDeep: Expression = Evaluation.x;
    for (let index = 0; index < BinaryExpressionExtensionsTests.NESTING_DEPTH; index++) {
      leftDeep = Expression.binary(BinaryOperator.Add, leftDeep, Expression.constant(1));
      rightDeep = Expression.binary(BinaryOperator.Subtract, Expression.constant(1), rightDeep);
    }

    Assert.areEqual(1_007, await Evaluation.evaluateAsync(leftDeep, 7));
    Assert.areEqual(7, await Evaluation.evaluateAsync(rightDeep, 7));
  }

  @TestMethod
  public async evaluatesALeftDeepChainOfAnyLengthAsync(): Promise<void> {
    let chain: Expression = Expression.binary(BinaryOperator.Equal, Evaluation.x, Expression.constant(0));
    for (let index = 1; index < BinaryExpressionExtensionsTests.CHAIN_LENGTH; index++)
      chain = Expression.binary(BinaryOperator.Or, chain, Expression.binary(BinaryOperator.Equal, Evaluation.x, Expression.constant(index)));

    Assert.areEqual(true, await Evaluation.evaluateAsync(chain, BinaryExpressionExtensionsTests.CHAIN_LENGTH - 1));
    Assert.areEqual(false, await Evaluation.evaluateAsync(chain, -1));
  }

  @TestMethod
  public async evaluatesARightDeepOrAlternatingChainOfAnyLengthAsync(): Promise<void> {
    let rightDeep: Expression = Expression.constant(BinaryExpressionExtensionsTests.CHAIN_LENGTH);
    let alternating: Expression = Expression.constant(null);
    for (let index = BinaryExpressionExtensionsTests.CHAIN_LENGTH - 1; index > 0; index--) {
      rightDeep = Expression.binary(BinaryOperator.And, Expression.constant(index), rightDeep);
      alternating = index % 2 === 0
        ? Expression.binary(BinaryOperator.Coalesce, alternating, Expression.constant(null))
        : Expression.binary(BinaryOperator.Coalesce, Expression.constant(null), alternating);
    }

    Assert.areEqual(BinaryExpressionExtensionsTests.CHAIN_LENGTH, await Evaluation.evaluateAsync(rightDeep));
    Assert.areEqual(7, await Evaluation.evaluateAsync(Expression.binary(BinaryOperator.Coalesce, alternating, Expression.constant(7))));
  }

  private applyAsync(operator: BinaryOperator, left: unknown, right: unknown): Promise<unknown> {
    return Evaluation.evaluateAsync(Expression.binary(operator, Expression.constant(left), Expression.constant(right)));
  }

  private evaluateAsync(operator: BinaryOperator, operands: readonly unknown[]): Promise<unknown> {
    const expressions = operands.map(t => t instanceof Expression ? t : Expression.constant(t));
    return Evaluation.evaluateAsync(expressions.reduce((left, right) => Expression.binary(operator, left, right)));
  }
}
