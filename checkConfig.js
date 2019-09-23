const util = require('util');
const exec = util.promisify(require('child_process').exec);
const readline = util.promisify(require('readline')
	.createInterface({
		input: process.stdin,
		output: process.stdout
	}))

module.exports = (config) => {
	if (!config.HOST_URL) {
		config.HOST_URL = await readline('Please enter a valid AWS Host URL:')
		exec(`snapctl set host-url ${config.HOST_URL}`)
	}
	if (!config.CERTIFICATE_ID) {
		config.CERTIFICATE_ID = await readline('Please enter a valid AWS Certificate ID:')
		exec(`snapctl set certificate-id ${config.CERTIFICATE_ID}`)
	}
	return config
}
