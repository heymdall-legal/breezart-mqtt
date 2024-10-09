FROM oven/bun:1.1.24
WORKDIR /src
COPY package.json ./
COPY bun.lockb ./
RUN bun install
COPY . .

CMD bun run start
