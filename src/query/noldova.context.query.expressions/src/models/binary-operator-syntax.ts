/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ExpressionPrecedence } from "../enums/expression-precedence.js";

export class BinaryOperatorSyntax {
  public readonly token: string;
  public readonly precedence: ExpressionPrecedence;

  public constructor(token: string, precedence: ExpressionPrecedence) {
    this.token = token;
    this.precedence = precedence;
  }
}
