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

const { ALLOWED_INTEGRATION_TYPES, INTEGRATION_PLURAL } = require("./constants");
const { getAbsolutePath, extractContentFromFile, replaceContentInFile } = require("./utils");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

if (!args[0] || !args[1]) {
    console.error("Error: Please provide the integration type and integration ID as arguments.");
    process.exit(1);
}

const integrationTypeSin = args[0];
const integrationTypePlu = INTEGRATION_PLURAL[integrationTypeSin];
const integrationId = args[1];

if (!ALLOWED_INTEGRATION_TYPES.includes(integrationTypeSin)) {
    console.error("Error: The provided integration is not in the allowed list."
        + " Ref: tools/cli/constants.js => ALLOWED_INTEGRATION_TYPES");
    process.exit(1);
}

const integrationIdRegexValidation = /^[a-zA-Z0-9_-]+$/;
if (!integrationIdRegexValidation.test(integrationId)) {
    console.error("Error: Integration ID can only contain alphanumeric characters, underscores (_), or hyphens (-).");
    process.exit(1);
}

const integrationDir = getAbsolutePath(`integrations/${integrationTypePlu}/${integrationId}`);
const integrationResourceDir = getAbsolutePath(`integrations/${integrationTypePlu}/${integrationId}/resources`);

if (!fs.existsSync(integrationResourceDir)) {
    fs.mkdirSync(integrationResourceDir, { recursive: true });
} else {
    console.error("Error: Integration is already exists.");
    process.exit(1);
}

const infoFilePath = getAbsolutePath("tools/cli/skeletons/info.json");
const metadataFilePath = getAbsolutePath("tools/cli/skeletons/metadata.json");
const templateFilePath = getAbsolutePath("tools/cli/skeletons/template.json");
const pomFilePath = getAbsolutePath("tools/cli/skeletons/pom.xml");

fs.copyFileSync(infoFilePath, path.join(integrationResourceDir, "info.json"));
fs.copyFileSync(metadataFilePath, path.join(integrationResourceDir, "metadata.json"));
fs.copyFileSync(templateFilePath, path.join(integrationResourceDir, "template.json"));
fs.copyFileSync(pomFilePath, path.join(integrationDir, "pom.xml"));

const integrationPomLocation = `integrations/${integrationTypePlu}/${integrationId}/pom.xml`;
const integrationParentPomLocation = `integrations/pom.xml`;
const infoFileLocation = `integrations/${integrationTypePlu}/${integrationId}/resources/info.json`;

replaceContentInFile(
    integrationPomLocation,
    /\$\{cli:current\.year\}/,
    new Date().getFullYear()
);

const parentVersion = extractContentFromFile(
    "integrations/pom.xml",
    /<version>(.+)<\/version>[\s]+<url>http:\/\/wso2.org<\/url>/
)?.[1];
if (!parentVersion) {
    console.error("Error: Couldn't extract the parent pom version.");
    process.exit(1);
}
replaceContentInFile(
    integrationPomLocation,
    /\$\{cli:parent\.version\}/,
    parentVersion
);

replaceContentInFile(
    integrationPomLocation,
    /\$\{cli:template\.id\}/g,
    integrationId
);

replaceContentInFile(
    integrationPomLocation,
    /\$\{cli:template\.type\}/,
    integrationTypePlu
);

replaceContentInFile(
    infoFileLocation,
    /\$\{cli:template\.id\}/,
    integrationId
);

replaceContentInFile(
    integrationParentPomLocation,
    /(<\/module>)([\s]+)(<module>.+<\/module>)([\s]+)(<\/modules>)/,
    `$1$2$3$2<module>${integrationTypePlu}/${integrationId}</module>$4$5`
);

console.log(`Success: Created the new integration: ${integrationId}`);
