/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Enumerable, type IReadOnlyDictionary, type IReadOnlyList, List } from "@noldova/context.collections";
import { JsonReader } from "@noldova/context.json";
import { SourcePosition } from "@noldova/context.parsers";

import { BuildHost } from "../../services/build-host.js";
import type { PositionMap } from "../models/position-map.js";
import type { SourceMapping } from "../models/source-mapping.js";
import { PluginResources } from "../plugin-resources.js";
import { Base64Vlq } from "./base64-vlq.js";
import { PluginHost } from "./plugin-host.js";

export class SourceMapComposer {
  public static async composeAsync(outputDirectory: string, maps: IReadOnlyDictionary<string, PositionMap>): Promise<void> {
    for (const path of await PluginHost.listFilesAsync(outputDirectory, PluginResources.sourceMapExtension)) {
      const reader = JsonReader.parse(await BuildHost.readAsync(path), path);
      const folder = BuildHost.folderOf(path);
      const root = BuildHost.resolve(folder, reader.readOptionalString(PluginResources.sourceRootField) ?? "");
      const paths = Enumerable.from(reader.readStringArray(PluginResources.sourcesField)).select(t => BuildHost.resolve(root, t)).toList();
      if (!paths.any() || !paths.all(t => maps.containsKey(t)))
        continue;

      const sourceMaps = paths.select(t => maps.get(t)).toList();
      const sources = new List<string>();
      const lines = Base64Vlq.decode(reader.readString(PluginResources.mappingsField)).select(line => line.select(t => SourceMapComposer.compose(t, sourceMaps, sources)).toList()).toList();
      await PluginHost.writeAsync(path, JSON.stringify({
        version: reader.readInteger(PluginResources.versionField),
        file: reader.readOptionalString(PluginResources.fileField),
        sources: sources.select(t => PluginHost.relativePath(folder, t)).toArray(),
        names: reader.readStringArray(PluginResources.namesField),
        mappings: Base64Vlq.encode(lines)
      }));
    }
  }

  private static compose(mapping: SourceMapping, maps: IReadOnlyList<PositionMap>, sources: List<string>): SourceMapping {
    const map = maps.tryGet(mapping.sourceIndex);
    if (!mapping.hasSource || Object.isUndefined(map))
      return mapping;

    const original = map.originalOf(new SourcePosition(mapping.line, mapping.character));
    if (!sources.contains(original.path))
      sources.add(original.path);

    return mapping.withSource(sources.indexOf(original.path), original.position.lineIndex, original.position.characterIndex);
  }
}
