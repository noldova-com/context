/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BinaryExpression, BinaryOperator, CallExpression, ConditionalExpression, ConstantExpression, Expression, LambdaExpression, MemberExpression,
  ObjectExpression, ParameterExpression, PropertyExpression, UnaryExpression, UnaryOperator
} from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ExpressionExtensionsTests {
  @TestMethod
  public buildsEachExpressionFromItsParts(): void {
    const value = new Date(0);
    const person = Expression.parameter("person");
    const name = Expression.member(person, "name");
    const prefix = Expression.constant(value);
    const not = Expression.unary(UnaryOperator.Not, person);
    const sum = Expression.binary(BinaryOperator.Add, name, prefix);
    const choice = Expression.conditional(person, name, prefix);
    const argumentExpressions = [prefix];
    const call = Expression.call(name, "startsWith", argumentExpressions);
    const property = Expression.property("name", name);
    const properties = [property];
    const object = Expression.object(properties);
    const parameters = [person];
    const lambda = Expression.lambda(parameters, object);

    Assert.isInstanceOf(person, ParameterExpression);
    Assert.areEqual("person", person.name);
    Assert.isInstanceOf(name, MemberExpression);
    Assert.areEqual(person, name.target);
    Assert.areEqual("name", name.name);
    Assert.isInstanceOf(prefix, ConstantExpression);
    Assert.areEqual(value, prefix.value);
    Assert.isInstanceOf(not, UnaryExpression);
    Assert.areEqual(UnaryOperator.Not, not.operator);
    Assert.areEqual(person, not.operand);
    Assert.isInstanceOf(sum, BinaryExpression);
    Assert.areEqual(BinaryOperator.Add, sum.operator);
    Assert.areEqual(name, sum.left);
    Assert.areEqual(prefix, sum.right);
    Assert.isInstanceOf(choice, ConditionalExpression);
    Assert.areEqual(person, choice.test);
    Assert.areEqual(name, choice.whenTrue);
    Assert.areEqual(prefix, choice.whenFalse);
    Assert.isInstanceOf(call, CallExpression);
    Assert.areEqual(name, call.target);
    Assert.areEqual("startsWith", call.name);
    Assert.areEqual(argumentExpressions, call.arguments);
    Assert.isInstanceOf(property, PropertyExpression);
    Assert.areEqual("name", property.name);
    Assert.areEqual(name, property.value);
    Assert.isInstanceOf(object, ObjectExpression);
    Assert.areEqual(properties, object.properties);
    Assert.isInstanceOf(lambda, LambdaExpression);
    Assert.areEqual(parameters, lambda.parameters);
    Assert.areEqual(object, lambda.body);
  }
}
