/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "../models/nodes/node.js";

export type NodeType<TNode extends Node = Node> = { readonly prototype: TNode; };
