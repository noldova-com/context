/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

import TypeScriptVendoredLicenseRecord from "./typescript-vendored-license-record.ts";

export default class TypeScriptVendoredLicenses {
  public readonly native: TypeScriptVendoredLicenseRecord;
  public readonly classic: TypeScriptVendoredLicenseRecord;

  public constructor(native: TypeScriptVendoredLicenseRecord, classic: TypeScriptVendoredLicenseRecord) {
    this.native = native;
    this.classic = classic;
  }

  public static read(reader: JsonReader): TypeScriptVendoredLicenses {
    return new TypeScriptVendoredLicenses(
      TypeScriptVendoredLicenseRecord.read(reader.readObject("native")), TypeScriptVendoredLicenseRecord.read(reader.readObject("classic")));
  }
}
