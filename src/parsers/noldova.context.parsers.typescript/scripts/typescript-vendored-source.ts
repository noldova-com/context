/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type JsonObjectReader from "../../../../scripts/json-object.reader.ts";

export default class TypeScriptVendoredSource {
  public readonly repository: string;
  public readonly tag: string | undefined;
  public readonly commit: string;

  public constructor(repository: string, tag: string | undefined, commit: string) {
    this.repository = repository;
    this.tag = tag;
    this.commit = commit;
  }

  public static read(reader: JsonObjectReader): TypeScriptVendoredSource {
    return new TypeScriptVendoredSource(reader.string("repository"), reader.optionalString("tag"), reader.string("commit"));
  }
}
