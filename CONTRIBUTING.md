# Contributing

## How to Contribute

#### Code of Conduct

This repository has adopted the Contributor Covenant as it's Code of Conduct. It is expected that
participants adhere to it.

#### Proposing a Change

If you are unsure about whether or not a change is desired, you can create an issue. This is useful
because it creates the possibility for a discussion that's visible to everyone.

When fixing a bug it is fine to submit a pull request right away.

#### Sending a Pull Request

Steps to be performed to submit a pull request:

1. Fork the repository and create your branch from `main`.
2. Run `yarn` in the repository root.
3. If you've fixed a bug or added code that should be tested, add tests!
4. Fill out the description, link any related issues and submit your pull request.

#### Pull Request Prerequisites

You use Volta to manage your Node version. (See [DEVELOPMENT.md](./DEVELOPMENT.md) for more
information)

Please note that commit hooks will run automatically to perform some tasks;

- format your code
- check for errors
- run tests

#### Windows users

Make sure your editor and terminal that run the tests are set to `Powershell 7` or above with
`Git's Unix tools for Windows` installed. Some tests require you to be able to run `sh` and other
unix commands.

#### License

By contributing to this repository, you agree that your contributions will be licensed under its MIT
license.
