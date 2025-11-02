FROM node:22-alpine

LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /app

COPY . .

# 安装依赖并构建前端
# 注意：安装依赖时不设置NODE_ENV=production，否则会跳过devDependencies
# react-scripts在devDependencies中，构建时需要它
RUN npm install && \
    cd server && npm install && \
    cd ../client && npm install && \
    NODE_ENV=production npm run build && \
    mkdir -p ../server/public && \
    cp -r build/* ../server/public/ && \
    cd ..

EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server/src/index.js"]

