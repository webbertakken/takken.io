# Development

## Prerequisites

- [mise](https://mise.jdx.dev/) (Node and Yarn are pinned in `mise.toml`; the Yarn pin matches
  `packageManager` in `package.json`)

## Setup

### Install dependencies

Install the pinned tools, then the packages. Run commands in a shell with
[mise activated](https://mise.jdx.dev/getting-started.html#activate-mise), or prefix them with
`mise exec --`.

```shell
mise install
yarn install
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

Upgrade Node: pin the new version in `mise.toml`, then move `@types/node` in `package.json` to the
same major. Vercel picks its own runtime from `engines.node`, so that range must include a version
Vercel supports; the install and build still run on the `mise.toml` Node.

```shell
mise use --pin node@26
```

Upgrade Yarn: set the same version in `mise.toml` and in `packageManager` in `package.json`.

```shell
mise use yarn@4.14.1
yarn install
```
