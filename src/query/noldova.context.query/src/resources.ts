/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly arithmeticOperandsInvalid: string = "An arithmetic operator needs two numbers or two bigints, or, for +, a string on either side.";
  public static readonly comparisonOperandsInvalid: string = "A comparison needs two numbers or bigints, two strings or two dates.";
  public static readonly expressionNotEvaluable: string = "This expression can only be evaluated as part of its parent.";
  public static readonly memberOfNullOrUndefined: string = "A member cannot be read from null or undefined.";
  public static readonly methodNotFunction: string = "The call's target has no method of that name.";
  public static readonly parameterUnbound: string = "A parameter can only be used inside the lambda that declares it.";
}
