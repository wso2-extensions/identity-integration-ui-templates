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

module.exports = { 
    extractContentFromFile,
    replaceContentInFile,
    getAbsolutePath
};
