import { OUTPUT_ES_DIR, OUTPUT_LIB_DIR } from './config';
import { mkdirsSync } from './utils';
import path from 'path';

// es
mkdirsSync(path.resolve(__dirname, `../${OUTPUT_ES_DIR}/style/color`));
mkdirsSync(path.resolve(__dirname, `../${OUTPUT_ES_DIR}/style/themes`));

// lib
mkdirsSync(path.resolve(__dirname, `../${OUTPUT_LIB_DIR}/style/color`));
mkdirsSync(path.resolve(__dirname, `../${OUTPUT_LIB_DIR}/style/themes`));
