/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "../models/nodes/node.js";
import type { ValueNode } from "../models/nodes/value.node.js";
import type { SourceSpan } from "../models/sources/source-span.js";
import type { NodeType } from "./node-type.js";

export type ValueNodeType<TNode extends ValueNode = ValueNode> = NodeType<TNode> & (new (span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) => TNode);
