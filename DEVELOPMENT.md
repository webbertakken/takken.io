# Development

## Prerequisites

- [mise](https://mise.jdx.dev/) (Node version is pinned in `mise.toml`; Yarn is activated via
  Corepack from `package.json` `packageManager`)

## Setup

### Install dependencies

```shell
yarn
```

### Environment variables

Create a `.env` file in the root of the project using the following command

```shell
cp .env.dist .env
```

Now fill the `.env` file with the correct values.

## Develop

```shell
yarn dev
```

## Test

```shell
yarn coverage
```

## Deploy

Merge a PR for it to be deployed to production

## Upgrading tools

Upgrade Node

```shell
mise use node@lts
```

Upgrade Yarn

```shell
yarn set version stable
# `packageManager` in package.json is updated automatically by `yarn set version`.
```
