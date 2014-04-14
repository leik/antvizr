function Target(project, rawTarget) {
	var depends = [];

	if (rawTarget.$.depends) {
		depends = rawTarget.$.depends.split(',').map(function(depend) {
			return depend.trim();
		});
	}

	this.project = project;
	this.name = rawTarget.$.name;
	this.depends = depends;
	this.fullName = project.name + '.' + rawTarget.$.name;
}

module.exports = Target;
