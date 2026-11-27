/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SqlDialect } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class PostgreSQLDialect extends SqlDialect {
  public override formatBeginTransaction(): string {
    return Resources.beginTransaction;
  }

  public override formatColumnType(type: PropertyType): string {
    return type === PropertyType.Integer ? Resources.integerType : Resources.textType;
  }

  public override formatIdentityColumnType(): string {
    return Resources.identityColumnType;
  }

  public override formatLock(resource: string): readonly string[] {
    return [Resources.formatAdvisoryLock(resource.replaceAll(Resources.stringQuote, Resources.escapedStringQuote))];
  }
}
