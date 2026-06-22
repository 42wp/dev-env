FROM wordpress:6.9-php8.5-apache

RUN rm -rf /usr/src/wordpress/wp-content/plugins/* \
    && rm -rf /usr/src/wordpress/wp-content/themes/*

RUN apt-get update && apt-get install -y libmemcached-dev zlib1g-dev default-mysql-client less \
    && pecl install xdebug memcached \
    && docker-php-ext-enable xdebug memcached

RUN echo "xdebug.mode=debug" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp
