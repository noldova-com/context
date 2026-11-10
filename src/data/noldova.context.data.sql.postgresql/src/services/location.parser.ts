/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import type { ClientConfiguration } from "../models/client-configuration.js";
import { Resources } from "../resources.js";
import type { ClientSettings } from "../types/client-settings.js";
import { ClientOptionsParser } from "./client-options.parser.js";

export class LocationParser {
  private static readonly schemes: readonly string[] = ["postgres://", "postgresql://"];

  public static parse(location: string, settings: ClientSettings = {}): ClientConfiguration {
    if (!LocationParser.schemes.some(t => location.startsWith(t)))
      throw new DataException(Resources.invalidConnectionString);

    try {
      return ClientOptionsParser.parse(location, settings);
    }
    catch {
      throw new DataException(Resources.invalidConnectionString);
    }
  }
}
