# Stage 1: Build & Compile Native Modules
FROM node:20.11.1-alpine3.19 AS builder

# Cài đặt các công cụ build để biên dịch native modules C/C++ (như bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt sạch các dependencies
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Khởi tạo Prisma Client
RUN npx prisma generate

# Dọn dẹp devDependencies để giảm tối đa dung lượng node_modules cho Production
RUN npm prune --production

# Stage 2: Runner Image (Thực thi)
FROM node:20.11.1-alpine3.19

# Chỉ cài đặt ffmpeg, loại bỏ python, make, g++ để tối ưu dung lượng
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app

# Tạo thư mục uploads tạm thời nếu cần
RUN mkdir -p uploads

# Copy kết quả đã build từ Stage 1
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/worker.js ./worker.js

EXPOSE 5000

CMD ["npm", "start"]
