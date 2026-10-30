/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptConformanceUnitKind {
  public static readonly source: TypeScriptConformanceUnitKind = new TypeScriptConformanceUnitKind("Source", [".ts", ".mts", ".cts"], true, false);
  public static readonly environment: TypeScriptConformanceUnitKind = new TypeScriptConformanceUnitKind("Environment", [".json"], false, false);
  public static readonly javaScript: TypeScriptConformanceUnitKind = new TypeScriptConformanceUnitKind("JavaScript", [".js", ".jsx", ".cjs", ".mjs"], false, true);
  public static readonly jsx: TypeScriptConformanceUnitKind = new TypeScriptConformanceUnitKind("Jsx", [".tsx"], false, true);
  public static readonly other: TypeScriptConformanceUnitKind = new TypeScriptConformanceUnitKind("Other", [], false, true);

  private static readonly KINDS_BY_EXTENSION: readonly TypeScriptConformanceUnitKind[] = [
    TypeScriptConformanceUnitKind.source,
    TypeScriptConformanceUnitKind.environment,
    TypeScriptConformanceUnitKind.javaScript,
    TypeScriptConformanceUnitKind.jsx,
  ];

  public readonly name: string;
  public readonly isSource: boolean;
  public readonly isExcluded: boolean;
  private readonly extensions: readonly string[];

  private constructor(name: string, extensions: readonly string[], isSource: boolean, isExcluded: boolean) {
    this.name = name;
    this.extensions = extensions;
    this.isSource = isSource;
    this.isExcluded = isExcluded;
  }

  public static of(unitName: string): TypeScriptConformanceUnitKind {
    const lowerCaseName = unitName.toLowerCase();

    return TypeScriptConformanceUnitKind.KINDS_BY_EXTENSION.find(t => t.extensions.some(t => lowerCaseName.endsWith(t)))
      ?? TypeScriptConformanceUnitKind.other;
  }
}
