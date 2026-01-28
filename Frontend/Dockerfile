# --- build stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

RUN npm install

# Copy frontend source
COPY . .

RUN npm run build

# --- runtime stage ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
