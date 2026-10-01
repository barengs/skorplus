# 1. Gunakan PHP versi 8.4
FROM php:8.4-fpm

# 2. Tambahkan libzip-dev ke daftar apt-get, dan zip ke daftar ekstensi PHP
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    libzip-dev \
    libwebp-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip

# 3. Mencegah error "dubious ownership" dari Git saat Composer berjalan
RUN git config --global --add safe.directory '*'

# 4. Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set working directory
WORKDIR /var/www/html