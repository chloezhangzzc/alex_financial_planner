FROM --platform=linux/amd64 python:3.12-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright MCP server at build time (avoid runtime npx downloads in App Runner)
COPY package.json ./
RUN npm install --omit=dev

# Install Chromium browser + system deps at build time into a stable location
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN ./node_modules/.bin/playwright install --with-deps chromium && chmod -R 755 /ms-playwright

# Install Python package manager
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./

# Install Python dependencies during build
# uv will automatically install packages for the container's architecture (linux/amd64)
RUN uv sync --frozen --no-install-project

# Copy application code
COPY *.py ./

# Expose port
EXPOSE 8000

# Run the application (dependencies already installed)
CMD ["uv", "run", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]