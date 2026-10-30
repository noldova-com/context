/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceSpan } from "@noldova/context.parsers";
import { RegexParserContext } from "@noldova/context.parsers.regex/models/regex-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexNamedGroupRegistryTests {
  private nextDisjunctionIndex: number = 0;

  @TestMethod
  @TestData(1)
  @TestData(2)
  @TestData(3)
  public matchesThePairwiseRuleForEveryGeneratedPair(depth: number): void {
    const paths: Map<number, number>[] = [];
    this.collectBranchPaths(paths, new Map(), depth);

    for (const first of paths)
      for (const second of paths) {
        const context = new RegexParserContext(new Source(String.empty));
        this.register(context, "n", first);
        this.register(context, "n", second);

        const exclusive = this.areExclusive(first, second);
        Assert.areEqual(exclusive ? 0 : 1, context.diagnosticCollector.diagnostics.length);
      }
  }

  @TestMethod
  @TestData(false)
  @TestData(true)
  public matchesThePairwiseRuleAcrossRepeatedRegistrations(reverse: boolean): void {
    const paths: Map<number, number>[] = [];
    this.collectBranchPaths(paths, new Map(), 3);
    if (reverse)
      paths.reverse();

    const context = new RegexParserContext(new Source(String.empty));
    const registrations: Map<string, Map<number, number>[]> = new Map();
    let diagnosticCount = 0;

    for (let index = 0; index < paths.length; index++) {
      const path = paths[index]!;
      const name = `name${index % 3}`;
      const previous = registrations.get(name) ?? [];
      const conflict = previous.some(t => !this.areExclusive(t, path));
      if (conflict)
        diagnosticCount++;

      this.register(context, name, path);
      Assert.areEqual(diagnosticCount, context.diagnosticCollector.diagnostics.length);
      previous.push(path);
      registrations.set(name, previous);
    }
  }

  @TestMethod
  @TestData(8_000)
  @TestData(16_000)
  @TestData(32_000)
  public acceptsWideDisjointAlternativesAndFindsTheFollowingConflict(count: number): void {
    const alternatives = Array<string>(count).fill("(?<n>a)").join("|");
    const result = RegexParserFixture.parse(`(?:${alternatives})(?<n>b)`, "u");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1024", result.diagnostics[0]?.code.displayText);
  }

  private areExclusive(first: Map<number, number>, second: Map<number, number>): boolean {
    return Array.from(first.keys()).some(t => second.has(t) && first.get(t) !== second.get(t));
  }

  private collectBranchPaths(paths: Map<number, number>[], current: Map<number, number>, depth: number): void {
    paths.push(new Map(current));
    if (depth === 0)
      return;

    for (let sequenceIndex = 0; sequenceIndex < 2; sequenceIndex++) {
      const disjunctionIndex = this.nextDisjunctionIndex++;
      for (let alternativeIndex = 0; alternativeIndex < 2; alternativeIndex++) {
        current.set(disjunctionIndex, alternativeIndex);
        this.collectBranchPaths(paths, current, depth - 1);
        current.delete(disjunctionIndex);
      }
    }
  }

  private register(context: RegexParserContext, name: string, path: Map<number, number>): void {
    for (const [disjunctionIndex, alternativeIndex] of path)
      context.enterAlternative(disjunctionIndex, alternativeIndex);

    context.registerNamedCapturingGroup(name, new SourceSpan(0, 0));

    for (let index = 0; index < path.size; index++)
      context.leaveAlternative();
  }
}
