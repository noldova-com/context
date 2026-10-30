/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserException } from "../exceptions/parser.exception.js";
import { EndOfFileNode } from "../models/nodes/end-of-file.node.js";
import type { Node } from "../models/nodes/node.js";
import type { ParserContext } from "../models/parser-context.js";
import { ParserResult } from "../models/parser-result.js";
import { Resources } from "../resources.js";
import type { NodeType } from "../types/node-type.js";
import type { Lexer } from "./lexer.js";

export abstract class Parser<TNode extends Node, TContext extends ParserContext = ParserContext> {
  private readonly lexer: Lexer;
  private hasParsed: boolean = false;
  private lexedNode: Node;

  public readonly context: TContext;

  protected constructor(context: TContext, lexer: Lexer) {
    if (lexer.diagnosticCollector !== context.diagnosticCollector)
      throw new ParserException(Resources.parserLexerCollectorInvalid);

    this.context = context;
    this.lexer = lexer;
    this.lexedNode = lexer.lex();
  }

  public get currentNode(): Node {
    return this.lexedNode;
  }

  public get isEndOfFile(): boolean {
    return this.lexedNode instanceof EndOfFileNode;
  }

  public parse(): ParserResult<TNode> {
    if (this.hasParsed)
      throw new ParserException(Resources.parserAlreadyUsed);

    this.hasParsed = true;
    const rootNode = this.parseRootNode();
    if (!this.isEndOfFile)
      throw new ParserException(Resources.parserInputRemains);

    return new ParserResult(rootNode, this.context.diagnosticCollector.diagnostics);
  }

  public advance(): void {
    if (this.isEndOfFile)
      return;

    this.lexedNode = this.lexer.lex();
  }

  public tryConsume<TCurrentNode extends Node>(type: NodeType<TCurrentNode>): TCurrentNode | undefined {
    const node = this.lexedNode;
    if (!Parser.hasType(node, type))
      return undefined;

    this.advance();
    return node;
  }

  public requireCurrentNode<TCurrentNode extends Node>(type: NodeType<TCurrentNode>): TCurrentNode {
    const node = this.lexedNode;
    if (!Parser.hasType(node, type))
      throw new ParserException(Resources.currentNodeTypeInvalid);

    return node;
  }

  public lookAhead(action: () => boolean): boolean {
    const node = this.lexedNode;
    const diagnosticCount = this.context.diagnosticCollector.diagnostics.length;
    const readerOffset = this.lexer.reader.currentOffset;
    try {
      return action();
    }
    finally {
      this.rewindTo(node, diagnosticCount, readerOffset);
    }
  }

  public tryParse<TResult>(action: () => TResult | undefined): TResult | undefined {
    const node = this.lexedNode;
    const diagnosticCount = this.context.diagnosticCollector.diagnostics.length;
    const readerOffset = this.lexer.reader.currentOffset;
    let accepted = false;
    try {
      const result = action();
      accepted = !Object.isUndefined(result);
      return result;
    }
    finally {
      if (!accepted)
        this.rewindTo(node, diagnosticCount, readerOffset);
    }
  }

  protected reLexCurrentNode(lex: () => Node): void {
    this.lexer.reader.seek(this.lexedNode.span.startOffset);
    this.lexedNode = lex();
  }

  protected abstract parseRootNode(): TNode;

  private rewindTo(node: Node, diagnosticCount: number, readerOffset: number): void {
    this.lexedNode = node;
    this.context.diagnosticCollector.truncate(diagnosticCount);
    this.lexer.reader.seek(readerOffset);
  }

  private static hasType<TNode extends Node>(node: Node, type: NodeType<TNode>): node is TNode {
    return type.prototype.isPrototypeOf(node);
  }
}
