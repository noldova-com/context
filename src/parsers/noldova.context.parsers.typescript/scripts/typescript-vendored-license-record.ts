/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";

export default class TypeScriptVendoredLicenseRecord {
  public readonly source: string;
  public readonly localRoot: string;

  public constructor(source: string, localRoot: string) {
    this.source = source;
    this.localRoot = localRoot;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredLicenseRecord {
    return new TypeScriptVendoredLicenseRecord(reader.string("source"), reader.string("localRoot"));
  }
}
