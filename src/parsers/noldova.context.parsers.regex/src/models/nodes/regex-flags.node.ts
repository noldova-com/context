/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

import { Resources } from "../../resources.js";

export class RegexFlagsNode extends ValueNode {
  public readonly hasIndices: boolean;
  public readonly global: boolean;
  public readonly ignoreCase: boolean;
  public readonly multiline: boolean;
  public readonly dotAll: boolean;
  public readonly unicode: boolean;
  public readonly unicodeSets: boolean;
  public readonly sticky: boolean;

  public constructor(value: string, span: SourceSpan) {
    super(value, span);
    this.hasIndices = value.includes(Resources.hasIndicesFlag);
    this.global = value.includes(Resources.globalFlag);
    this.ignoreCase = value.includes(Resources.ignoreCaseFlag);
    this.multiline = value.includes(Resources.multilineFlag);
    this.dotAll = value.includes(Resources.dotAllFlag);
    this.unicode = value.includes(Resources.unicodeFlag);
    this.unicodeSets = value.includes(Resources.unicodeSetsFlag);
    this.sticky = value.includes(Resources.stickyFlag);
  }
}
