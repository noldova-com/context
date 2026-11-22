/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JsonReader } from "@noldova/context.json";

export class ExtractionResult {
  private static readonly KEY_FIELD: string = "key";
  private static readonly OUTCOME_FIELD: string = "outcome";
  private static readonly FOLDER_FIELD: string = "folder";
  private static readonly OUTSIDE_FIELD: string = "outside";
  private static readonly OUT_FIELD: string = "out";

  public readonly key: string;
  public readonly outcome: string;
  public readonly folderEntries: readonly string[];
  public readonly outsideEntries: readonly string[];
  public readonly outEntries: readonly string[];

  private constructor(key: string, outcome: string, folderEntries: readonly string[], outsideEntries: readonly string[], outEntries: readonly string[]) {
    this.key = key;
    this.outcome = outcome;
    this.folderEntries = folderEntries;
    this.outsideEntries = outsideEntries;
    this.outEntries = outEntries;
  }

  public static parse(line: string): ExtractionResult {
    const reader = JsonReader.parse(line);
    return new ExtractionResult(reader.readString(ExtractionResult.KEY_FIELD), reader.readString(ExtractionResult.OUTCOME_FIELD),
      reader.readStringArray(ExtractionResult.FOLDER_FIELD), reader.readStringArray(ExtractionResult.OUTSIDE_FIELD), reader.readStringArray(ExtractionResult.OUT_FIELD));
  }
}
