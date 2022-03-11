import * as defaultConfig from '../defaultconfig.json';
const debug = require('debug')('stubr');

const loadConfiguration = (stubrConfig?: Config): Config => {
    let _stubrConfig: Config | undefined;
    if (stubrConfig) {
        debug('use custom config');
        _stubrConfig = { ...defaultConfig, ...stubrConfig };
    } else {
        debug('use default config');
        _stubrConfig = <Config>defaultConfig;
    }
    return _stubrConfig;
};

export default loadConfiguration;
