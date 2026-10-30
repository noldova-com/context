/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly codeValueInvalid: string = "The code value must be a positive safe integer.";
  public static readonly contextCodePrefix: string = "CTX";
  public static readonly duplicateTag: string = "The tags must not contain a duplicate.";
  public static readonly lengthInvalid: string = "The length must be a non-negative safe integer.";
  public static readonly sourceLengthInvalid: string = "The source length must be a non-negative safe integer.";
  public static readonly sourceLengthParameterName: string = "sourceLength";
  public static readonly spanEndInvalid: string = "The span end must be a non-negative safe integer.";
  public static readonly startInvalid: string = "The start must be a non-negative safe integer.";
  public static readonly typeScriptCodePrefix: string = "TS";

  public static spanBeyondSource(end: number, sourceLength: number): string {
    return `The span ending at ${end} exceeds the source length ${sourceLength}.`;
  }
}
