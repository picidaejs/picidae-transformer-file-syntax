var fs = require('fs');
var nps = require('path');

exports.markdownTransfomer = function (opt, gift, require) {
	var prefix = opt.prefix || '@'
	var suffix = opt.suffix || '@'
	var deep = ('deep' in opt) ? !!opt.deep : true;

	if (!gift.data) return gift.data;
	var filename = gift.filename;
	// console.log(filename);

	function replace(content, filename) {
		var dirname = nps.dirname(filename);

		return content.replace(
			new RegExp('^\\s*' + prefix + '\\s*(.+?)\\s*' + suffix + '\\s*(\\n?)$', 'gm'),
			// /@\s*(.+?)\s*@/g,
			function (m, path, newlineOrNull) {
				path = path.trim();
				if (!path) return m;
				path = nps.join(dirname, path);
				try {
					path = require.resolve(path);
				} catch (err) {
					return m;
				}
				if (path === filename) {
					return m;
				}
				
				var fileContent = fs.readFileSync(path).toString();
				// console.log(fileContent);
				if (deep) {
					fileContent = replace(fileContent, path);
				}
				
				return fileContent + newlineOrNull;
			}
		);
	}

	gift.data = replace(gift.data, filename);
	return gift.data;
};