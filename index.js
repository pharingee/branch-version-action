const core = require("@actions/core");
const github = require("@actions/github");

const getVersion = (file) => file.match(/\d\.\d\.\d/);

const getFile = async (octokit, issue, path, ref) => {
  const { owner, repo } = issue;
  const options = ref ? { owner, repo, path, ref } : { owner, repo, path };
  const result = await octokit.repos.getContents(options);

  return Buffer.from(result.data.content, "base64").toString();
};

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info("Starting run");
    const path = core.getInput("versionFile");
    const { context } = github;
    const { payload, issue } = context;

    const myToken = core.getInput("githubToken");
    const octokit = new github.GitHub(myToken);

    const branchFile = await getFile(octokit, issue, path, payload.ref);
    const branchVersion = getVersion(branchFile).toString();
    core.info(`Version for ${payload.ref} is ${branchVersion}`);

    const masterFile = await getFile(octokit, issue, path);
    const masterVersion = getVersion(masterFile).toString();
    core.info(`Master Branch version is ${masterVersion}`);

    if (masterVersion == branchVersion) {
      core.setFailed(`Please update the version number when changes are made.`);
    }

    core.info("Version number updated");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
