/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import TypeScriptVendoredSuite from "./typescript-vendored-suite.ts";

export default class TypeScriptVendoredCorpus {
  public readonly native: TypeScriptVendoredSuite;
  public readonly classic: TypeScriptVendoredSuite;

  public constructor(native: TypeScriptVendoredSuite, classic: TypeScriptVendoredSuite) {
    this.native = native;
    this.classic = classic;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredCorpus {
    return new TypeScriptVendoredCorpus(TypeScriptVendoredSuite.read(reader.object("native")), TypeScriptVendoredSuite.read(reader.object("classic")));
  }
}
