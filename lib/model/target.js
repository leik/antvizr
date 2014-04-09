function Target(projectName, rawTarget) {
	var depends;

	if (rawTarget.$.depends) {
		depends = rawTarget.$.depends.split(',').map(function(depend) {
			return depend.trim();
		});
	}

	return {
		project: projectName,
		name: rawTarget.$.name,
		depends: depends,
		fullName: projectName + '.' + rawTarget.$.name
	};
}

Target.prototype = {};

module.exports = Target;
