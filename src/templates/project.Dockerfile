FROM wordpress:{{WP_TAG}}

RUN rm -rf /usr/src/wordpress/wp-content/plugins/* \
    && rm -rf /usr/src/wordpress/wp-content/themes/*

RUN apt-get update && apt-get install -y libmemcached-dev zlib1g-dev default-mysql-client less \
    && pecl install xdebug memcached \
    && docker-php-ext-enable xdebug memcached

RUN echo "xdebug.mode=debug" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Raise the upload limit to 2G (WP caps at min(upload_max_filesize, post_max_size);
# the PHP default post_max_size is only 8M, so both must be raised together).
RUN { \
        echo "upload_max_filesize = 2048M"; \
        echo "post_max_size = 2048M"; \
        echo "memory_limit = 2048M"; \
        echo "max_execution_time = 300"; \
        echo "max_input_time = 300"; \
    } > /usr/local/etc/php/conf.d/uploads.ini

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp
