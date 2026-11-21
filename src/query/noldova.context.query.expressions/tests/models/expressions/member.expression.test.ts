/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Expression, MemberExpression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class MemberExpressionTests {
  @TestMethod
  public rejectsABlankName(): void {
    Assert.areEqual("name", Assert.throws(() => Expression.member(Expression.parameter("person"), " "), ArgumentException).parameterName);
  }

  @TestMethod
  public writesAnIdentifierAfterADot(): void {
    const person = Expression.parameter("person");

    Assert.areEqual("person.name", Expression.member(person, "name").toString());
    Assert.areEqual("person.$id_2", Expression.member(person, "$id_2").toString());
    Assert.areEqual("person.prénom", Expression.member(person, "prénom").toString());
    Assert.areEqual("person.address.city", Expression.member(Expression.member(person, "address"), "city").toString());
  }

  @TestMethod
  public writesAnyOtherNameInBrackets(): void {
    const person = Expression.parameter("person");

    Assert.areEqual("person[\"first-name\"]", Expression.member(person, "first-name").toString());
    Assert.areEqual("person[\"1st\"]", Expression.member(person, "1st").toString());
  }

  @TestMethod
  public replacesItsTargetAndKeepsItselfWhenNothingMatches(): void {
    const person = Expression.parameter("person");
    const other = Expression.parameter("other");
    const name = Expression.member(person, "name");

    const replaced = name.replace(person, other);

    Assert.isInstanceOf(replaced, MemberExpression);
    Assert.areEqual(other, replaced.target);
    Assert.areEqual("name", replaced.name);
    Assert.areEqual(name, name.replace(other, person));
  }
}
