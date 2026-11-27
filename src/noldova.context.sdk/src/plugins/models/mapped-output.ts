/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { CommandOutput } from "@noldova/context";
import type { IReadOnlyDictionary } from "@noldova/context.collections";
import { SourcePosition } from "@noldova/context.parsers";

import { BuildHost } from "../../services/build-host.js";
import { PluginResources } from "../plugin-resources.js";
import { PluginHost } from "../services/plugin-host.js";
import type { PositionMap } from "./position-map.js";

export class MappedOutput extends CommandOutput {
  private readonly output: CommandOutput;
  private readonly directory: string;
  private readonly maps: IReadOnlyDictionary<string, PositionMap>;

  public constructor(output: CommandOutput, directory: string, maps: IReadOnlyDictionary<string, PositionMap>) {
    super();
    this.output = output;
    this.directory = directory;
    this.maps = maps;
  }

  public override writeLine(text: string): void {
    this.output.writeLine(this.map(text));
  }

  public override writeErrorLine(text: string): void {
    this.output.writeErrorLine(this.map(text));
  }

  private map(text: string): string {
    return text.replace(PluginResources.compilerLocationPattern, (whole: string, path: string, line: string, character: string, rest: string) => {
      const map = this.maps.tryGet(BuildHost.resolve(this.directory, path));
      if (Object.isUndefined(map))
        return whole;

      const original = map.originalOf(new SourcePosition(Number(line) - 1, Number(character) - 1));

      return PluginResources.formatCompilerLocation(PluginHost.relativePath(this.directory, original.source.path), original.position.lineIndex + 1, original.position.characterIndex + 1, rest);
    });
  }
}
