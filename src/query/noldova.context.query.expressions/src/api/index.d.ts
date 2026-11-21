/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The operator of a {@link UnaryExpression}.
 */
export declare enum UnaryOperator {
  /**
   * Logical negation, written `!operand`.
   */
  Not = "Not"
}

/**
 * The operator of a {@link BinaryExpression}. `And`, `Or` and `Coalesce`
 * evaluate their right operand only when the left one doesn't decide the result.
 */
export declare enum BinaryOperator {
  /**
   * Addition or string concatenation, written `left + right`.
   */
  Add = "Add",
  /**
   * Subtraction, written `left - right`.
   */
  Subtract = "Subtract",
  /**
   * Multiplication, written `left * right`.
   */
  Multiply = "Multiply",
  /**
   * Division, written `left / right`.
   */
  Divide = "Divide",
  /**
   * Strict equality, written `left === right`.
   */
  Equal = "Equal",
  /**
   * Strict inequality, written `left !== right`.
   */
  NotEqual = "NotEqual",
  /**
   * Written `left < right`.
   */
  LessThan = "LessThan",
  /**
   * Written `left <= right`.
   */
  LessThanOrEqual = "LessThanOrEqual",
  /**
   * Written `left > right`.
   */
  GreaterThan = "GreaterThan",
  /**
   * Written `left >= right`.
   */
  GreaterThanOrEqual = "GreaterThanOrEqual",
  /**
   * Short-circuit logical conjunction, written `left && right`.
   */
  And = "And",
  /**
   * Short-circuit logical disjunction, written `left || right`.
   */
  Or = "Or",
  /**
   * The left operand unless it is null or undefined, written `left ?? right`.
   */
  Coalesce = "Coalesce"
}

/**
 * The base of every node in an expression tree. A tree describes code as data:
 * a query provider runs it, translates it to another language such as SQL, or
 * rejects what it can't translate.
 *
 * Expressions are immutable. They are built with the static factories on this
 * class, and an operation returns a new tree that shares every unchanged
 * subtree. Parameters are bound by identity, not by name: two parameters with
 * the same name are different parameters. Only this package's expressions
 * extend `Expression`.
 *
 * A chain of binary operators can be of any length and shape. Other nesting,
 * such as `!` inside `!` or a lambda inside a call, is supported to 1,000
 * levels; a deeper tree may exceed the host's stack.
 *
 * This package owns the expression classes and the operations every consumer
 * needs: {@link Expression.toString} and {@link Expression.replace}. A package
 * that runs or translates expressions adds its operation as an extension
 * method on `Expression`, with the base defining the default for nodes the
 * operation doesn't support, and overrides on each concrete expression.
 *
 * @example
 * ```ts
 * import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
 *
 * class Person {
 *   public readonly age: number;
 *
 *   public constructor(age: number) {
 *     this.age = age;
 *   }
 * }
 *
 * const person = Expression.parameter("person");
 * const isAdult = Expression.lambda<(person: Person) => boolean>([person],
 *   Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(person, "age"), Expression.constant(18)));
 *
 * isAdult.toString(); // "person => person.age >= 18"
 * ```
 */
export declare abstract class Expression {
  /**
   * Initializes the shared expression state.
   */
  protected constructor();

  /**
   * Creates a constant: a value captured when the tree was built.
   *
   * @param value Any value, including null and undefined; it is retained
   * unchanged, not copied.
   * @returns A new constant expression.
   * @see {@link ConstantExpression} for an example.
   */
  public static constant(value: unknown): ConstantExpression;

  /**
   * Creates a parameter, for use in a lambda's parameter list and in its body.
   *
   * @param name The name the parameter is written with.
   * @returns A new parameter, distinct from every other parameter of the same name.
   * @throws {ArgumentException} If `name` is empty or whitespace.
   * @see {@link Expression} for an example.
   */
  public static parameter(name: string): ParameterExpression;

  /**
   * Creates a read of a property or field.
   *
   * @param target The expression whose member is read.
   * @param name The member's name.
   * @returns A new member expression.
   * @throws {ArgumentException} If `name` is empty or whitespace.
   * @see {@link Expression} for an example.
   */
  public static member(target: Expression, name: string): MemberExpression;

  /**
   * Creates an operation on one operand.
   *
   * @param operator The operator to apply.
   * @param operand The operand.
   * @returns A new unary expression.
   * @see {@link UnaryExpression} for an example.
   */
  public static unary(operator: UnaryOperator, operand: Expression): UnaryExpression;

  /**
   * Creates an operation on two operands.
   *
   * @param operator The operator to apply.
   * @param left The left operand.
   * @param right The right operand.
   * @returns A new binary expression.
   * @see {@link Expression} for an example.
   */
  public static binary(operator: BinaryOperator, left: Expression, right: Expression): BinaryExpression;

