# Pipelog

English | [中文](README.zh-CN.md)

## Overview
Pipelog is a small logging helper that writes formatted output into a named pipe (FIFO). It is designed for debugging workflows where you want to stream logs to another process without stdout/stderr interference. The project was originally built to debug the OpenCode plugin.

## Features
- Write logs to a FIFO file with timestamped lines
- Serialize objects with `util.inspect`
- Single-instance factory to avoid duplicate streams
- Works with Node.js file system APIs and Bun runtime

## Requirements
- A POSIX environment that supports named pipes (e.g. macOS, Linux)
- Node.js or Bun runtime

## Installation
```sh
bun add pipelog
npm install pipelog
pnpm add pipelog
yarn add pipelog
```

## Usage
Create and remove the FIFO file manually in your shell, then write log entries from TypeScript.

```sh
mkfifo /tmp/pipelog-example
```

```ts
import { Pipelog } from "pipelog";

const pipepath = "/tmp/pipelog-example";
const logger = Pipelog.factory(pipepath);
logger.log("Hello, Pipelog!");
logger.log({ scope: "pipe", ok: true });
```

Read from another process:
```sh
cat /tmp/pipelog-example
```

When you are done, remove the FIFO:
```sh
rm /tmp/pipelog-example
```

## API

### `Pipelog.factory(pipepath, options?)`
Creates or returns a singleton instance.
- `pipepath`: string, required
- `options.encoding`: `BufferEncoding`, optional (default `utf8`)

### `Pipelog.getInstance()`
Returns the existing instance if it was created.

### `log(...message)`
Writes each payload as a new line with an ISO timestamp prefix.

### `destroy()`
Closes the underlying write stream and resets the singleton.

## Development
Install dependencies:
```sh
bun install
```

Run tests:
```sh
bun test ./src/test.ts
```

Build with Bun (minified):
```sh
bun build src/index.ts --target node --format esm --minify --outdir dist
```

## License
MIT

## Contributing
Issues and pull requests are welcome. Please include tests or reproduction steps where relevant.
