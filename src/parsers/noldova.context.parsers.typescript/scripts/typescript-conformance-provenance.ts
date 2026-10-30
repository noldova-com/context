/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptVendoredCorpus from "./typescript-vendored-corpus.ts";
import TypeScriptVendoredDiagnostics from "./typescript-vendored-diagnostics.ts";
import TypeScriptVendoredLibraryRecord from "./typescript-vendored-library-record.ts";
import TypeScriptVendoredLicenses from "./typescript-vendored-licenses.ts";
import TypeScriptVendoredSources from "./typescript-vendored-sources.ts";
import TypeScriptVendoredTotals from "./typescript-vendored-totals.ts";

export default class TypeScriptConformanceProvenance {
  private static readonly JSON_INDENTATION: number = 2;
  private static readonly LINE_FEED: string = "\n";
  private static readonly SCHEMA_VERSION: number = 1;

  public readonly schemaVersion: number;
  public readonly typescriptVersion: string;
  public readonly sources: TypeScriptVendoredSources;
  public readonly corpus: TypeScriptVendoredCorpus;
  public readonly standardLibrary: TypeScriptVendoredLibraryRecord;
  public readonly diagnostics: TypeScriptVendoredDiagnostics;
  public readonly licenses: TypeScriptVendoredLicenses;
  public readonly totals: TypeScriptVendoredTotals;

  public constructor(
    typescriptVersion: string,
    sources: TypeScriptVendoredSources,
    corpus: TypeScriptVendoredCorpus,
    standardLibrary: TypeScriptVendoredLibraryRecord,
    diagnostics: TypeScriptVendoredDiagnostics,
    licenses: TypeScriptVendoredLicenses) {
    this.schemaVersion = TypeScriptConformanceProvenance.SCHEMA_VERSION;
    this.typescriptVersion = typescriptVersion;
    this.sources = sources;
    this.corpus = corpus;
    this.standardLibrary = standardLibrary;
    this.diagnostics = diagnostics;
    this.licenses = licenses;
    this.totals = new TypeScriptVendoredTotals(corpus, standardLibrary, diagnostics);
  }

  public static parse(text: string, identity: string): TypeScriptConformanceProvenance {
    const reader = JsonObjectReader.parse(text, identity);
    const schemaVersion = reader.integer("schemaVersion");
    if (schemaVersion !== TypeScriptConformanceProvenance.SCHEMA_VERSION)
      throw new Error(TypeScriptConformanceProvenance.schemaUnsupported(identity, schemaVersion));

    const provenance = new TypeScriptConformanceProvenance(
      reader.string("typescriptVersion"),
      TypeScriptVendoredSources.read(reader.object("sources")),
      TypeScriptVendoredCorpus.read(reader.object("corpus")),
      TypeScriptVendoredLibraryRecord.read(reader.object("standardLibrary")),
      TypeScriptVendoredDiagnostics.read(reader.object("diagnostics")),
      TypeScriptVendoredLicenses.read(reader.object("licenses")));
    if (JSON.stringify(provenance) !== JSON.stringify(reader.value))
      throw new Error(TypeScriptConformanceProvenance.notWrittenByTheVendor(identity));

    return provenance;
  }

  public serialize(): string {
    return `${JSON.stringify(this, null, TypeScriptConformanceProvenance.JSON_INDENTATION)}${TypeScriptConformanceProvenance.LINE_FEED}`;
  }

  private static notWrittenByTheVendor(identity: string): string {
    return `${identity} is not what the vendor command writes for the records it holds; rerun the intake rather than edit it.`;
  }

  private static schemaUnsupported(identity: string, schemaVersion: number): string {
    return `${identity} has schema version ${schemaVersion}; the vendor command writes and reads version ${TypeScriptConformanceProvenance.SCHEMA_VERSION}.`;
  }
}
