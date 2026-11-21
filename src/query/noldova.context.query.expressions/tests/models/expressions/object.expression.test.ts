/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ObjectExpressionTests {
  @TestMethod
  public rejectsTwoPropertiesOfTheSameName(): void {
    const value = Expression.constant(1);
    const exception = Assert.throws(() => Expression.object([Expression.property("a", value), Expression.property("a", value)]), ArgumentException);

    Assert.areEqual("properties", exception.parameterName);
    Assert.areEqual("An object cannot have two properties of the same name. (Parameter 'properties')", exception.message);
  }

  @TestMethod
  public writesItsPropertiesInOrder(): void {
    const person = Expression.parameter("person");
    const object = Expression.object([
      Expression.property("name", Expression.member(person, "name")),
      Expression.property("age", Expression.member(person, "age"))
    ]);

    Assert.areEqual("{}", Expression.object([]).toString());
    Assert.areEqual("{ name: person.name, age: person.age }", object.toString());
  }

  @TestMethod
  public replacesAPropertyOrItsValueAndKeepsItselfWhenNothingMatches(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    const first = Expression.property("first", a);
    const object = Expression.object([first, Expression.property("second", b)]);

    Assert.areEqual("{ first: b, second: b }", object.replace(a, b).toString());
    Assert.areEqual("{ other: a, second: b }", object.replace(first, Expression.property("other", a)).toString());
    Assert.areEqual(object, object.replace(Expression.parameter("c"), a));
  }

  @TestMethod
  public rejectsAReplacementThatIsNotAPropertyOrRepeatsAName(): void {
    const a = Expression.parameter("a");
    const first = Expression.property("first", a);
    const object = Expression.object([first, Expression.property("second", a)]);

    const notProperty = Assert.throws(() => object.replace(first, a), ArgumentException);
    const repeated = Assert.throws(() => object.replace(first, Expression.property("second", a)), ArgumentException);

    Assert.areEqual("replacement", notProperty.parameterName);
    Assert.areEqual("An object's property can only be replaced by a property. (Parameter 'replacement')", notProperty.message);
    Assert.areEqual("replacement", repeated.parameterName);
    Assert.areEqual("An object cannot have two properties of the same name. (Parameter 'replacement')", repeated.message);
  }
}
