# Contributing

Welcome, and thank you for contributing to `apollo-server-logging`! This
library accepts contributions of all shapes and sizes, and we appreciate
your input.

## Suggestions and Bug Reports

If you are having a problem, or want to suggest something that this
project can do, please [create an issue][] if one
[hasn't already been created][].

## Code Contributions

Want to contribute some code? Make a pull request, and ensure tests/lint
checks/type checks pass. We use [conventional commits][] for our commit
message formatting, so you should ensure you are using the right scopes
and types for your changes. `feat:` and `fix:` commits cause a new
release, and all other commit types are ignored. The scope is completely
optional, and you should only use it if you are absolutely sure of the
scope of your changes, or you wish to group a number of commits
together. Scopes must be `kebab-case` and have no spaces or capital
letters.

Commit messages should also follow a similar format to
https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53.

We use [Yarn Zero-Installs][] to install dependencies. This means you
shouldn't need to install anything before running commands. Run `yarn run`
to view a list of all commands.

### Git Workflow

We run `eslint`, `prettier`, `jest`, and `commitlint` whenever you
commit to this repository. These tools are also run in CI to ensure they
are running locally.

[create an issue]: https://github.com/tubbo/apollo-server-logging/issues/new/choose
[hasn't already been created]: https://github.com/tubbo/apollo-server-logging/issues
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/
[yarn zero-installs]: https://yarnpkg.com/features/zero-installs
