const core = require('@actions/core');
const github = require('@actions/github');
const {GITHUB_OWNER, EXPENSIFY_CASH_REPO} = require('../../libs/GithubUtils');

const run = function () {
    const octokit = github.getOctokit(core.getInput('GITHUB_TOKEN', {required: true}));
    const issueNumber = Number(core.getInput('ISSUE_NUMBER', {required: true}));
    let hasDeployBlockers = false;

    console.log(`Fetching issue number ${issueNumber}`);

    return octokit.issues.get({
        owner: GITHUB_OWNER,
        repo: EXPENSIFY_CASH_REPO,
        issue_number: issueNumber,
    })
        .then(({data}) => {
            console.log('Checking for unverified PRs or unresolved deploy blockers', data);

            const pattern = /-\s\[\s]/g;
            const matches = pattern.exec(data.body);
            hasDeployBlockers = matches !== null;
        })
        .then(() => {
            if (!hasDeployBlockers) {
                return octokit.issues.listComments({
                    owner: GITHUB_OWNER,
                    repo: EXPENSIFY_CASH_REPO,
                    issue_number: issueNumber,
                })
                    .then(({data}) => {
                        console.log('Verifying that the last comment is :shipit:');

                        const lastComment = data[data.length - 1];
                        const shipItRegex = /^:shipit:/g;
                        hasDeployBlockers = shipItRegex.exec(lastComment.body) === null;
                    });
            }
        })
        .then(() => {
            core.setOutput('HAS_DEPLOY_BLOCKERS', hasDeployBlockers);
        });
};

if (require.main === module) {
    run();
}

module.exports = run;
