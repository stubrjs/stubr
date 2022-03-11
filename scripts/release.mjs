import { execa } from 'execa';
import chalk from 'chalk';

const isDryRun = process.env.DRY_RUN === 'true';
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
const dryRun = (bin, args, opts = {}) =>
    console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts);
const runIfNotDry = isDryRun ? dryRun : run;
const step = (msg) => console.log(chalk.cyan(`\n${msg}`));

async function main() {
    step('performing unit tests...');
    await run('yarn', ['stubr:test']);

    step('performing builds as sanity check...');
    await run('yarn', ['build']);

    step('bumping version...');
    if (
        releaseType === 'beta' &&
        versionType !== 'prerelease' &&
        versionType !== 'graduate'
    ) {
        await runIfNotDry('npx', [
            'lerna',
            'version',
            '--conventional-commits',
            '--conventional-prerelease',
            '--preid',
            'beta',
            `pre${versionType}`,
            '--yes',
        ]);
    } else if (releaseType === 'beta' && versionType === 'prerelease') {
        await runIfNotDry('npx', [
            'lerna',
            'version',
            '--conventional-commits',
            '--conventional-prerelease',
            '--preid',
            'beta',
            'prerelease',
            '--yes',
        ]);
    } else if (releaseType === 'release' && versionType === 'graduate') {
        await runIfNotDry('npx', [
            'lerna',
            'version',
            '--conventional-commits',
            '--conventional-graduate',
            '--yes',
        ]);
    } else if (
        releaseType === 'release' &&
        versionType !== 'graduate' &&
        versionType !== 'prerelease'
    ) {
        await runIfNotDry('npx', [
            'lerna',
            'version',
            '--conventional-commits',
            versionType,
            '--yes',
        ]);
    } else {
        console.error(
            `unsupported combination of versionType "${versionType}" and releaseType "${releaseType}"`
        );
        process.exit(1);
    }

    step('updating lock files...');
    await run('yarn', ['install']);

    step('performing new builds...');
    await run('yarn', ['build']);

    step('pushing to GitHub...');
    await run('git', ['push']);

    step('publishing packages...');
    await runIfNotDry('npx', [
        'lerna',
        'publish',
        'from-package',
        '--dist-tag',
        releaseType === 'release' ? 'latest' : 'beta',
        '--no-verify-access',
        '--yes',
    ]);
}

main().catch((err) => {
    console.error(err);
});
