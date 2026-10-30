/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCategory } from "@noldova/context.diagnostics";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexDiagnosticTemplatesTests {
  @TestMethod
  @TestData(String.empty, "x", "CTX1000", "Unknown regular-expression flag 'x'.")
  @TestData(String.empty, "gg", "CTX1001", "Regular-expression flag 'g' is repeated.")
  @TestData(String.empty, "uv", "CTX1002", "The 'u' and 'v' regular-expression flags cannot be used together.")
  @TestData("(a", String.empty, "CTX1003", "A regular-expression group is missing its closing parenthesis.")
  @TestData("[a", String.empty, "CTX1004", "A regular-expression character class is missing its closing bracket.")
  @TestData("(?*:a)", "u", "CTX1005", "The regular-expression group prefix is invalid.")
  @TestData("(?-:a)", "u", "CTX1006", "At least one modifier is required when a modifier group contains a minus sign.")
  @TestData("(?x:a)", "u", "CTX1007", "Only 'i', 'm', and 's' may be changed by a modifier group.")
  @TestData("(?ii:a)", "u", "CTX1008", "Modifier 'i' is repeated in the same modifier group.")
  @TestData("(?i-i:a)", "u", "CTX1009", "Modifier 'i' cannot be both enabled and disabled.")
  @TestData("(?i a)", "u", "CTX1010", "A modifier group must end its prefix with a colon.")
  @TestData("a{,2}", "u", "CTX1011", "A bounded quantifier requires a decimal lower bound.")
  @TestData("a{2,1}", String.empty, "CTX1012", "A quantifier's lower bound cannot exceed its upper bound.")
  @TestData("*", String.empty, "CTX1013", "This quantifier has no preceding atom to repeat.")
  @TestData("\\", "u", "CTX1014", "The regular-expression escape is incomplete or invalid.")
  @TestData("(?<a>a)\\k<", "u", "CTX1015", "A named backreference requires a group name enclosed in angle brackets.")
  @TestData("(?<a>a)\\k<b>", "u", "CTX1016", "No capturing group named 'b' exists in this regular expression.")
  @TestData("\\2(a)", "u", "CTX1017", "Backreference 2 exceeds the pattern's 1 capturing groups.")
  @TestData("\\p{", "u", "CTX1018", "The Unicode property expression is incomplete.")
  @TestData("\\p{script=Latin}", "u", "CTX1019", "Unicode property name 'script' is not recognized.")
  @TestData("\\p{Script=unknown}", "u", "CTX1020", "Unicode property value 'unknown' is not recognized.")
  @TestData("\\p{Basic_Emoji}", "u", "CTX1021", "Unicode string property 'Basic_Emoji' requires the 'v' flag.")
  @TestData("\\P{Basic_Emoji}", "v", "CTX1022", "A complemented Unicode property cannot match strings.")
  @TestData("(?<na-me>a)", "u", "CTX1023", "A named capturing group requires a valid group name.")
  @TestData("(?<a>a)(?<a>b)", "u", "CTX1024", "Named capturing group 'a' is duplicated outside mutually exclusive alternatives.")
  @TestData("[\\d-a]", "u", "CTX1025", "A character-class range endpoint must represent exactly one character.")
  @TestData("[z-a]", "u", "CTX1026", "A character-class range starts after it ends.")
  @TestData("[a&&b--c]", "v", "CTX1027", "Character-class intersection and subtraction operators cannot be mixed at one level.")
  @TestData("[a&&]", "v", "CTX1028", "A character-class set operator requires an operand on both sides.")
  @TestData("[!!]", "v", "CTX1029", "The unescaped double punctuator '!!' is reserved inside a Unicode set.")
  @TestData("[^\\q{ab}]", "v", "CTX1030", "A negated character class cannot contain an element that may match multiple characters.")
  @TestData("[\\q{ab]", "v", "CTX1031", "A class-string disjunction is missing its closing brace.")
  @TestData("(?<a>a)\\k<na-me>", "u", "CTX1032", "The regular-expression group name contains an invalid identifier character.")
  @TestData(")", String.empty, "CTX1033", "The regular-expression contains an unexpected closing delimiter.")
  @TestData("[(]", "v", "CTX1034", "The unescaped punctuator '(' is reserved inside a Unicode set.")
  @TestData("[\\1]", "u", "CTX1035", "A decimal backreference is not permitted inside a character class.")
  @TestData("[\\q{\\d}]", "v", "CTX1036", "A class-string alternative may contain only individual characters and character escapes.")
  @TestData("[a-z&&b]", "v", "CTX1038", "A character-class range must be nested in a class to be an intersection or subtraction operand.")
  public createsExactDiagnostics(pattern: string, flags: string, code: string, message: string): void {
    const diagnostic = RegexParserFixture.parse(pattern, flags).diagnostics.find(t => t.code.displayText === code);

    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual(message, diagnostic.message.text);
  }

  @TestMethod
  public createsTheNestingDepthDiagnostic(): void {
    const nestingDepth = 1_000;
    const pattern = "(".repeat(nestingDepth) + "a" + ")".repeat(nestingDepth);
    const diagnostic = RegexParserFixture.parse(pattern).diagnostics.find(t => t.code.displayText === "CTX1037");

    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("Regular-expression nesting exceeds the supported depth of 512.", diagnostic.message.text);
  }
}
