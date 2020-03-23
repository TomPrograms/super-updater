const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const phin = require("phin");
const chalk = require("chalk");
const Queue = require("promise-queue");

var queue = new Queue(1, Infinity);

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

  return data.body["dist-tags"].latest;
};

const updatePackages = async function (packages) {
  // get all package versions
  let newPackages = [];
  packages.forEach((package) => {
    newPackages.push(
      new Promise(function (resolve, reject) {
        getPackageVersion(package.name)
          .then((version) => {
            package.version = version;
            resolve(package);
          })
          .catch((error) => {
            console.log(chalk.red(`Skipping ${package.name} - couldn't find it in the NPM registry.`));
            resolve(error);
          });
      })
    );
  });

  newPackages = await Promise.all(newPackages);
  newPackages = newPackages.filter((promise) => !(promise instanceof Error));

  newPackages.forEach((newPackage) => {
    queue.add(
      () =>
        new Promise(function (resolve, reject) {
          if (newPackage.current === newPackage.version) {
            console.log(`"${newPackage.name}" is up to date with version ${newPackage.current}`);
            resolve();
          } else {
            console.log(chalk.blue(`Updating "${newPackage.name}" version ${newPackage.current} to version ${newPackage.version}`));
            runCommand(`npm install ${newPackage.name}@${newPackage.version}`)
              .then(() => {
                console.log(chalk.green(`Updated "${newPackage.name}" to version ${newPackage.version}`));
                resolve();
              })
              .catch((error) => {
                console.log(`An error occurred while attempting to update ${newPackage.name}`);
              });
          }
        })
    );
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
