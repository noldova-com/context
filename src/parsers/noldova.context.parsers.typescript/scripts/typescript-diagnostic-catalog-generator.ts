/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "node:path";

import Script from "../../../../scripts/script.ts";
import TypeScriptConformanceLayout from "./typescript-conformance-layout.ts";
import TypeScriptConformanceProvenance from "./typescript-conformance-provenance.ts";
import type TypeScriptDiagnosticDefinition from "./typescript-diagnostic-definition.ts";
import type TypeScriptVendoredCatalogRecord from "./typescript-vendored-catalog-record.ts";
import TypeScriptVendoredCatalog from "./typescript-vendored-catalog.ts";
import TypeScriptVendoredComposition from "./typescript-vendored-composition.ts";
import type TypeScriptVendoredSource from "./typescript-vendored-source.ts";

export default class TypeScriptDiagnosticCatalogGenerator extends Script {
  private static readonly CLASSIC_SOURCE_NAME: string = "classic";
  private static readonly COMPOSITION_MISMATCH: string = "The native diagnostic overlay does not match provenance.";
  private static readonly GENERATED_MESSAGE: string = "Generated TypeScript diagnostic templates.";
  private static readonly NATIVE_SOURCE_NAME: string = "native";
  private static readonly OUTPUT_DIRECTORY_PATH: string = "src/parsers/noldova.context.parsers.typescript/src/models/diagnostics";
  private static readonly OUTPUT_FILE_PATH: string = `${TypeScriptDiagnosticCatalogGenerator.OUTPUT_DIRECTORY_PATH}/typescript-diagnostic-templates.ts`;
  private static readonly PROVENANCE_PATH: string = TypeScriptConformanceLayout.pathOf(TypeScriptConformanceLayout.PROVENANCE);
  private static readonly UPSTREAM_COPYRIGHT: string = "Copyright (c) Microsoft Corporation.";
  private static readonly UPSTREAM_LICENSE: string = "Apache License, Version 2.0";

  public override async runAsync(): Promise<void> {
    await this.createDirectoryAsync(TypeScriptDiagnosticCatalogGenerator.OUTPUT_DIRECTORY_PATH);
    await this.writeFileAsync(TypeScriptDiagnosticCatalogGenerator.OUTPUT_FILE_PATH, await this.createCatalogAsync());
    await this.writeLogAsync(TypeScriptDiagnosticCatalogGenerator.GENERATED_MESSAGE);
  }

  public async verifyAsync(): Promise<void> {
    const expected = await this.createCatalogAsync();

    if (!await this.pathExistsAsync(TypeScriptDiagnosticCatalogGenerator.OUTPUT_FILE_PATH))
      throw new Error(TypeScriptDiagnosticCatalogGenerator.outputMissing());

    const actual = await this.readFileAsync(TypeScriptDiagnosticCatalogGenerator.OUTPUT_FILE_PATH);
    if (actual !== expected)
      throw new Error(TypeScriptDiagnosticCatalogGenerator.outputOutdated());
  }

  private async createCatalogAsync(): Promise<string> {
    const provenance = TypeScriptConformanceProvenance.parse(
      await this.readFileAsync(TypeScriptDiagnosticCatalogGenerator.PROVENANCE_PATH), TypeScriptDiagnosticCatalogGenerator.PROVENANCE_PATH);
    const diagnostics = provenance.diagnostics;
    const classic = this.readCatalog(diagnostics.classic);
    const native = this.readCatalog(diagnostics.native);
    if (JSON.stringify(TypeScriptVendoredComposition.of(classic, native)) !== JSON.stringify(diagnostics.composition))
      throw new Error(TypeScriptDiagnosticCatalogGenerator.COMPOSITION_MISMATCH);

    return this.renderCatalog(TypeScriptVendoredComposition.effectiveDefinitions(classic, native), [
      this.attribution(provenance.sources.typescript, TypeScriptDiagnosticCatalogGenerator.CLASSIC_SOURCE_NAME),
      this.attribution(provenance.sources.typescriptGo, TypeScriptDiagnosticCatalogGenerator.NATIVE_SOURCE_NAME),
    ]);
  }