  /**
   * Creates a choice between two expressions, written `test ? whenTrue : whenFalse`.
   *
   * @param test The condition.
   * @param whenTrue The result when the condition is truthy.
   * @param whenFalse The result when the condition is falsy.
   * @returns A new conditional expression.
   */
  public static conditional(test: Expression, whenTrue: Expression, whenFalse: Expression): ConditionalExpression;

  /**
   * Creates a method call, such as `name.startsWith("A")`.
   *
   * @param target The expression whose method is called.
   * @param name The method's name.
   * @param argumentExpressions The arguments in order. An empty array is valid.
   * The array is retained, not copied; the caller must not change it afterwards.
   * @returns A new call expression.
   * @throws {ArgumentException} If `name` is empty or whitespace.
   * @see {@link CallExpression} for an example.
   */
  public static call(target: Expression, name: string, argumentExpressions: readonly Expression[]): CallExpression;

  /**
   * Creates an object literal, the usual result of a projection such as
   * `person => ({ name: person.name })`.
   *
   * @param properties The properties in order. An empty array is valid.
   * The array is retained, not copied; the caller must not change it afterwards.
   * @returns A new object expression.
   * @throws {ArgumentException} If two properties have the same name.
   * @see {@link ObjectExpression} for an example.
   */
  public static object(properties: readonly PropertyExpression[]): ObjectExpression;

  /**
   * Creates one property of an object literal.
   *
   * @param name The property's name.
   * @param value The property's value.
   * @returns A new property expression.
   * @throws {ArgumentException} If `name` is empty or whitespace.
   * @see {@link ObjectExpression} for an example.
   */
  public static property(name: string, value: Expression): PropertyExpression;

  /**
   * Creates a function with a parameter list and a body. The body may use the
   * lambda's own parameters and those of the lambdas around it.
   *
   * @template TFunction The function type the lambda describes.
   * @param parameters The parameters in order. An empty array is valid.
   * The array is retained, not copied; the caller must not change it afterwards.
   * @param body The body, an expression whose value the function returns.
   * @returns A new lambda expression.
   * @throws {ArgumentException} If two parameters have the same name, as one
   * parameter listed twice does.
   * @see {@link Expression} for an example.
   */
  public static lambda<TFunction extends LambdaFunction = LambdaFunction>(parameters: readonly ParameterExpression[],
    body: Expression): LambdaExpression<TFunction>;

  /**
   * Replaces one expression throughout this tree. Queries are combined this way:
   * the parameter of one lambda is replaced by the parameter of another, so
   * that both bodies read the same parameter.
   *
   * @param target The expression to replace, found by identity.
   * @param replacement The expression to put in its place.
   * @returns A tree with every occurrence of `target` replaced, sharing every
   * subtree that doesn't contain it; this same expression when `target` doesn't
   * occur, or `replacement` when this expression is `target`.
   * @throws {ArgumentException} If `target` is in a lambda's parameter list and
   * `replacement` is not a {@link ParameterExpression}; if `target` is a property
   * of an object literal and `replacement` is not a {@link PropertyExpression}; or
   * if the result would give a lambda two parameters, or an object two
   * properties, of the same name.
   * @example
   * ```ts
   * import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
   *
   * const first = Expression.parameter("person");
   * const second = Expression.parameter("person");
   * const isNamed = Expression.binary(BinaryOperator.NotEqual, Expression.member(second, "name"), Expression.constant(null));
   *
   * const combined = isNamed.replace(second, first);
   * console.assert(combined !== isNamed);
   * console.assert(isNamed.replace(Expression.parameter("other"), first) === isNamed);
   * combined.toString(); // "person.name !== null"
   * ```
   */
  public replace(target: Expression, replacement: Expression): Expression;

  /**
   * Writes the expression as TypeScript source, for diagnostics and messages.
   * Operators are parenthesized only where precedence requires it. A constant
   * is written as a literal when it is a string, number, big integer, Boolean,
   * null or undefined, a function or class by its name, such as `Point`, and
   * any other value by its class name in brackets, such as `[Person]`.
   *
   * @returns The source text. Two different trees can have the same text, such
   * as two constants holding different objects of one class.
   * @see {@link Expression} for an example.
   */
  public toString(): string;
}

/**
 * The type of every function a {@link LambdaExpression} can describe.
 */
export declare type LambdaFunction = (...parameters: never[]) => unknown;

