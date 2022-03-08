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
    await runIfNotDry('yarn', ['stubr:test']);

    step('performing builds as sanity check...');
    await runIfNotDry('yarn', ['build']);

    step('bumping version...');
    if (releaseType === 'beta' && releaseType !== 'prerelease') {
        await run('npx', [
            'lerna',
            'publish',
            '--conventional-commits',
            '--conventional-prerelease',
            '--preid',
            'beta',
            `pre${versionType}`,
            '--dist-tag',
            'beta',
            '--yes',
        ]);
    } else if (releaseType === 'beta' && releaseType === 'prerelease') {
        await run('npx', [
            'lerna',
            'publish',
            '--conventional-commits',
            '--conventional-prerelease',
            '--preid',
            'beta',
            '--dist-tag',
            'beta',
            '--yes',
        ]);
    } else if (releaseType === 'release') {
        await run('npx', [
            'lerna',
            'publish',
            '--conventional-commits',
            '--conventional-graduate',
            '--create-release github',
            '--dist-tag',
            'latest',
            '--yes',
        ]);
    } else {
        console.error(`unkown releaseType "${releaseType}"`);
        process.exit(1);
    }

    step('updating lock files...');
    await run('yarn', ['install']);

    //step('generating release notes...');
    //await run('yarn', ['changelog']);
    //await run('git', ['add', '-A']);
    //await run('git', ['commit', '-m', `docs: update of release notes`]);

    step('performing new builds...');
    await run('yarn', ['build']);

    step('pushing to GitHub...');
    await runIfNotDry('git', ['push']);

    step('publishing packages...');
    await runIfNotDry('npx', [
        'lerna',
        'publish',
        '--dist-tag',
        releaseType === 'release' ? 'latest' : 'beta',
        '--yes',
    ]);
}

main().catch((err) => {
    console.error(err);
});
