/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ParameterRewriter } from "@noldova/context.data.sql.postgresql/services/parameter-rewriter.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ParameterRewriterTests {
  @TestMethod
  @TestData("SELECT ?, ?", 2, "SELECT $1, $2")
  @TestData("INSERT INTO \"notes\" (\"id\", \"text\") VALUES (?, ?)", 2, "INSERT INTO \"notes\" (\"id\", \"text\") VALUES ($1, $2)")
  @TestData("SELECT 1 FROM t WHERE a = ? AND b=? OR c <> ?", 3, "SELECT 1 FROM t WHERE a = $1 AND b=$2 OR c <> $3")
  @TestData("SELECT 1 FROM t WHERE a IN (?, ?) AND b BETWEEN ? AND ? LIMIT ? OFFSET ?", 6, "SELECT 1 FROM t WHERE a IN ($1, $2) AND b BETWEEN $3 AND $4 LIMIT $5 OFFSET $6")
  @TestData("SELECT CASE WHEN a IS ? THEN ? ELSE ? END FROM t", 3, "SELECT CASE WHEN a IS $1 THEN $2 ELSE $3 END FROM t")
  @TestData("UPDATE t SET a = ? RETURNING a", 1, "UPDATE t SET a = $1 RETURNING a")
  @TestData("SELECT a FROM t", 0, "SELECT a FROM t")
  public rewritesEachPlaceholderInOrder(text: string, parameters: number, expected: string): void {
    Assert.areEqual(expected, ParameterRewriter.rewrite(text, parameters));
  }

  @TestMethod
  @TestData("SELECT 'a?b', ?", "SELECT 'a?b', $1")
  @TestData("SELECT 'it''s ?', ?", "SELECT 'it''s ?', $1")
  @TestData("SELECT E'\\'?', ?", "SELECT E'\\'?', $1")
  @TestData("SELECT e'a\\\\', ?", "SELECT e'a\\\\', $1")
  @TestData("SELECT \"a?b\", ?", "SELECT \"a?b\", $1")
  @TestData("SELECT \"a\"\"?\", ?", "SELECT \"a\"\"?\", $1")
  @TestData("SELECT ? -- why?\n", "SELECT $1 -- why?\n")
  @TestData("SELECT /* a /* ? */ ? */ ?", "SELECT /* a /* ? */ ? */ $1")
  @TestData("SELECT $$?$$, ?", "SELECT $$?$$, $1")
  @TestData("SELECT $fn$ ? $other$ ? $fn$, ?", "SELECT $fn$ ? $other$ ? $fn$, $1")
  @TestData("SELECT a$b$c FROM t WHERE x = ?", "SELECT a$b$c FROM t WHERE x = $1")
  @TestData("SELECT ? -- why?", "SELECT $1 -- why?")
  @TestData("SELECT ?, $$a?", "SELECT $1, $$a?")
  @TestData("SELECT ?, $ + $", "SELECT $1, $ + $")
  @TestData("SELECT x$, ?", "SELECT x$, $1")
  @TestData("SELECT $a, ?", "SELECT $a, $1")
  @TestData("? IS NULL", "$1 IS NULL")
  public leavesQuestionMarksInQuotedTextAndComments(text: string, expected: string): void {
    Assert.areEqual(expected, ParameterRewriter.rewrite(text, 1));
  }

  @TestMethod
  @TestData("SELECT 1 FROM t WHERE data ?| ?")
  @TestData("SELECT 1 FROM t WHERE data ?& ?")
  @TestData("SELECT 1 FROM t WHERE data ? 'key'")
  @TestData("SELECT 1 FROM t WHERE \"data\" ? 'key'")
  @TestData("SELECT 1 FROM t WHERE (data) ? 'key'")
  @TestData("SELECT 1 FROM t WHERE a ?- b")
  @TestData("SELECT 1 FROM t WHERE a ?# b")
  @TestData("SELECT 1 FROM t WHERE data @? '$.a'")
  @TestData("SELECT 1 FROM t WHERE ? ? 'key'")
  public refusesQuestionMarkOperators(text: string): void {
    Assert.throws(() => ParameterRewriter.rewrite(text, 1), DataException);
  }

  @TestMethod
  @TestData("SELECT $1, ?", 7)
  @TestData("SELECT ? + $2", 11)
  public refusesAPositionalParameterOutsideQuotedText(text: string, offset: number): void {
    const failure = Assert.throws(() => ParameterRewriter.rewrite(text, 1), DataException);

    Assert.areEqual(`The text at offset ${offset} is a positional parameter; mark every parameter with ? instead.`, failure.message);
    Assert.areEqual("SELECT '$1', $1", ParameterRewriter.rewrite("SELECT '$1', ?", 1));
  }

  @TestMethod
  public namesTheOffsetOfARefusedOperator(): void {
    const failure = Assert.throws(() => ParameterRewriter.rewrite("SELECT data ? 'k'", 0), DataException);

    Assert.isTrue(failure.message.startsWith("The question mark at offset 12 is a PostgreSQL operator"));
  }

  @TestMethod
  @TestData("SELECT ?, ?", 1)
  @TestData("SELECT ?", 2)
  @TestData("SELECT '?'", 1)
  public refusesACountOfPlaceholdersOtherThanTheParameters(text: string, parameters: number): void {
    Assert.throws(() => ParameterRewriter.rewrite(text, parameters), DataException);
  }
}
