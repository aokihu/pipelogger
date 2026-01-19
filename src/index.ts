/**
 * Pipelog
 * @author aokihu <aokihu@gmail.com>
 * @version 1.0.0
 */

import { createWriteStream, type WriteStream } from "node:fs";
import { inspect } from "node:util";

/**
 * @class Pipelog
 */
export class Pipelog {
  private static instance: Pipelog | null = null;

  private readonly _pipepath: string;
  private readonly _pipeStream: WriteStream;
  private readonly _encoding: BufferEncoding;

  private constructor(
    pipepath: string,
    options: { encoding?: BufferEncoding } = {},
  ) {
    this._pipepath = pipepath;
    this._encoding = options.encoding ?? "utf8";
    this._pipeStream = createWriteStream(pipepath, {
      flags: "a",
      encoding: this._encoding,
    });
  }

  static factory(pipepath: string, options?: { encoding?: BufferEncoding }) {
    if (!pipepath) {
      throw new Error("The pipepath is required");
    }

    if (!Pipelog.instance) {
      Pipelog.instance = new Pipelog(pipepath, options);
    }

    return Pipelog.instance;
  }

  static getInstance() {
    return Pipelog.instance ?? undefined;
  }

  private _formatPayload(payload: unknown) {
    if (typeof payload === "string") return payload;
    return inspect(payload, { depth: null });
  }

  private _writeStream(content: string) {
    this._pipeStream.write(content, this._encoding);
  }

  /**
   * Print log output
   * @param message {any[]} The print message;
   */
  log(...message: unknown[]) {
    const timestamp = new Date().toISOString();
    message.forEach((payload) => {
      const formatted = this._formatPayload(payload);
      this._writeStream(`[${timestamp}] ${formatted}\n`);
    });
  }

  destroy() {
    this._pipeStream.end();
    Pipelog.instance = null;
  }
}
