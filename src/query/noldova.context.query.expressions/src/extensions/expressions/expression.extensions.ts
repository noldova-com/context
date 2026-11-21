/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BinaryOperator } from "../../enums/binary-operator.js";
import type { UnaryOperator } from "../../enums/unary-operator.js";
import { BinaryExpression } from "../../models/expressions/binary.expression.js";
import { CallExpression } from "../../models/expressions/call.expression.js";
import { ConditionalExpression } from "../../models/expressions/conditional.expression.js";
import { ConstantExpression } from "../../models/expressions/constant.expression.js";
import { Expression } from "../../models/expressions/expression.js";
import { LambdaExpression } from "../../models/expressions/lambda.expression.js";
import { MemberExpression } from "../../models/expressions/member.expression.js";
import { ObjectExpression } from "../../models/expressions/object.expression.js";
import { ParameterExpression } from "../../models/expressions/parameter.expression.js";
import { PropertyExpression } from "../../models/expressions/property.expression.js";
import { UnaryExpression } from "../../models/expressions/unary.expression.js";
import type { LambdaFunction } from "../../types/lambda-function.js";

declare module "../../models/expressions/expression.js" {
  namespace Expression {
    let constant: (value: unknown) => ConstantExpression;
    let parameter: (name: string) => ParameterExpression;
    let member: (target: Expression, name: string) => MemberExpression;
    let unary: (operator: UnaryOperator, operand: Expression) => UnaryExpression;
    let binary: (operator: BinaryOperator, left: Expression, right: Expression) => BinaryExpression;
    let conditional: (test: Expression, whenTrue: Expression, whenFalse: Expression) => ConditionalExpression;
    let call: (target: Expression, name: string, argumentExpressions: readonly Expression[]) => CallExpression;
    let object: (properties: readonly PropertyExpression[]) => ObjectExpression;
    let property: (name: string, value: Expression) => PropertyExpression;
    let lambda: <TFunction extends LambdaFunction = LambdaFunction>(parameters: readonly ParameterExpression[], body: Expression) => LambdaExpression<TFunction>;
  }
}

Expression.constant = (value: unknown): ConstantExpression => new ConstantExpression(value);

Expression.parameter = (name: string): ParameterExpression => new ParameterExpression(name);

Expression.member = (target: Expression, name: string): MemberExpression => new MemberExpression(target, name);

Expression.unary = (operator: UnaryOperator, operand: Expression): UnaryExpression => new UnaryExpression(operator, operand);

Expression.binary = (operator: BinaryOperator, left: Expression, right: Expression): BinaryExpression => new BinaryExpression(operator, left, right);

Expression.conditional = (test: Expression, whenTrue: Expression, whenFalse: Expression): ConditionalExpression =>
  new ConditionalExpression(test, whenTrue, whenFalse);

Expression.call = (target: Expression, name: string, argumentExpressions: readonly Expression[]): CallExpression =>
  new CallExpression(target, name, argumentExpressions);

Expression.object = (properties: readonly PropertyExpression[]): ObjectExpression => new ObjectExpression(properties);

Expression.property = (name: string, value: Expression): PropertyExpression => new PropertyExpression(name, value);

Expression.lambda = <TFunction extends LambdaFunction = LambdaFunction>(parameters: readonly ParameterExpression[], body: Expression): LambdaExpression<TFunction> =>
  new LambdaExpression<TFunction>(parameters, body);
