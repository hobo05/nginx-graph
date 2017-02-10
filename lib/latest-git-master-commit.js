var Git = require("nodegit");

var config = require('./config');

var branch = config.gitCloneConf.branch;

var fetchOptions = {
	  callbacks: {
	    certificateCheck: function() { return 1; },
	    credentials: function(url, userName) {
	    	if (config.REPO_USERNAME 
	    		&& config.REPO_USERNAME.length > 0 
	    		&& config.REPO_PASSWORD
	    		&& config.REPO_PASSWORD.length > 0) {
				return Git.Cred.userpassPlaintextNew(config.REPO_USERNAME, config.REPO_PASSWORD);
			} else {
				return undefined;
			}
	    }
	  }
	}

var cloneOptions = {
	checkoutBranch: branch,
	fetchOpts: fetchOptions
};

module.exports = function(url, repoDir) {
	
	var repository;
	return Git.Clone(url, repoDir, cloneOptions)
	.catch(error => {
		console.error(error);
		console.log("Attempting to open existing repo");
		return Git.Repository.open(repoDir);
	}).then(repo => {
		repository = repo;
		console.log("Fetch latest from remote")
		return repository.fetch("origin", fetchOptions);
	}).then(() => {
		console.log("Merge our remote with our local (equivalent to a git pull)");
	    return repository.mergeBranches(branch, "origin/"+branch);
	}).then(() => repository.getBranchCommit(""));
};
