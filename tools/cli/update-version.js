/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { execCommand, getAbsolutePath, replaceContentInFile, versionDiff } = require("./utils");
const fs = require("fs");

const args = process.argv.slice(2);

// Default remote for the wso2 repository.
let remote = "upstream";
// Default update type.
let updateType = "patch";

if (args[0] && args[1]) {
    remote = args[0];
    updateType = args[1];
} else if (args[0]) {
    updateType = args[0];
}

execCommand("cd ../..");

if (!execCommand("git remote", true).includes(remote)) {
    if (args.length <= 1) {
        console.error("Error: `upstream` is not configured as a remote for the WSO2 repository.");
    } else {
        console.error("Error: Given remote is incorrect.");
    }
    process.exit(1);
}

execCommand(`git fetch ${remote}`);

if (execCommand(`git merge-base HEAD ${remote}/main`, true) !== execCommand(`git rev-parse ${remote}/main`, true)) {
    console.error(`Error: Your local branch is not up-to-date with ${remote} main branch.`);
    process.exit(1);
}

const changedFiles = execCommand(`git diff --name-only ${remote}/main`, true)?.split("\n");

function writeVersion(oldVersion, newVersion, path, releaseType) {
    if (!oldVersion && !newVersion) {
        replaceContentInFile(
            path,
            /("version")([\s]*)(:)([\s]*)(".*")/,
            "$1$2$3$4\"1.0.0\""
        );
        console.log(`Success: Version of ${path} is updated to 1.0.0`);

        return;
    }

    const diff = versionDiff(oldVersion, newVersion, releaseType);

    if (diff[0]) {
        replaceContentInFile(
            path,
            /("version")([\s]*)(:)([\s]*)(".*")/,
            `$1$2$3$4"${diff[1]}"`
        );
        console.log(`Success: Version of ${path} is updated to ${diff[1]}`);
    }
}

const finishedIntegrations = [];
const changedFileRegex = /^integrations\/[^/]+\/.*$/;

changedFiles?.forEach((file) => {
    if (file && changedFileRegex.test(file)) {
        const paths = file.split("/");
        const integrationPath = `${paths[1]}/${paths[2]}`;
        const infoFilePath = `integrations/${integrationPath}/resources/info.json`;
        
        if (!finishedIntegrations.includes(integrationPath)) {
            let mainBranchInfoJSON = execCommand(`git show ${remote}/main:${infoFilePath}`, true, false, false);
            if (mainBranchInfoJSON) {
                mainBranchInfoJSON = JSON.parse(mainBranchInfoJSON);
            }
            const localInfoJSON = JSON.parse(fs.readFileSync(getAbsolutePath(infoFilePath)));

            if (!localInfoJSON?.version && mainBranchInfoJSON?.version) {
                writeVersion(
                    mainBranchInfoJSON?.version,
                    mainBranchInfoJSON?.version,
                    infoFilePath,
                    updateType
                );
            } else if (localInfoJSON?.version && mainBranchInfoJSON?.version) {
                writeVersion(
                    mainBranchInfoJSON?.version,
                    localInfoJSON?.version,
                    infoFilePath,
                    updateType
                );
            } else if (localInfoJSON?.version != "1.0.0") {
                writeVersion(null, null, infoFilePath, updateType);
            }

            finishedIntegrations.push(integrationPath);
        }
    }
});
