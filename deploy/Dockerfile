FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
FROM php:8.4-fpm-alpine AS php
RUN apk add --no-cache libpq-dev libpng-dev libjpeg-turbo-dev libwebp-dev freetype-dev oniguruma-dev $PHPIZE_DEPS && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype && docker-php-ext-install pdo_pgsql gd mbstring pcntl && pecl install redis && docker-php-ext-enable redis
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY deploy/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
WORKDIR /var/www/backend
COPY backend/ ./
COPY frontend/public/products.json /var/www/frontend/public/products.json
COPY frontend/src/taxonomy-seed.json /var/www/frontend/src/taxonomy-seed.json
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app/product-media bootstrap/cache && chown -R www-data:www-data storage bootstrap/cache
USER www-data
FROM nginx:alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /build/frontend/dist /var/www/frontend
COPY backend/public /var/www/backend/public
