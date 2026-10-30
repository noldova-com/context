/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { resolve } from "node:path";

import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import type { ISourceMapData } from "../../interfaces/i-source-map-data.js";
import { MappedSourceLine } from "../../models/coverage/mapped-source-line.js";
import { SourceMapSegment } from "../../models/coverage/source-map-segment.js";
import { Resources } from "../../resources.js";

export class SourceMap {
  private readonly sourcePaths: readonly string[];
  private readonly nameCount: number;
  private readonly segmentsByGeneratedLine: readonly (readonly SourceMapSegment[])[];

  public constructor(data: ISourceMapData, mapDirectory: string) {
    ArgumentException.throwIfNullOrWhitespace(mapDirectory, Resources.mapDirectoryParameter);
    if (data.version !== Resources.sourceMapVersion)
      throw new TestingException(Resources.sourceMapVersionInvalid(Resources.sourceMapVersion));

    this.sourcePaths = data.sources.map(t => resolve(mapDirectory, data.sourceRoot ?? String.empty, t)
      .replaceAll(Resources.windowsDirectorySeparator, Resources.directorySeparator));
    this.nameCount = data.names?.length ?? 0;
    this.segmentsByGeneratedLine = this.decodeMappings(data.mappings);
  }

  public mapToSource(generatedLine: number, generatedColumn: number): MappedSourceLine | undefined {
    if (!Number.isInteger(generatedLine) || generatedLine < 1)
      throw new ArgumentOutOfRangeException(Resources.generatedLineParameter, generatedLine, Resources.generatedLineInvalid);

    if (!Number.isInteger(generatedColumn) || generatedColumn < 0)
      throw new ArgumentOutOfRangeException(Resources.generatedColumnParameter, generatedColumn, Resources.generatedColumnInvalid);

    const segment = this.findSegment(generatedLine, generatedColumn);
    if (Object.isUndefined(segment?.sourcePath) || Object.isUndefined(segment.sourceLine))
      return undefined;

    return new MappedSourceLine(segment.sourcePath, segment.sourceLine + 1);
  }

  private findSegment(generatedLine: number, generatedColumn: number): SourceMapSegment | undefined {
    const segments = this.segmentsByGeneratedLine[generatedLine - 1];
    if (Object.isUndefined(segments))
      return undefined;

    let found: SourceMapSegment | undefined;
    for (const segment of segments) {
      if (segment.generatedColumn > generatedColumn)
        break;

      found = segment;
    }

    return found;
  }

  private decodeMappings(mappings: string): SourceMapSegment[][] {
    const segmentsByGeneratedLine: SourceMapSegment[][] = [];
    let sourceIndex = 0;
    let sourceLine = 0;
    let sourceColumn = 0;
    let nameIndex = 0;

    for (const lineText of mappings.split(Resources.sourceMapLineSeparator)) {
      const segments: SourceMapSegment[] = [];
      let generatedColumn = 0;
      let previousGeneratedColumn = -1;

      for (const segmentText of lineText.split(Resources.sourceMapSegmentSeparator)) {
        if (segmentText === String.empty)
          continue;

        const values = this.decodeVlqValues(segmentText);
        if (values.length !== 1 && values.length !== 4 && values.length !== 5)
          throw new TestingException(Resources.sourceMapSegmentFieldCountInvalid);

        for (const [fieldIndex, fieldValue] of values.entries()) {
          switch (fieldIndex) {
            case 0:
              generatedColumn += fieldValue;
              break;
            case 1:
              sourceIndex += fieldValue;
              break;
            case 2:
              sourceLine += fieldValue;
              break;
            case 3:
              sourceColumn += fieldValue;
              break;
            case 4:
              nameIndex += fieldValue;
              break;
          }
        }

        if (generatedColumn < 0)
          throw new TestingException(Resources.sourceMapGeneratedColumnInvalid);

        if (generatedColumn < previousGeneratedColumn)
          throw new TestingException(Resources.sourceMapGeneratedColumnOrderInvalid);

        previousGeneratedColumn = generatedColumn;

        if (values.length === 1) {
          segments.push(new SourceMapSegment(generatedColumn));
          continue;
        }

        const sourcePath = this.sourcePaths[sourceIndex];
        if (Object.isUndefined(sourcePath) || sourceLine < 0 || sourceColumn < 0)
          throw new TestingException(Resources.sourceMapOriginalPositionInvalid);

        if (values.length === 5) {
          if (nameIndex < 0 || nameIndex >= this.nameCount)
            throw new TestingException(Resources.sourceMapNameIndexInvalid);
        }

        segments.push(new SourceMapSegment(generatedColumn, sourcePath, sourceLine));
      }

      segmentsByGeneratedLine.push(segments);
    }

    return segmentsByGeneratedLine;
  }

  private decodeVlqValues(segmentText: string): number[] {
    const values: number[] = [];
    let value = 0;
    let multiplier = 1;
    let isContinued = false;

    for (const character of segmentText) {
      const digit = Resources.sourceMapBase64Alphabet.indexOf(character);
      if (digit === -1)
        throw new TestingException(Resources.sourceMapCharacterInvalid(character));

      value += (digit & Resources.sourceMapValueMask) * multiplier;
      if (!Number.isSafeInteger(value))
        throw new TestingException(Resources.sourceMapIntegerUnsupported);

      isContinued = (digit & Resources.sourceMapContinuationBit) !== 0;
      if (isContinued) {
        multiplier *= 32;
        continue;
      }

      const isNegative = value % 2 === 1;
      const magnitude = Math.floor(value / 2);
      values.push(isNegative ? -magnitude : magnitude);
      value = 0;
      multiplier = 1;
    }

    if (isContinued)
      throw new TestingException(Resources.sourceMapMappingTruncated);

    return values;
  }
}
