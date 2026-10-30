/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptVendoredCatalogRecord from "./typescript-vendored-catalog-record.ts";
import TypeScriptVendoredComposition from "./typescript-vendored-composition.ts";

export default class TypeScriptVendoredDiagnostics {
  public readonly classic: TypeScriptVendoredCatalogRecord;
  public readonly native: TypeScriptVendoredCatalogRecord;
  public readonly composition: TypeScriptVendoredComposition;

  public constructor(classic: TypeScriptVendoredCatalogRecord, native: TypeScriptVendoredCatalogRecord, composition: TypeScriptVendoredComposition) {
    this.classic = classic;
    this.native = native;
    this.composition = composition;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredDiagnostics {
    return new TypeScriptVendoredDiagnostics(
      TypeScriptVendoredCatalogRecord.read(reader.object("classic")),
      TypeScriptVendoredCatalogRecord.read(reader.object("native")),
      TypeScriptVendoredComposition.read(reader.object("composition")));
  }
}
