const core = require("@actions/core");
const github = require("@actions/github");

const getVersion = (file) => file.match(/\d\.\d\.\d/);

// most @actions toolkit packages have async methods
async function run() {
  try {
    const path = core.getInput("version_file");

    const { payload, issue } = github.context;
    const { owner, repo } = issue;
    const { ref } = payload.pull_request.head;
    const myToken = core.getInput("myToken");
    const octokit = new github.GitHub(myToken);

    const branchResult = await octokit.repos.getContents({
      owner,
      repo,
      path,
      ref,
    });
    const branchFile = Buffer.from(
      branchResult.data.content,
      "base64"
    ).toString();
    const branchVersion = getVersion(branchFile);
    core.debug(`PR Branch version is ${branchVersion}`);

    const masterResult = await octokit.repos.getContents({ owner, repo, path });
    const masterFile = Buffer.from(
      masterResult.data.content,
      "base64"
    ).toString();
    const masterVersion = getVersion(masterFile);
    core.debug(`Master Branch version is ${masterVersion}`);

    const hasChanges = true;

    if (hasChanges && masterVersion === branchVersion) {
      throw Error(`Please update the version number when changes are made.`);
    }

    core.debug("Version number updated");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