/**
 * A value captured when the tree was built, such as a literal or a variable's
 * value at that time.
 *
 * @example
 * ```ts
 * import { Expression } from "@noldova/context.query.expressions";
 *
 * Expression.constant("Ada").toString(); // "\"Ada\""
 * Expression.constant(10n).toString(); // "10n"
 * ```
 */
export declare class ConstantExpression extends Expression {
  /**
   * The captured value, retained unchanged.
   */
  public readonly value: unknown;

  private constructor();
}

/**
 * A parameter of a {@link LambdaExpression}. It is bound by identity: the body
 * reads the parameter only through this same instance.
 */
export declare class ParameterExpression extends Expression {
  /**
   * The name the parameter is written with.
   */
  public readonly name: string;

  private constructor();
}

/**
 * A read of a property or field, such as `person.age`.
 */
export declare class MemberExpression extends Expression {
  /**
   * The expression whose member is read.
   */
  public readonly target: Expression;

  /**
   * The member's name.
   */
  public readonly name: string;

  private constructor();
}

/**
 * An operation on one operand, such as `!person.isActive`.
 *
 * @example
 * ```ts
 * import { Expression, UnaryOperator } from "@noldova/context.query.expressions";
 *
 * const person = Expression.parameter("person");
 * Expression.unary(UnaryOperator.Not, Expression.member(person, "isActive")).toString(); // "!person.isActive"
 * ```
 */
export declare class UnaryExpression extends Expression {
  /**
   * The operator applied.
   */
  public readonly operator: UnaryOperator;

  /**
   * The operand.
   */
  public readonly operand: Expression;

  private constructor();
}

/**
 * An operation on two operands, such as `person.age >= 18`.
 */
export declare class BinaryExpression extends Expression {
  /**
   * The operator applied.
   */
  public readonly operator: BinaryOperator;

  /**
   * The left operand.
   */
  public readonly left: Expression;

  /**
   * The right operand.
   */
  public readonly right: Expression;

  private constructor();
}

/**
 * A choice between two expressions, such as `person.age >= 18 ? "adult" : "minor"`.
 */
export declare class ConditionalExpression extends Expression {
  /**
   * The condition.
   */
  public readonly test: Expression;

  /**
   * The result when the condition is truthy.
   */
  public readonly whenTrue: Expression;

  /**
   * The result when the condition is falsy.
   */
  public readonly whenFalse: Expression;

  private constructor();
}

/**
 * A method call, such as `person.name.startsWith("A")`. A provider decides
 * which methods it supports; translating to SQL, for example, `startsWith`
 * on a string becomes a `LIKE` pattern.
 *
 * @example
 * ```ts
 * import { Expression } from "@noldova/context.query.expressions";
 *
 * const person = Expression.parameter("person");
 * const name = Expression.member(person, "name");
 * Expression.call(name, "startsWith", [Expression.constant("A")]).toString(); // "person.name.startsWith(\"A\")"
 * ```
 */
export declare class CallExpression extends Expression {
  /**
   * The expression whose method is called.
   */
  public readonly target: Expression;

  /**
   * The method's name.
   */
  public readonly name: string;

  /**
   * The arguments in order.
   */
  public readonly arguments: readonly Expression[];

  private constructor();
}

/**
 * An object literal, such as `{ name: person.name, age: person.age }`.
 *
 * @example
 * ```ts
 * import { Expression } from "@noldova/context.query.expressions";
 *
 * const person = Expression.parameter("person");
 * const summary = Expression.lambda([person], Expression.object([
 *   Expression.property("name", Expression.member(person, "name")),
 *   Expression.property("age", Expression.member(person, "age"))
 * ]));
 *
 * summary.toString(); // "person => ({ name: person.name, age: person.age })"
 * ```
 */
export declare class ObjectExpression extends Expression {
  /**
   * The properties in order, each with a distinct name.
   */
  public readonly properties: readonly PropertyExpression[];

  private constructor();
}

/**
 * One property of an {@link ObjectExpression}.
 */
export declare class PropertyExpression extends Expression {
  /**
   * The property's name.
   */
  public readonly name: string;

  /**
   * The property's value.
   */
  public readonly value: Expression;

  private constructor();
}

/**
 * A function with a parameter list and a body, such as `person => person.age >= 18`.
 * Queries take their predicates, keys and projections as lambdas.
 *
 * @template TFunction The function type the lambda describes, such as
 * `(person: Person) => boolean` for a predicate.
 * @see {@link Expression} for an example.
 */
export declare class LambdaExpression<TFunction extends LambdaFunction = LambdaFunction> extends Expression {
  /**
   * The parameters in order, each with a distinct name.
   */
  public readonly parameters: readonly ParameterExpression[];

  /**
   * The body, an expression whose value the function returns.
   */
  public readonly body: Expression;

  private constructor();
}
