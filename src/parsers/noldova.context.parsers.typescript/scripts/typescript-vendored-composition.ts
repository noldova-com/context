/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JsonException, type JsonReader } from "@noldova/context.json";

import type TypeScriptDiagnosticDefinition from "./typescript-diagnostic-definition.ts";
import type TypeScriptVendoredCatalog from "./typescript-vendored-catalog.ts";

export default class TypeScriptVendoredComposition {
  private static readonly BASE: string = "classic";
  private static readonly INTEGERS_EXPECTED: string = "Expected an array of integers.";
  private static readonly KEY: string = "code";
  private static readonly OVERLAY: string = "native";

  public readonly base: string;
  public readonly overlay: string;
  public readonly key: string;
  public readonly overriddenCodes: readonly number[];
  public readonly entries: number;

  private constructor(base: string, overlay: string, key: string, overriddenCodes: readonly number[], entries: number) {
    this.base = base;
    this.overlay = overlay;
    this.key = key;
    this.overriddenCodes = overriddenCodes;
    this.entries = entries;
  }

  public static of(classic: TypeScriptVendoredCatalog, native: TypeScriptVendoredCatalog): TypeScriptVendoredComposition {
    return new TypeScriptVendoredComposition(
      TypeScriptVendoredComposition.BASE,
      TypeScriptVendoredComposition.OVERLAY,
      TypeScriptVendoredComposition.KEY,
      [...native.codes].filter(t => classic.codes.has(t)).sort((left, right) => left - right),
      TypeScriptVendoredComposition.effectiveDefinitions(classic, native).length);
  }

  public static effectiveDefinitions(classic: TypeScriptVendoredCatalog, native: TypeScriptVendoredCatalog): readonly TypeScriptDiagnosticDefinition[] {
    const definitions = new Map<number, TypeScriptDiagnosticDefinition>(classic.definitions.map(t => [t.code, t]));
    for (const definition of native.definitions)
      definitions.set(definition.code, definition);

    return [...definitions.values()].sort((left, right) => left.code - right.code);
  }

  public static read(reader: JsonReader): TypeScriptVendoredComposition {
    return new TypeScriptVendoredComposition(
      reader.readString("base"), reader.readString("overlay"), reader.readString("key"), TypeScriptVendoredComposition.readIntegers(reader, "overriddenCodes"), reader.readInteger("entries"));
  }

  private static readIntegers(reader: JsonReader, name: string): readonly number[] {
    const values = reader.readValue(name);
    if (!Array.isArray(values) || !values.every(t => Number.isInteger(t)))
      throw new JsonException(TypeScriptVendoredComposition.INTEGERS_EXPECTED, `${reader.path}.${name}`);

    return values as readonly number[];
  }
}
