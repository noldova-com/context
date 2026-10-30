/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptNameReservation } from "../enums/typescript-name-reservation.js";

export class TypeScriptReservedBindingName {
  public readonly hasEnclosingClass: boolean;
  public readonly isAwaitContext: boolean;
  public readonly isSourceTopLevel: boolean;
  public readonly nameNode: Node;
  public readonly reservation: TypeScriptNameReservation;

  public constructor(nameNode: Node, reservation: TypeScriptNameReservation, hasEnclosingClass: boolean, isAwaitContext: boolean,
    isSourceTopLevel: boolean) {
    this.nameNode = nameNode;
    this.reservation = reservation;
    this.hasEnclosingClass = hasEnclosingClass;
    this.isAwaitContext = isAwaitContext;
    this.isSourceTopLevel = isSourceTopLevel;
  }
}
