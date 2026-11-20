/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { TypeScriptDeferredRecords } from "@noldova/context.parsers.typescript/models/typescript-deferred-records.js";
import { TypeScriptReparsedRegion } from "@noldova/context.parsers.typescript/models/typescript-reparsed-region.js";
import { TypeScriptRegionSplicer } from "@noldova/context.parsers.typescript/services/typescript-region-splicer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptRegionSplicerTests {
  @TestData("", "a,b,c,d,e")
  @TestData("0:2", "r0,b,c,d,e")
  @TestData("3:5", "a,r0,d,e")
  @TestData("3:5,12:2", "a,r0,d,r1")
  @TestData("0:14", "r0")
  @TestMethod
  public splicesEachRegionInPlaceOfTheStatementsItCovers(regionSpans: string, expected: string): void {
    const statements = TypeScriptParser.parse("a; b; c; d; e;").rootNode.children;
    const replacements = TypeScriptParser.parse("r0; r1;").rootNode.children;
    const labels = new Map<Node, string>([...statements.map((t, i): [Node, string] => [t, "abcde".charAt(i)]),
      ...replacements.map((t, i): [Node, string] => [t, `r${i}`])]);
    const regions = TypeScriptRegionSplicerTests.parseSpans(regionSpans).map((t, i) => TypeScriptRegionSplicerTests.createRegion(t, replacements.slice(i, i + 1)));

    const spliced = TypeScriptRegionSplicer.spliceStatements(statements, regions);

    Assert.areEqual(expected, spliced.map(t => labels.get(t)).join());
  }

  @TestData("a;b;c;", "0:2", "0:2")
  @TestData("a;b;c;", "4:2", "4:2")
  @TestData("a;b;c;d;", "0:4,6:2", "0:4,6:2")
  @TestData("a;/*t*/b;", "0:2", "0:2")
  @TestData("a;/*t*/b;c;", "0:9", "0:9")
  @TestMethod
  public measuresEachRegionUpToTheStatementThatFollowsIt(content: string, regionSpans: string, expected: string): void {
    const rootNode = TypeScriptParser.parse(content).rootNode;
    const regions = TypeScriptRegionSplicerTests.parseSpans(regionSpans).map(t => TypeScriptRegionSplicerTests.createRegion(t, []));

    const spans = TypeScriptRegionSplicer.measureReplacedSpans(rootNode.children, regions, rootNode.span.endOffset);

    Assert.areEqual(expected, spans.map(t => `${t.startOffset}:${t.length}`).join());
  }

  @TestMethod
  public readsEachSpanAFixedNumberOfTimesForAManyRegionSource(): void {
    const count = 4000;
    let reads = 0;
    const counter: ProxyHandler<object> = {
      get(target, key, receiver): unknown {
        if (key === "span")
          reads += 1;
        return Reflect.get(target, key, receiver);
      },
    };
    const children = TypeScriptParser.parse("a;".repeat(count)).rootNode.children;
    const statements = children.map(t => new Proxy<Node>(t, counter));
    const regions = children.filter((_, i) => i % 2 === 1)
      .map(t => new Proxy<TypeScriptReparsedRegion>(TypeScriptRegionSplicerTests.createRegion(t.span, [t]), counter));
    const limit = 8 * (statements.length + regions.length);

    reads = 0;
    const spliced = TypeScriptRegionSplicer.spliceStatements(statements, regions);
    const splicingReads = reads;
    reads = 0;
    const spans = TypeScriptRegionSplicer.measureReplacedSpans(statements, regions, count * 2);
    const measuringReads = reads;

    Assert.areEqual(count, spliced.length);
    Assert.areEqual(regions.length, spans.length);
    Assert.isTrue(splicingReads <= limit, `Splicing read ${splicingReads} spans, above ${limit}.`);
    Assert.isTrue(measuringReads <= limit, `Measuring read ${measuringReads} spans, above ${limit}.`);
  }

  private static createRegion(span: SourceSpan, statements: readonly Node[]): TypeScriptReparsedRegion {
    return new TypeScriptReparsedRegion(statements, [], span, new TypeScriptDeferredRecords());
  }

  private static parseSpans(text: string): SourceSpan[] {
    return text === "" ? [] : text.split(",").map(t => {
      const [start, length] = t.split(":").map(Number);
      return new SourceSpan(start ?? 0, length ?? 0);
    });
  }
}
