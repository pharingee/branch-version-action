const core = require("@actions/core");
const github = require("@actions/github");

const getVersion = (file) => file.match(/\d\.\d\.\d/);

const getBranch = (ref) => {
  const splitText = ref.split("refs/head/").filter(Boolean);
  if (splitText.length > 0) return splitText[0];
  return "";
};

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
    const ref = getBranch(payload.ref);

    const myToken = core.getInput("githubToken");
    const octokit = new github.GitHub(myToken);

    const branchFile = await getFile(octokit, issue, path, ref);
    const branchVersion = getVersion(branchFile);
    core.info(`Version for ${ref} is ${branchVersion}`);

    const masterFile = await getFile(octokit, issue, path);
    const masterVersion = getVersion(masterFile);
    core.info(`Master Branch version is ${masterVersion}`);

    const hasChanges = true;

    if (hasChanges && masterVersion === branchVersion) {
      throw Error(`Please update the version number when changes are made.`);
    }

    core.info("Version number updated");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
