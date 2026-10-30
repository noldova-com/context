/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptExpectedManifestTotals from "./typescript-expected-manifest-totals.ts";
import TypeScriptExpectedRetry from "./typescript-expected-retry.ts";
import TypeScriptVendoredSources from "./typescript-vendored-sources.ts";

export default class TypeScriptExpectedManifest {
  private static readonly JSON_INDENTATION: number = 2;
  private static readonly LINE_FEED: string = "\n";
  private static readonly SCHEMA_VERSION: number = 2;

  public readonly schemaVersion: number;
  public readonly typescriptVersion: string;
  public readonly sources: TypeScriptVendoredSources;
  public readonly compilerOptions: object;
  public readonly compilerOptionsSha256: string;
  public readonly unitSplittingVersion: number;
  public readonly totals: TypeScriptExpectedManifestTotals;
  public readonly retries: readonly TypeScriptExpectedRetry[];
  public readonly resultsSha256: string;

  public constructor(typescriptVersion: string, sources: TypeScriptVendoredSources, compilerOptions: object, compilerOptionsSha256: string,
    unitSplittingVersion: number, totals: TypeScriptExpectedManifestTotals, retries: readonly TypeScriptExpectedRetry[], resultsSha256: string) {
    this.schemaVersion = TypeScriptExpectedManifest.SCHEMA_VERSION;
    this.typescriptVersion = typescriptVersion;
    this.sources = sources;
    this.compilerOptions = compilerOptions;
    this.compilerOptionsSha256 = compilerOptionsSha256;
    this.unitSplittingVersion = unitSplittingVersion;
    this.totals = totals;
    this.retries = retries;
    this.resultsSha256 = resultsSha256;
  }

  public static parse(json: string, identity: string): TypeScriptExpectedManifest {
    const reader = JsonObjectReader.parse(json, identity);
    if (reader.integer("schemaVersion") !== TypeScriptExpectedManifest.SCHEMA_VERSION)
      throw new Error(TypeScriptExpectedManifest.MANIFEST_MALFORMED);

    const manifest = new TypeScriptExpectedManifest(
      reader.string("typescriptVersion"),
      TypeScriptVendoredSources.read(reader.object("sources")),
      reader.object("compilerOptions").value,
      reader.string("compilerOptionsSha256"),
      reader.integer("unitSplittingVersion"),
      TypeScriptExpectedManifestTotals.read(reader.object("totals")),
      reader.objects("retries").map(t => TypeScriptExpectedRetry.read(t)),
      reader.string("resultsSha256"));
    if (JSON.stringify(manifest) !== JSON.stringify(reader.value))
      throw new Error(TypeScriptExpectedManifest.MANIFEST_MALFORMED);

    return manifest;
  }

  public serialize(): string {
    return `${JSON.stringify(this, null, TypeScriptExpectedManifest.JSON_INDENTATION)}${TypeScriptExpectedManifest.LINE_FEED}`;
  }

  private static readonly MANIFEST_MALFORMED: string = "The expected diagnostics manifest is not one this generator writes.";
}
