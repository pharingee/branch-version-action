const core = require("@actions/core");
const github = require("@actions/github");

const getVersion = (file) => file.match(/\d\.\d\.\d/);

const getFile = async (octokit, issue, path, ref) => {
  const { owner, repo } = issue;
  const result = await octokit.repos.getContents({
    owner,
    repo,
    path,
    ref,
  });

  return Buffer.from(result.data.content, "base64").toString();
};

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.warning("Starting run");
    const path = core.getInput("versionFile");
    const { context } = github;
    const { payload, issue } = context;
    core.warning(
      JSON.stringify(payload, undefined, 2),
      JSON.stringify(context, undefined, 2)
    );
    const { ref } = payload.pull_request.head;
    const myToken = core.getInput("githubToken");
    const octokit = new github.GitHub(myToken);

    const branchFile = await getFile(octokit, issue, path, ref);
    const branchVersion = getVersion(branchFile);
    core.warning(`PR Branch version is ${branchVersion}`);

    const masterFile = await getFile(octokit, issue, path);
    const masterVersion = getVersion(masterFile);
    core.warning(`Master Branch version is ${masterVersion}`);

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
