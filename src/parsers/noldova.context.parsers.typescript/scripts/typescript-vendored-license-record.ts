/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonReader } from "@noldova/context.json";

export default class TypeScriptVendoredLicenseRecord {
  public readonly source: string;
  public readonly localRoot: string;

  public constructor(source: string, localRoot: string) {
    this.source = source;
    this.localRoot = localRoot;
  }

  public static read(reader: JsonReader): TypeScriptVendoredLicenseRecord {
    return new TypeScriptVendoredLicenseRecord(reader.readString("source"), reader.readString("localRoot"));
  }
}
