# Pipelog

[English](README.md) | 中文

## 概述
Pipelog 是一个将日志输出写入命名管道（FIFO）的轻量工具，适合需要将日志流转发到其他进程的调试场景，避免干扰标准输出。这个项目最初是为了调试 OpenCode 插件而开发。

## 特性
- 以时间戳前缀写入管道
- 使用 `util.inspect` 序列化对象
- 单例工厂，避免重复写入流
- 兼容 Node.js 文件系统 API 与 Bun 运行时

## 环境要求
- 支持命名管道的 POSIX 系统（例如 macOS、Linux）
- Node.js 或 Bun 运行时

## 安装
```sh
bun add pipelog
npm install pipelog
pnpm add pipelog
yarn add pipelog
```

## 使用
请在 shell 中手动创建和删除命名管道，然后在 TypeScript 中写入日志。

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

另一个进程读取：
```sh
cat /tmp/pipelog-example
```

使用完毕后删除管道：
```sh
rm /tmp/pipelog-example
```

## API
### `Pipelog.factory(pipepath, options?)`
创建或返回单例实例。
- `pipepath`: string，必填
- `options.encoding`: `BufferEncoding`，可选（默认 `utf8`）

### `Pipelog.getInstance()`
返回已创建的实例。

### `log(...message)`
将每个参数作为一行写入，并带 ISO 时间戳前缀。

### `destroy()`
关闭写入流并清理单例。

## 开发
安装依赖：
```sh
bun install
```

运行测试：
```sh
bun test ./src/test.ts
```

使用 Bun 构建（压缩）：
```sh
bun build src/index.ts --target node --format esm --minify --outdir dist
```

## 许可协议
MIT

## 贡献
欢迎提交 Issue 或 PR。请尽量提供复现步骤或测试。
