# Use official Node.js 20 LTS image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package dependency manifests
COPY package*.json ./

# Copy Prisma schema before npm install to support prisma postinstall if configured
COPY prisma ./prisma/

# Install dependencies inside Linux container
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client for container target architecture
RUN npx prisma generate

# Expose backend application port
EXPOSE 5000

# Start development server
CMD ["npm", "run", "dev"]