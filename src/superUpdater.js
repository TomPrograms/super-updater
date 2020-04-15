const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const phin = require("phin");
const chalk = require("chalk");
const Queue = require("promise-queue");

const queue = new Queue(1, Infinity);

const runCommand = function (command) {
  return new Promise(function (resolve, reject) {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(stderr);
      else resolve(stdout);
    });
  });
};

const getPackageVersion = async function (name) {
  let data = await phin({
    url: `https://registry.npmjs.org/${name}`,
    parse: "json",
  });

  if (data.body.error === "Not found") {
    throw new Error("PACKAGE-404");
  }

  return data.body["dist-tags"].latest;
};

const updatePackages = function (packages) {
  // get all package versions
  const updatePackage = function (package) {
    return new Promise(function (resolve, reject) {
      getPackageVersion(package.name)
        .then((version) => {
          if (package.current === version) {
            console.log(`"${package.name}" is up to date with version ${package.current}`);
            resolve();
          } else {
            console.log(chalk.blue(`Updating "${package.name}" version ${package.current} to version ${version}`));
            runCommand(`npm install ${package.name}@${version}`)
              .then(() => {
                console.log(chalk.green(`Updated "${package.name}" to version ${version}`));
                resolve();
              })
              .catch((error) => {
                console.log(`An error occurred while attempting to update ${package.name}`);
                reject(error);
              });
          }
        })
        .catch((error) => {
          if (error.message === "PACKAGE-404" || error.message === "Cannot read property 'latest' of undefined") {
            console.log(chalk.red(`Skipping ${package.name} - couldn't find it in the NPM registry.`));
          } else reject(error);
        });
    });
  };

  packages.forEach((package) => {
    queue.add(() => updatePackage(package));
  });
};

function adaptVersion(version) {
  if (version[0] === "^") version = version.substring(1, version.length);
  return version;
}

const superUpdater = function (path, noMain = false, noDev = false) {
  fs.readFile(path, function (error, data) {
    if (error) throw error;
    try {
      data = JSON.parse(data.toString());
    } catch (error) {
      throw new Error("Couldn't parse data in target file.");
    }

    if (data.lockfileVersion === 1) {
      throw new Error("You must provide a package.json file as the target.");
    }

    let toCheck = [];
    let dependencies = data.dependencies || {};
    let devDependencies = data.devDependencies || {};

    function getDependencies(list) {
      let keys = Object.keys(list);
      let toReturn = [];
      keys.forEach((key) => {
        toReturn.push({
          current: adaptVersion(list[key]),
          name: key,
        });
      });
      return toReturn;
    }

    if (!noMain) {
      toCheck = toCheck.concat(getDependencies(dependencies));
    }

    if (!noDev) {
      toCheck = toCheck.concat(getDependencies(devDependencies));
    }

    updatePackages(toCheck);
  });
};

const parseArguments = function (args) {
  args = args.splice(2);

  let target;
  let noMain = false;
  let noDev = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--no-main") noMain = true;
    if (args[i] === "--no-dev") noDev = true;
    if (args[i] === "-t") {
      i++;
      target = args[i];
    }
  }

  if (!target) throw new Error("You must provide a package.json target with -t.");
  if (!path.isAbsolute(target)) {
    target = path.resolve(target);
  }

  superUpdater(target, noMain, noDev);
};

module.exports = superUpdater;
module.exports.argumentsParser = parseArguments;
