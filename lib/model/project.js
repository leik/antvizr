var path = require('path'),
	_ = require('lodash'),
	Target = require(path.join(__dirname, 'target'));

function Project(rawProject, filePath) {
	var self = this;

	this.name = rawProject.$.name;
	this.filePath = filePath;
	this.imports = (rawProject.import || []).map(function(rawImport) {
		return {
			filePath: path.join(path.dirname(filePath), rawImport.$.file)
		};
	});
	this.targets = (rawProject.target || []).map(function(rawTarget) {
		return new Target(self, rawTarget);
	});
}

Project.prototype.findTarget = function(targetName) {
	var matchingTarget = _.find(this.targets, function(target) {
		return target.name === targetName || target.fullName === targetName;
	});

	return matchingTarget || _.find(this.imports.map(function(project) {
		return project.findTarget(targetName);
	}), function(target) {
		return target;
	});
};

module.exports = Project;
