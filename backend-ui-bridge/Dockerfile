FROM node:20-bullseye

# -----------------------------
# Install system dependencies
# -----------------------------
RUN apt-get update && \
    apt-get install -y \
      curl \
      ca-certificates \
      gnupg \
      pandoc && \
    rm -rf /var/lib/apt/lists/*

# -----------------------------
# Install PowerShell (pwsh)
# -----------------------------
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/microsoft.gpg && \
    echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-debian-bullseye-prod bullseye main" > /etc/apt/sources.list.d/microsoft.list && \
    apt-get update && \
    apt-get install -y powershell && \
    rm -rf /var/lib/apt/lists/*

# -----------------------------
# App setup
# -----------------------------
WORKDIR /workspace/backend-ui-bridge

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
