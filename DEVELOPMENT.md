# Development

## Prerequisites

- Volta (a lightweight zero-config tool manager,
  [installation](https://docs.volta.sh/guide/getting-started#installation))

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
volta pin node@lts
```

Upgrade Yarn

```shell
yarn set version stable
volta pin yarn
```
