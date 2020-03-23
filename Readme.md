<div align="center">
  <img src="./docs/logo.png" alt="Super Updater logo">

  <p>Super updater is the best solution for updating your NPM packages. Super updater is a simple and reliable way to update your NPM packages; super updater also updates dev dependencies and eliminates the standard NPM updater's lag time.</p>

  <a href="https://npmjs.com/package/super-updater">
    <img src="https://img.shields.io/npm/v/super-updater">
  </a>

  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue">
  </a>
</div>

<br>

## Inspiration

I wanted a fast and quick solution in order to update all my NPM dependencies, while hopefully eliminating a lag time I sometimes experienced with packages which had just been updated, so I built super updater. Super updater allows you to update all your NPM dependencies quickly and reliably.

## Design

Super updater and only updates the packages in `package.json`, and only if the version specified in the `package.json` doesn't match the version of the most recent release defined on the NPM repository. Super updater attempts to eliminate the standard NPM updater's lag time by directly querying the NPM repository for package information.

## Usage

You can install super updater through the NPM repository. We recommend using the `-g` flag so super-updater can be used anywhere on your computer.

```
npm i -g super-updater
```

To update the dependencies in a `package.json`, you can use super updater and specify a target `package.json` with the `-t` argument. If you installed super updater globally you can use the following command:

```
super-updater -t package.json
```

If you didn't install super updater globally you will have to go to an environment that has super-updater installed and use the following command instead. This applies to all commands.

```
npx super-updater -t package.json
```

You can allow new updates to be started and checked for before the previous update is finished with the `--async` flag. This may cause errors.

```
super-updater -t package.json --async
```

If you don't want to update dev dependencies, you can supply the `--no-dev` argument.

```
super-updater -t package.json --no-dev
```

If you don't want to update the main dependencies, you can supply the `--no-main` argument.

```
super-updater -t package.json --no-main
```

## Credit

Author: [Tom](https://github.com/TomPrograms)

## License

[MIT](./LICENSE)
