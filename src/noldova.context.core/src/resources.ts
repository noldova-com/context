/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly coreCopiesLoaded: string = "Two copies of @noldova/context.core are loaded, so this one cannot add its extensions. The app's packages need one context version that each of their ranges meets; npm ls @noldova/context.core names the packages that bring each copy.";
  public static readonly formatClosingBrace: string = "}";
  public static readonly formatOpeningBrace: string = "{";
  public static readonly isFunctionName: string = "isFunction";
  public static readonly nameofArgumentInvalid: string = "The value must be a string member name or a selector that returns exactly one selected string member.";
  public static readonly nonWhitespacePattern: RegExp = /\S/u;
  public static readonly typeofBigInt: string = "bigint";
  public static readonly typeofBoolean: string = "boolean";
  public static readonly typeofFunction: string = "function";
  public static readonly typeofNumber: string = "number";
  public static readonly typeofObject: string = "object";
  public static readonly typeofString: string = "string";
  public static readonly typeofSymbol: string = "symbol";
}
