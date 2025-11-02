FROM node:22-alpine

LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /app

COPY . .

# 安装依赖并构建前端
# 设置NODE_ENV=production确保前端构建时使用生产配置
RUN npm install && \
    cd server && npm install && \
    cd ../client && NODE_ENV=production npm install && NODE_ENV=production npm run build && \
    mkdir -p ../server/public && \
    cp -r build/* ../server/public/ && \
    cd ..

EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server/src/index.js"]

