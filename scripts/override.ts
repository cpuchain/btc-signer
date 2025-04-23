import { readFile, writeFile } from 'fs/promises';

const PKG_JSON = './node_modules/ecpair/package.json';

async function start() {
    const pkgJson = JSON.parse(await readFile(PKG_JSON, { encoding: 'utf8' }));

    delete pkgJson.type;
    delete pkgJson.exports;
    delete pkgJson.module;

    await writeFile(PKG_JSON, JSON.stringify(pkgJson, null, 2));
}
start();
