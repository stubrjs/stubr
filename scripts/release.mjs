import { execa } from 'execa';

const versionType = process.env.VERSION_TYPE;
const releaseType = process.env.RELEASE_TYPE;

if (!versionType) {
    console.log('VERSION_TYPE not found');
    process.exit(1);
} else {
    console.log(`version type: ${versionType}`);
}

if (!releaseType) {
    console.log('VERSION_TYPE not found');
    process.exit(1);
} else {
    console.log(`release type: ${releaseType}`);
}

const run = (bin, args, opts = {}) =>
    execa(bin, args, { stdio: 'inherit', ...opts });

async function main() {
    await run('yarn', ['stubr:test']);
    await run('yarn', ['build']);

    if (releaseType === 'preview') {
        await run('npx', [
            'lerna',
            'version',
            '--preid',
            'beta',
            `pre${versionType}`
        ]);
    } else if (releaseType === 'release') {
        await run('npx', ['lerna', 'version', versionType]);
    } else {
        console.error(`unkown releaseType "${releaseType}"`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
});
