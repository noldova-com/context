/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import TypeScriptScriptException from "./typescript-script.exception.ts";

export default class TypeScriptDiagnosticDefinitionCategory {
  private static readonly CATEGORIES: readonly TypeScriptDiagnosticDefinitionCategory[] = ["Error", "Message", "Suggestion", "Warning"]
    .map(t => new TypeScriptDiagnosticDefinitionCategory(t));

  public readonly name: string;

  private constructor(name: string) {
    this.name = name;
  }

  public static of(name: string): TypeScriptDiagnosticDefinitionCategory {
    const category = TypeScriptDiagnosticDefinitionCategory.CATEGORIES.find(t => t.name === name);
    if (Object.isUndefined(category))
      throw new TypeScriptScriptException(TypeScriptDiagnosticDefinitionCategory.unknownCategory(name));

    return category;
  }

  private static unknownCategory(name: string): string {
    return `Unknown diagnostic category "${name}".`;
  }
}
