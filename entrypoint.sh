#!/bin/bash

# Sealos DevBox 应用启动脚本
# 注意：此脚本仅用于启动应用，所有构建步骤已在开发环境/Dockerfile中完成

# 设置错误时退出
set -e

# 启动 Node.js Express 服务器
# 端口从环境变量 PORT 读取，默认为 8080
# 监听在 0.0.0.0 而不是 localhost，确保外部可访问
NODE_ENV=production node server/src/index.js



