/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";

export class RegexDiagnosticTemplates {
  public static readonly CTX1000: DiagnosticTemplate = RegexDiagnosticTemplates.create(1000, "Unknown regular-expression flag '{0}'.");
  public static readonly CTX1001: DiagnosticTemplate = RegexDiagnosticTemplates.create(1001, "Regular-expression flag '{0}' is repeated.");
  public static readonly CTX1002: DiagnosticTemplate = RegexDiagnosticTemplates.create(1002, "The 'u' and 'v' regular-expression flags cannot be used together.");
  public static readonly CTX1003: DiagnosticTemplate = RegexDiagnosticTemplates.create(1003, "A regular-expression group is missing its closing parenthesis.");
  public static readonly CTX1004: DiagnosticTemplate = RegexDiagnosticTemplates.create(1004, "A regular-expression character class is missing its closing bracket.");
  public static readonly CTX1005: DiagnosticTemplate = RegexDiagnosticTemplates.create(1005, "The regular-expression group prefix is invalid.");
  public static readonly CTX1006: DiagnosticTemplate = RegexDiagnosticTemplates.create(1006, "At least one modifier is required when a modifier group contains a minus sign.");
  public static readonly CTX1007: DiagnosticTemplate = RegexDiagnosticTemplates.create(1007, "Only 'i', 'm', and 's' may be changed by a modifier group.");
  public static readonly CTX1008: DiagnosticTemplate = RegexDiagnosticTemplates.create(1008, "Modifier '{0}' is repeated in the same modifier group.");
  public static readonly CTX1009: DiagnosticTemplate = RegexDiagnosticTemplates.create(1009, "Modifier '{0}' cannot be both enabled and disabled.");
  public static readonly CTX1010: DiagnosticTemplate = RegexDiagnosticTemplates.create(1010, "A modifier group must end its prefix with a colon.");
  public static readonly CTX1011: DiagnosticTemplate = RegexDiagnosticTemplates.create(1011, "A bounded quantifier requires a decimal lower bound.");
  public static readonly CTX1012: DiagnosticTemplate = RegexDiagnosticTemplates.create(1012, "A quantifier's lower bound cannot exceed its upper bound.");
  public static readonly CTX1013: DiagnosticTemplate = RegexDiagnosticTemplates.create(1013, "This quantifier has no preceding atom to repeat.");
  public static readonly CTX1014: DiagnosticTemplate = RegexDiagnosticTemplates.create(1014, "The regular-expression escape is incomplete or invalid.");
  public static readonly CTX1015: DiagnosticTemplate = RegexDiagnosticTemplates.create(1015, "A named backreference requires a group name enclosed in angle brackets.");
  public static readonly CTX1016: DiagnosticTemplate = RegexDiagnosticTemplates.create(1016, "No capturing group named '{0}' exists in this regular expression.");
  public static readonly CTX1017: DiagnosticTemplate = RegexDiagnosticTemplates.create(1017, "Backreference {0} exceeds the pattern's {1} capturing groups.");
  public static readonly CTX1018: DiagnosticTemplate = RegexDiagnosticTemplates.create(1018, "The Unicode property expression is incomplete.");
  public static readonly CTX1019: DiagnosticTemplate = RegexDiagnosticTemplates.create(1019, "Unicode property name '{0}' is not recognized.");
  public static readonly CTX1020: DiagnosticTemplate = RegexDiagnosticTemplates.create(1020, "Unicode property value '{0}' is not recognized.");
  public static readonly CTX1021: DiagnosticTemplate = RegexDiagnosticTemplates.create(1021, "Unicode string property '{0}' requires the 'v' flag.");
  public static readonly CTX1022: DiagnosticTemplate = RegexDiagnosticTemplates.create(1022, "A complemented Unicode property cannot match strings.");
  public static readonly CTX1023: DiagnosticTemplate = RegexDiagnosticTemplates.create(1023, "A named capturing group requires a valid group name.");
  public static readonly CTX1024: DiagnosticTemplate = RegexDiagnosticTemplates.create(1024, "Named capturing group '{0}' is duplicated outside mutually exclusive alternatives.");
  public static readonly CTX1025: DiagnosticTemplate = RegexDiagnosticTemplates.create(1025, "A character-class range endpoint must represent exactly one character.");
  public static readonly CTX1026: DiagnosticTemplate = RegexDiagnosticTemplates.create(1026, "A character-class range starts after it ends.");
  public static readonly CTX1027: DiagnosticTemplate = RegexDiagnosticTemplates.create(1027, "Character-class intersection and subtraction operators cannot be mixed at one level.");
  public static readonly CTX1028: DiagnosticTemplate = RegexDiagnosticTemplates.create(1028, "A character-class set operator requires an operand on both sides.");
  public static readonly CTX1029: DiagnosticTemplate = RegexDiagnosticTemplates.create(1029, "The unescaped double punctuator '{0}' is reserved inside a Unicode set.");
  public static readonly CTX1030: DiagnosticTemplate = RegexDiagnosticTemplates.create(1030, "A negated character class cannot contain an element that may match multiple characters.");
  public static readonly CTX1031: DiagnosticTemplate = RegexDiagnosticTemplates.create(1031, "A class-string disjunction is missing its closing brace.");
  public static readonly CTX1032: DiagnosticTemplate = RegexDiagnosticTemplates.create(1032, "The regular-expression group name contains an invalid identifier character.");
  public static readonly CTX1033: DiagnosticTemplate = RegexDiagnosticTemplates.create(1033, "The regular-expression contains an unexpected closing delimiter.");
  public static readonly CTX1034: DiagnosticTemplate = RegexDiagnosticTemplates.create(1034, "The unescaped punctuator '{0}' is reserved inside a Unicode set.");
  public static readonly CTX1035: DiagnosticTemplate = RegexDiagnosticTemplates.create(1035, "A decimal backreference is not permitted inside a character class.");
  public static readonly CTX1036: DiagnosticTemplate = RegexDiagnosticTemplates.create(1036, "A class-string alternative may contain only individual characters and character escapes.");
  public static readonly CTX1037: DiagnosticTemplate = RegexDiagnosticTemplates.create(1037, "Regular-expression nesting exceeds the supported depth of {0}.");
  public static readonly CTX1038: DiagnosticTemplate = RegexDiagnosticTemplates.create(1038, "A character-class range must be nested in a class to be an intersection or subtraction operand.");

  private static create(code: number, messageTemplate: string): DiagnosticTemplate {
    return new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, code), DiagnosticCategory.Error, messageTemplate, []);
  }
}
