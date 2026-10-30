/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptDiagnosticDefinitionCategory from "./typescript-diagnostic-definition-category.ts";

export default class TypeScriptDiagnosticDefinition {
  public readonly messageTemplate: string;
  public readonly code: number;
  public readonly category: TypeScriptDiagnosticDefinitionCategory;
  public readonly reportsUnnecessary: boolean;
  public readonly reportsDeprecated: boolean;

  public constructor(
    messageTemplate: string,
    code: number,
    category: TypeScriptDiagnosticDefinitionCategory,
    reportsUnnecessary: boolean,
    reportsDeprecated: boolean) {
    this.messageTemplate = messageTemplate;
    this.code = code;
    this.category = category;
    this.reportsUnnecessary = reportsUnnecessary;
    this.reportsDeprecated = reportsDeprecated;
  }
}
