# 42wp — 42WP dev environments

> *O Guia do Mochileiro do WordPress* — a tiny CLI that spins up disposable
> WordPress dev environments with Docker, the 42WP way.

`42wp` runs a shared **global layer** (Traefik reverse proxy + MySQL + phpMyAdmin +
Mailpit) and, on top of it, **per-project** WordPress containers reachable at
`http://<project>.localhost`. Your current working directory is mounted as
`wp-content`, so you develop your theme/plugin locally and WordPress runs in a
container with Xdebug, Memcached and WP-CLI preinstalled.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with the Compose v2 plugin (`docker compose`)
- Node.js **>= 18.17**

## Install

```bash
npm install -g @42wp/dev-env
```

This installs the `42wp` command globally.

## Usage

```bash
42wp global start          # start Traefik + MySQL + phpMyAdmin + Mailpit
42wp start <project>       # build & start a project (run from your theme/plugin repo)
42wp update <project>      # update an existing project to a newer WordPress image
42wp wp <project> <args>   # run a WP-CLI command inside the project container
42wp stop <project>        # stop a project's containers
42wp global stop           # tear the global layer down
```

Run `42wp` with no arguments for the full command list.

### WordPress version

By default projects are built on **`wordpress:php8.4-apache`** (newest WordPress,
PHP 8.4, Apache). Pick a different image tag per project with `--wp <tag>`:

```bash
42wp start my-theme --wp latest             # newest WP, image's default PHP
42wp start legacy   --wp 6.9-php8.5-apache  # pin a specific WP + PHP
42wp update my-theme                        # rebuild on the default tag, run wp core update-db
42wp update my-theme --wp php8.5-apache     # update to a specific image
```

`update` rewrites the project's Dockerfile, re-pulls the base image, recreates the
container and runs `wp core update-db` to migrate the schema. Set a different
default for every project with the `FORTYTWO_WP_TAG` env var.

### Admin credentials

The silent install creates an `admin` / `password` user by default. Override per
project on `start`:

```bash
42wp start my-theme --user joao --pass s3cr3t
```

### WordPress VIP (mu-plugins)

WPVIP sites expect the VIP Go mu-plugins under `wp-content/mu-plugins`. Pass
`--vip` to `start` and the tool clones
[`vip-go-mu-plugins-built`](https://github.com/Automattic/vip-go-mu-plugins-built)
(shallow) and mounts it into the container at `wp-content/mu-plugins`:

```bash
42wp start my-vip-site --vip
```

The clone lives in the project's data dir (`~/.42wp/projects/<name>/mu-plugins`),
so it never touches your repo, and re-running `start` fast-forwards it. Regular
(non-VIP) projects are unaffected.

### Example

```bash
cd ~/code/my-theme
42wp global start
42wp start my-theme
# → http://my-theme.localhost  (admin / password at /wp-admin)
42wp wp my-theme plugin list
42wp stop my-theme
```

Shared services once the global layer is up:

| Service     | URL                          |
| ----------- | ---------------------------- |
| Traefik     | http://localhost:8080        |
| phpMyAdmin  | http://db.42wp.localhost     |
| Mailpit     | http://mail.42wp.localhost   |

## How it works

State lives under `~/.42wp` (override with `FORTYTWO_HOME`):

```
~/.42wp/
  docker-compose.global.yml   # the global layer (created on first run)
  mysql-data/                 # persisted MySQL data
  projects/<project>/         # generated wp-config.php, Dockerfile, docker-compose.yml
```

`42wp start` generates an ephemeral `wp-config.php` (fetching real salts from
api.wordpress.org, with a local fallback when offline), a `Dockerfile`, and a
`docker-compose.yml`, then builds the container and runs a silent
`wp core install`. The DB name is the project name with hyphens turned into
underscores; a trailing `.suffix` (e.g. `.localhost`) is stripped.

## Configuration

| Env var         | Default        | Description                                   |
| --------------- | -------------- | --------------------------------------------- |
| `FORTYTWO_HOME`   | `~/.42wp`        | Where the global compose, DB data and projects live |
| `FORTYTWO_WP_TAG` | `php8.4-apache`  | Default WordPress image tag for new projects (overridden by `--wp`) |
| `FORTYTWO_LANG`   | auto (`LANG`)    | UI language: `en` or `pt`                   |
| `NO_COLOR`        | unset            | Disable colored output                      |

You can also pass `--lang en` / `--lang pt` before the command.

## License

MIT
