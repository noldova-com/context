/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import fs from "node:fs/promises";

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTag, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { TypeScriptDiagnosticTemplates } from "@noldova/context.parsers.typescript/models/diagnostics/typescript-diagnostic-templates.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDiagnosticTemplatesTests {
  private static readonly CONFORMANCE_DIRECTORY_PATH: string = "src/parsers/noldova.context.parsers.typescript/tests/conformance/";
  private static readonly PROVENANCE_FILE_NAME: string = "PROVENANCE.json";

  @TestMethod
  public async matchesEveryEffectiveDefinitionAsync(): Promise<void> {
    const expectedTemplates = await this.getExpectedTemplatesAsync();

    for (const [code, expected] of expectedTemplates) {
      const actual = TypeScriptDiagnosticTemplates[`TS${code}`];
      Assert.isDefined(actual, `TS${code} is missing.`);
      Assert.areEqual(expected.code.authority, actual.code.authority, `TS${code} authority differs.`);
      Assert.areEqual(expected.code.value, actual.code.value, `TS${code} code differs.`);
      Assert.areEqual(expected.category, actual.category, `TS${code} category differs.`);
      Assert.areEqual(expected.messageTemplate, actual.messageTemplate, `TS${code} message differs.`);
      Assert.areEqual(expected.defaultTags.length, actual.defaultTags.length, `TS${code} tag count differs.`);

      for (let index = 0; index < expected.defaultTags.length; index++)
        Assert.areEqual(expected.defaultTags[index], actual.defaultTags[index], `TS${code} tag ${index} differs.`);
    }

    Assert.areEqual(2154, expectedTemplates.size);
  }

  private async getExpectedTemplatesAsync(): Promise<Map<number, DiagnosticTemplate>> {
    const provenancePath = TypeScriptDiagnosticTemplatesTests.CONFORMANCE_DIRECTORY_PATH + TypeScriptDiagnosticTemplatesTests.PROVENANCE_FILE_NAME;
    const provenance = this.requireObject(JSON.parse(await fs.readFile(provenancePath, "utf8")), provenancePath);
    const diagnostics = this.requireObject(this.getProperty(provenance, "diagnostics"), "diagnostics");
    const templates = new Map<number, DiagnosticTemplate>();

    await this.addExpectedTemplatesAsync(templates, this.requireDefinitionsPath(diagnostics, "classic"));
    await this.addExpectedTemplatesAsync(templates, this.requireDefinitionsPath(diagnostics, "native"));

    return templates;
  }

  private requireDefinitionsPath(diagnostics: object, sourceName: string): string {
    const source = this.requireObject(this.getProperty(diagnostics, sourceName), sourceName);
    const localPath = this.getProperty(source, "localPath");
    Assert.isTrue(typeof localPath === "string", `"${sourceName}.localPath" must be a string.`);
    return TypeScriptDiagnosticTemplatesTests.CONFORMANCE_DIRECTORY_PATH + localPath;
  }

  private async addExpectedTemplatesAsync(templates: Map<number, DiagnosticTemplate>, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, "utf8");
    const definitions = this.requireObject(JSON.parse(content), filePath);

    for (const messageTemplate of Object.keys(definitions)) {
      const definition = this.requireObject(this.getProperty(definitions, messageTemplate), messageTemplate);
      const code = this.requireInteger(definition, "code");
      const category = this.requireCategory(definition);
      const defaultTags = this.getDefaultTags(definition);

      templates.set(code, new DiagnosticTemplate(
        new DiagnosticCode(DiagnosticAuthority.typeScript, code),
        category,
        messageTemplate,
        defaultTags));
    }
  }

  private getDefaultTags(definition: object): readonly DiagnosticTag[] {
    const tags: DiagnosticTag[] = [];
    if (this.requireOptionalBoolean(definition, "reportsUnnecessary"))
      tags.push(DiagnosticTag.Unnecessary);

    if (this.requireOptionalBoolean(definition, "reportsDeprecated"))
      tags.push(DiagnosticTag.Deprecated);

    return tags;
  }

  private requireCategory(definition: object): DiagnosticCategory {
    const category = this.getProperty(definition, "category");
    Assert.isTrue(typeof category === "string");
    switch (category) {
      case "Error":
        return DiagnosticCategory.Error;
      case "Message":
        return DiagnosticCategory.Message;
      case "Suggestion":
        return DiagnosticCategory.Suggestion;
      case "Warning":
        return DiagnosticCategory.Warning;
      default:
        Assert.fail(`Unknown diagnostic category "${category}".`);
    }
  }

  private requireInteger(owner: object, propertyName: string): number {
    const value = this.getProperty(owner, propertyName);
    Assert.isTrue(typeof value === "number" && Number.isInteger(value), `"${propertyName}" must be an integer.`);
    return value;
  }

  private requireOptionalBoolean(owner: object, propertyName: string): boolean {
    const value = this.getProperty(owner, propertyName);
    Assert.isTrue(Object.isUndefined(value) || typeof value === "boolean", `"${propertyName}" must be a boolean when present.`);
    return value ?? false;
  }

  private requireObject(value: unknown, identity: string): object {
    Assert.isTrue(typeof value === "object" && !Object.isNull(value) && !Array.isArray(value), `"${identity}" must be an object.`);
    return value;
  }

  private getProperty(owner: object, propertyName: string): unknown {
    return Object.getOwnPropertyDescriptor(owner, propertyName)?.value;
  }
}
