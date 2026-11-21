/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import { InMemoryQueryProvider, type Queryable } from "@noldova/context.query";
import { BinaryOperator, ConstantExpression, Expression, type LambdaExpression, type ParameterExpression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Person } from "../fixtures/person.fixture.js";

@TestClass
export class QueryableTests {
  private readonly person: ParameterExpression = Expression.parameter("p");
  private readonly adult: LambdaExpression<(person: Person) => boolean> = Expression.lambda([this.person],
    Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(this.person, "age"), Expression.constant(18)));
  private readonly age: LambdaExpression<(person: Person) => number> = Expression.lambda([this.person], Expression.member(this.person, "age"));
  private readonly name: LambdaExpression<(person: Person) => string> = Expression.lambda([this.person], Expression.member(this.person, "name"));
  private readonly people: Person[] = [new Person("Ana", 34), new Person("Ion", 17), new Person("Eva", 34), new Person("Dan", 51), new Person("Bob", 17)];

  @TestMethod
  public addsOneCallPerOperatorAndLeavesTheSourceUnchanged(): void {
    const people = new InMemoryQueryProvider().from(this.people);
    const query = people.where(this.adult).orderBy(this.age).thenByDescending(this.name).skip(1).take(2).select(this.name);
    const descending = people.orderByDescending(this.age).thenBy(this.name);

    Assert.areEqual(`${people.expression}.where(p => p.age >= 18).orderBy(p => p.age).thenByDescending(p => p.name).skip(1).take(2).select(p => p.name)`, query.expression.toString());
    Assert.areEqual(`${people.expression}.orderByDescending(p => p.age).thenBy(p => p.name)`, descending.expression.toString());
    Assert.areEqual(people.provider, query.provider);
    Assert.isTrue(people.expression instanceof ConstantExpression);
  }

  @TestMethod
  public async runsItsOperatorsInMemoryAsync(): Promise<void> {
    const people = new InMemoryQueryProvider().from(this.people);

    Assert.areEqual("Eva,Ana,Dan", (await people.where(this.adult).orderBy(this.age).thenByDescending(this.name).select(this.name).toArrayAsync()).join(","));
    Assert.areEqual("Ana,Eva", (await people.orderByDescending(this.age).thenBy(this.name).skip(1).take(2).select(this.name).toArrayAsync()).join(","));
  }

  @TestMethod
  public async returnsEachResultAsync(): Promise<void> {
    const people = new InMemoryQueryProvider().from(this.people);
    const adults = people.where(this.adult);
    const none = people.take(0);
    const one = people.take(1);

    Assert.areEqual(this.people[0], await adults.firstAsync());
    Assert.areEqual(this.people[0], await adults.firstOrDefaultAsync());
    Assert.isUndefined(await none.firstOrDefaultAsync());
    Assert.areEqual(this.people[0], await one.singleAsync());
    Assert.areEqual(this.people[0], await one.singleOrDefaultAsync());
    Assert.isUndefined(await none.singleOrDefaultAsync());
    Assert.isTrue(await adults.anyAsync());
    Assert.isFalse(await none.anyAsync());
    Assert.areEqual(3, await adults.countAsync());
  }

  @TestMethod
  public async rejectsAMissingOrRepeatedResultAsync(): Promise<void> {
    const people = new InMemoryQueryProvider().from(this.people);

    await Assert.throwsAsync(() => people.take(0).firstAsync(), InvalidOperationException);
    await Assert.throwsAsync(() => people.singleAsync(), InvalidOperationException);
  }

  @TestMethod
  public async iteratesItsItemsWithForAwaitAsync(): Promise<void> {
    const names: string[] = [];
    for await (const name of new InMemoryQueryProvider().from(this.people).where(this.adult).select(this.name))
      names.push(name);

    Assert.areEqual("Ana,Eva,Dan", names.join(","));
  }

  @TestMethod
  public async awaitsAPromiseItemInForAwaitButNotInToArrayAsync(): Promise<void> {
    const item = Promise.resolve(1);
    const query = new InMemoryQueryProvider().from([item]);
    const items: unknown[] = [];
    for await (const value of query)
      items.push(value);

    Assert.areEqual(1, items[0]);
    Assert.areEqual(item, (await query.toArrayAsync())[0]);
  }

  @TestMethod
  public async readsTheSourceEachTimeItRunsAsync(): Promise<void> {
    const numbers = [1, 2];
    const query: Queryable<number> = new InMemoryQueryProvider().from(numbers);

    Assert.areEqual(2, await query.countAsync());
    numbers.push(3);
    Assert.areEqual(3, await query.countAsync());
  }
}
