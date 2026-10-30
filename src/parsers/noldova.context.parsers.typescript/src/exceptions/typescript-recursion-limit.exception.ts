/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../resources.js";
import { TypeScriptParserException } from "./typescript-parser.exception.js";

export class TypeScriptRecursionLimitException extends TypeScriptParserException {
  public readonly span: SourceSpan;

  public constructor(span: SourceSpan) {
    super(Resources.parserRecursionLimitExceeded);
    this.span = span;
  }
}
