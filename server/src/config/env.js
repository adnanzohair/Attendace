import dotenv from 'dotenv';
import {existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const serverRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const envFile=[resolve(serverRoot,'.env'),resolve(serverRoot,'../.env')].find(existsSync);

if(envFile)dotenv.config({path:envFile});
