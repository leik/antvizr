var path = require('path'),
	Target = require(path.join(__dirname, 'target'));

function Project(rawProject) {
	var targets = (rawProject.target || []).map(function(rawTarget) {
		return new Target(rawProject.$.name, rawTarget);
	});

	return {
		name: rawProject.$.name,
		imports: (rawProject.import || []).map(function(rawImport) {
			return {
				file: rawImport.$.file
			}
		}),
		targets: targets
	};
}

Project.prototype = {};

module.exports = Project;
