FROM node:22-alpine

LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /app

COPY . .

# 安装依赖并构建前端
RUN npm install && \
    cd server && npm install && \
    cd ../client && npm install && npm run build && \
    mkdir -p ../server/public && \
    cp -r build/* ../server/public/ && \
    cd ..

EXPOSE 8080

# 设置端口环境变量
ENV PORT=8080

CMD ["node", "server/src/index.js"]