  private readCatalog(record: TypeScriptVendoredCatalogRecord): TypeScriptVendoredCatalog {
    if (!record.localPath.startsWith(`${TypeScriptConformanceLayout.DIAGNOSTIC_DEFINITIONS}${path.posix.sep}`))
      throw new Error(TypeScriptDiagnosticCatalogGenerator.sourceOutsideDiagnostics(record.localPath));

    const catalog = TypeScriptVendoredCatalog.read(TypeScriptConformanceLayout.pathOf(record.localPath));
    if (catalog.sha256 !== record.sha256 || catalog.entries !== record.entries)
      throw new Error(TypeScriptDiagnosticCatalogGenerator.catalogMismatch(record.localPath));

    return catalog;
  }

  private attribution(source: TypeScriptVendoredSource, definitionName: string): string {
    return `${definitionName} diagnostic definitions from ${source.repository} at commit ${source.commit}`;
  }

  private renderCatalog(definitions: readonly TypeScriptDiagnosticDefinition[], attributions: readonly string[]): string {
    const lines: string[] = [
      "/**",
      " * @license",
      " * Copyright (c) Noldova.",
      " *",
      " * This source code is licensed under the license found in the",
      " * LICENSE file in the root directory of this source tree.",
      " */",
      "",
      "// Generated from the TypeScript compiler's diagnostic definitions, whose message text is reproduced here:",
      ...attributions.map(t => `// ${t};`),
      `// ${TypeScriptDiagnosticCatalogGenerator.UPSTREAM_COPYRIGHT} Licensed under the ${TypeScriptDiagnosticCatalogGenerator.UPSTREAM_LICENSE}.`,
      "",
      "import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTag, DiagnosticTemplate } from \"@noldova/context.diagnostics\";",
      "",
      "export class TypeScriptDiagnosticTemplates {",
    ];

    for (const definition of definitions) {
      const category = `DiagnosticCategory.${definition.category.name}`;
      const defaultTags = this.defaultTagExpressions(definition);
      if (defaultTags.length === 0)
        lines.push(`  public static readonly TS${definition.code}: DiagnosticTemplate = TypeScriptDiagnosticTemplates.create(${definition.code}, ${category}, ${this.stringLiteral(definition.messageTemplate)});`);
      else
        lines.push(`  public static readonly TS${definition.code}: DiagnosticTemplate = TypeScriptDiagnosticTemplates.create(${definition.code}, ${category}, ${this.stringLiteral(definition.messageTemplate)}, [${defaultTags.join(", ")}]);`);
    }

    lines.push("", "  private static create(code: number, category: DiagnosticCategory, messageTemplate: string, defaultTags: readonly DiagnosticTag[] = []): DiagnosticTemplate {");
    lines.push("    return new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.typeScript, code), category, messageTemplate, defaultTags);");
    lines.push("  }", "}", "");

    return lines.join("\n");
  }

  private defaultTagExpressions(definition: TypeScriptDiagnosticDefinition): readonly string[] {
    const tags: string[] = [];
    if (definition.reportsUnnecessary)
      tags.push("DiagnosticTag.Unnecessary");

    if (definition.reportsDeprecated)
      tags.push("DiagnosticTag.Deprecated");

    return tags;
  }

  private stringLiteral(value: string): string {
    return JSON.stringify(value).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
  }

  private static catalogMismatch(localPath: string): string {
    return `The diagnostic definitions at ${localPath} are not the ones provenance records.`;
  }

  private static outputMissing(): string {
    return `Missing generated output "${TypeScriptDiagnosticCatalogGenerator.OUTPUT_FILE_PATH}".`;
  }

  private static outputOutdated(): string {
    return `Generated output "${TypeScriptDiagnosticCatalogGenerator.OUTPUT_FILE_PATH}" is outdated.`;
  }

  private static sourceOutsideDiagnostics(localPath: string): string {
    return `The diagnostic source ${localPath} is outside the diagnostic intake.`;
  }
}
