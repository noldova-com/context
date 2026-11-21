/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { BinaryOperator, Expression, LambdaExpression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LambdaExpressionTests {
  @TestMethod
  public rejectsTwoParametersOfTheSameName(): void {
    const a = Expression.parameter("a");
    const sameName = Assert.throws(() => Expression.lambda([a, Expression.parameter("a")], a), ArgumentException);
    const listedTwice = Assert.throws(() => Expression.lambda([a, a], a), ArgumentException);

    Assert.areEqual("parameters", sameName.parameterName);
    Assert.areEqual("A lambda cannot have two parameters of the same name. (Parameter 'parameters')", sameName.message);
    Assert.areEqual("parameters", listedTwice.parameterName);
  }

  @TestMethod
  public writesItsParametersAndBody(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");

    Assert.areEqual("() => 1", Expression.lambda([], Expression.constant(1)).toString());
    Assert.areEqual("a => a.age", Expression.lambda([a], Expression.member(a, "age")).toString());
    Assert.areEqual("(a, b) => a + b", Expression.lambda([a, b], Expression.binary(BinaryOperator.Add, a, b)).toString());
    Assert.areEqual("a => a ? 1 : 2", Expression.lambda([a], Expression.conditional(a, Expression.constant(1), Expression.constant(2))).toString());
    Assert.areEqual("a => b => a", Expression.lambda([a], Expression.lambda([b], a)).toString());
  }

  @TestMethod
  public parenthesizesABodyThatStartsWithAnObject(): void {
    const a = Expression.parameter("a");
    const object = Expression.object([Expression.property("value", a)]);

    Assert.areEqual("a => ({ value: a })", Expression.lambda([a], object).toString());
    Assert.areEqual("a => ({ value: a }.value)", Expression.lambda([a], Expression.member(object, "value")).toString());
    Assert.areEqual("a => ({})", Expression.lambda([a], Expression.object([])).toString());
  }

  @TestMethod
  public parenthesizesALambdaUsedAsAnOperand(): void {
    const a = Expression.parameter("a");
    const identity = Expression.lambda([a], a);

    Assert.areEqual("(a => a).length", Expression.member(identity, "length").toString());
    Assert.areEqual("(a => a) ?? a", Expression.binary(BinaryOperator.Coalesce, identity, a).toString());
  }

  @TestMethod
  public replacesAParameterThroughoutAndKeepsItselfWhenNothingMatches(): void {
    const first = Expression.parameter("person");
    const second = Expression.parameter("other");
    const limit = Expression.constant(18);
    const isAdult = Expression.lambda<(person: object) => boolean>([first],
      Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(first, "age"), limit));

    const replaced = isAdult.replace(first, second);

    Assert.isInstanceOf(replaced, LambdaExpression);
    Assert.areEqual(second, replaced.parameters[0]);
    Assert.areEqual("other => other.age >= 18", replaced.toString());
    Assert.areEqual("person => person.age >= 20", isAdult.replace(limit, Expression.constant(20)).toString());
    Assert.areEqual(isAdult, isAdult.replace(second, first));
  }

  @TestMethod
  public rejectsAReplacementThatIsNotAParameterOrRepeatsAName(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    const lambda = Expression.lambda([a, b], a);

    const notParameter = Assert.throws(() => lambda.replace(a, Expression.constant(1)), ArgumentException);
    const repeated = Assert.throws(() => lambda.replace(a, Expression.parameter("b")), ArgumentException);

    Assert.areEqual("replacement", notParameter.parameterName);
    Assert.areEqual("A lambda's parameter can only be replaced by a parameter. (Parameter 'replacement')", notParameter.message);
    Assert.areEqual("replacement", repeated.parameterName);
    Assert.areEqual("A lambda cannot have two parameters of the same name. (Parameter 'replacement')", repeated.message);
  }
}
