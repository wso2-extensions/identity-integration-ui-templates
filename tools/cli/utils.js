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

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { MAJOR, MINOR, RELEASE_TYPES } = require("./constants");

/**
 * Function to generate the absolute path.
 * 
 * @param filePath - File path relative to the parent.
 * @returns Absolute path as a string.
 */
function getAbsolutePath(filePath) {
    return path.join(__dirname, "..", "..", filePath);
}

/**
 * Search for data that matches a regular expression 
 * within a specific file.
 * 
 * @param filePath - File path relative to the parent.
 * @param regexPattern - Regular expression to search the content.
 * @returns Regex matches.
 * 
 * Ex:- extractContentFromFile("integrations/pom.xml", 
 *        /<version>(?<version>.+)<\/version>/)
 */
function extractContentFromFile(filePath, regexPattern) {
    try {
        // Read the file content.
        const xmlData = fs.readFileSync(getAbsolutePath(filePath), "utf8");

        // Apply the regex pattern to find matches.
        const matches = xmlData.match(regexPattern);

        return matches;
    } catch (error) {
        console.error("Error reading or processing the file: ", error);
        process.exit(1);
    }
}

/**
 * Replaces content at the location matched by the regex pattern in a file.
 * 
 * @param filePath - Path to the file.
 * @param regexPattern - Regex pattern to match the location.
 * @param newContent - Content to insert or replace.
 */
function replaceContentInFile(filePath, regexPattern, newContent) {
    try {
        // Read the file content.
        let fileData = fs.readFileSync(filePath, "utf8");

        // Replace the content based on the regex pattern
        fileData = fileData.replace(regexPattern, newContent);

        // Write the updated content back to the file.
        fs.writeFileSync(filePath, fileData, "utf8");
    } catch (error) {
        console.error("Error reading or writing the file: ", error);
        process.exit(1);
    }
}

/**
 * Executes a shell command and returns the command's output.
 * 
 * @param command - The shell command to execute.
 * @param stdout - Standard output enabled or not.
 * @param force - Whether the process should exit if it fails.
 * @returns - The standard output (stdout) of the command or null.
 */
function execCommand(command, stdout = false, force = true) {
    try {
        if (stdout) {
            return execSync(command).toString();
        } else {
            execSync(command).toString();

            return null;
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        if (force) {
            process.exit(1);
        }
    }
}

function versionDiff(oldVersion, newVersion, releaseType) {
    const versionRegex = /^([0-9]+)\.([0-9]+)\.([0-9]+)/;
    const oldVersions = oldVersion.match(versionRegex);
    const newVersions = newVersion.match(versionRegex);

    let status = false;
    let version = "";

    function compareVersion(oldVersionPart, newVersionPart) {
        if (oldVersionPart === newVersionPart) {
            return true
        } else {
            if (newVersionPart < oldVersionPart) {
                console.error("Error: Having an issue to update the versions.");
                process.exit(1);
            } else {
                return false;
            }
        }
    }

    if (oldVersions && newVersions) {
        for (let i = 1; i < 4; i++) {
            if (compareVersion(parseInt(oldVersions[i]), parseInt(newVersions[i]))) {
                if (releaseType === RELEASE_TYPES[i-1]) {
                    status = true;

                    switch(releaseType) {
                        case MAJOR:
                            version += (parseInt(oldVersions[i]) + 1).toString() + ".0.0";
                            break;
                        case MINOR:
                            version += (parseInt(oldVersions[i]) + 1).toString() + ".0";
                            break;
                        default:
                            version += (parseInt(oldVersions[i]) + 1).toString();
                            break;
                    }
                }
                
                if (i === 1) {
                    version += oldVersions[i];
                } else {
                    version += "." + oldVersions[i];
                }
            }
        }
    } else {
        console.error("Error: Couldn't read the versions.");
        process.exit(1);
    }

    return [ status, version ];
}

module.exports = { 
    extractContentFromFile,
    replaceContentInFile,
    getAbsolutePath,
    execCommand,
    versionDiff
};
