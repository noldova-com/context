/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { JsonReader } from "@noldova/context.json";

import TypeScriptDiagnosticDefinitionCategory from "./typescript-diagnostic-definition-category.ts";
import TypeScriptDiagnosticDefinition from "./typescript-diagnostic-definition.ts";

export default class TypeScriptVendoredCatalog {
  private static readonly CATEGORY_PROPERTY_NAME: string = "category";
  private static readonly CODE_PROPERTY_NAME: string = "code";
  private static readonly COMPATIBILITY_PYRAMID_PROPERTY_NAME: string = "elidedInCompatabilityPyramid";
  private static readonly LOCALE_NOTES_PROPERTY_NAME: string = "_locale_notes";
  private static readonly REPORTS_DEPRECATED_PROPERTY_NAME: string = "reportsDeprecated";
  private static readonly REPORTS_UNNECESSARY_PROPERTY_NAME: string = "reportsUnnecessary";
  private static readonly ALLOWED_DEFINITION_FIELDS: readonly string[] = [
    TypeScriptVendoredCatalog.LOCALE_NOTES_PROPERTY_NAME,
    TypeScriptVendoredCatalog.CATEGORY_PROPERTY_NAME,
    TypeScriptVendoredCatalog.CODE_PROPERTY_NAME,
    TypeScriptVendoredCatalog.COMPATIBILITY_PYRAMID_PROPERTY_NAME,
    TypeScriptVendoredCatalog.REPORTS_DEPRECATED_PROPERTY_NAME,
    TypeScriptVendoredCatalog.REPORTS_UNNECESSARY_PROPERTY_NAME,
  ];
  private static readonly DECIMAL_RADIX: number = 10;
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: "hex" = "hex";
  private static readonly PLACEHOLDER_PATTERN: RegExp = /\{(\d+)\}/g;

  public readonly definitions: readonly TypeScriptDiagnosticDefinition[];
  public readonly codes: ReadonlySet<number>;
  public readonly sha256: string;

  private constructor(definitions: readonly TypeScriptDiagnosticDefinition[], codes: ReadonlySet<number>, sha256: string) {
    this.definitions = definitions;
    this.codes = codes;
    this.sha256 = sha256;
  }

  public get entries(): number {
    return this.definitions.length;
  }

  public static read(filePath: string): TypeScriptVendoredCatalog {
    const bytes = readFileSync(filePath);
    const catalog = JsonReader.parse(bytes.toString(), filePath);
    const definitions: TypeScriptDiagnosticDefinition[] = [];
    const codes = new Set<number>();

    for (const messageTemplate of Object.keys(catalog.toJson())) {
      const definition = catalog.readObject(messageTemplate);
      for (const propertyName of Object.keys(definition.toJson()))
        if (!TypeScriptVendoredCatalog.ALLOWED_DEFINITION_FIELDS.includes(propertyName))
          throw new Error(TypeScriptVendoredCatalog.unknownDefinitionField(filePath, messageTemplate, propertyName));

      const code = definition.readInteger(TypeScriptVendoredCatalog.CODE_PROPERTY_NAME);
      if (codes.has(code))
        throw new Error(TypeScriptVendoredCatalog.duplicateCode(filePath, code));

      codes.add(code);
      TypeScriptVendoredCatalog.validatePlaceholders(messageTemplate, code);
      TypeScriptVendoredCatalog.readOptionalBoolean(definition, TypeScriptVendoredCatalog.COMPATIBILITY_PYRAMID_PROPERTY_NAME);
      definition.readOptionalString(TypeScriptVendoredCatalog.LOCALE_NOTES_PROPERTY_NAME);
      definitions.push(new TypeScriptDiagnosticDefinition(
        messageTemplate,
        code,
        TypeScriptDiagnosticDefinitionCategory.of(definition.readString(TypeScriptVendoredCatalog.CATEGORY_PROPERTY_NAME)),
        TypeScriptVendoredCatalog.readOptionalBoolean(definition, TypeScriptVendoredCatalog.REPORTS_UNNECESSARY_PROPERTY_NAME) === true,
        TypeScriptVendoredCatalog.readOptionalBoolean(definition, TypeScriptVendoredCatalog.REPORTS_DEPRECATED_PROPERTY_NAME) === true));
    }

    return new TypeScriptVendoredCatalog(definitions, codes,
      createHash(TypeScriptVendoredCatalog.HASH_ALGORITHM).update(bytes).digest(TypeScriptVendoredCatalog.HASH_ENCODING));
  }

  private static readOptionalBoolean(reader: JsonReader, name: string): boolean | undefined {
    return reader.hasField(name) ? reader.readBoolean(name) : undefined;
  }

  private static validatePlaceholders(messageTemplate: string, code: number): void {
    const indexes = new Set<number>();
    for (const [, index] of messageTemplate.matchAll(TypeScriptVendoredCatalog.PLACEHOLDER_PATTERN)) {
      if (index === undefined)
        throw new Error(TypeScriptVendoredCatalog.invalidPlaceholder(code));
      indexes.add(Number.parseInt(index, TypeScriptVendoredCatalog.DECIMAL_RADIX));
    }

    for (let index = 0; index < indexes.size; index++)
      if (!indexes.has(index))
        throw new Error(TypeScriptVendoredCatalog.invalidPlaceholder(code));
  }

  private static duplicateCode(filePath: string, code: number): string {
    return `${filePath} contains duplicate code ${code}.`;
  }

  private static invalidPlaceholder(code: number): string {
    return `TS${code} has an invalid placeholder sequence.`;
  }

  private static unknownDefinitionField(filePath: string, messageTemplate: string, propertyName: string): string {
    return `The definition "${messageTemplate}" in ${filePath} contains unknown field "${propertyName}".`;
  }
}
