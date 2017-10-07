var fs = require('fs');
var nps = require('path');

exports.markdownTransfomer = function (opt, gift, require) {
	if (!gift.data) return gift.data;
	var filename = gift.filename;
	console.log(filename);
	var dirname = nps.dirname(filename)
	gift.data = gift.data.replace(
		/@\s*(.+?)\s*@/g,
		function (m, path) {
			path = path.trim();
			if (!path) return m;
			path = nps.join(dirname, path);
			try {
				path = require.resolve(path);
			} catch (err) {
				return m;
			}
			console.log(path);
			return fs.readFileSync(path).toString();
		}
	)
	return gift.data;
};