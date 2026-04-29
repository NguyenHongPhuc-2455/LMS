# Base image
FROM node:20-alpine

# Install ffmpeg and build dependencies for Prisma/Node-gyp if needed
RUN apk add --no-cache ffmpeg python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
