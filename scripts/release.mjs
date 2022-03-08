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
    if (releaseType === 'preview') {
        await run('npx', [
            'lerna',
            'version',
            '--preid',
            'beta',
            `pre${versionType}`,
            '--yes',
        ]);
    } else if (releaseType === 'release') {
        await run('npx', ['lerna', 'version', versionType, '--yes']);
    } else {
        console.error(`unkown releaseType "${releaseType}"`);
        process.exit(1);
    }

    step('generating release notes...');
    await run('yarn', ['changelog']);

    step('updating lock files...');
    await run('yarn', ['install']);

    step('performing new builds...');
    await run('yarn', ['build']);

    step('\nPushing to GitHub...');
    await runIfNotDry('git', ['push']);
}

main().catch((err) => {
    console.error(err);
});
