# --- Этап 1: Установка зависимостей ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Этап 2: Сборка ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Прокидываем ARG для вшивания в JS при билде
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# --- Этап 3: Запуск (Финальный образ) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Копируем статику из public
COPY --from=builder /app/public ./public

# 2. Копируем standalone файлы (они копируются в корень /app)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 3.Создаем структуру для статики .next
# Мы берем статику из билдера и кладем её ВНУТРЬ .next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
# Запускаем через node, а не через npm (быстрее старт)
CMD ["node", "server.js"]