const util = require('util');
const exec = util.promisify(require('child_process').exec)
const rl = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
})

const question = (input) => {
	return new Promise((resolve) => {
		rl.question(input, answer => {
			resolve(answer)
			rl.close()
		})
	})
}

async function checkConfig(config) {
	if (!config.HOST_URL) {
		config.HOST_URL = await question('Please enter a valid AWS Host URL: ')
		await exec(`snapctl set host-url ${config.HOST_URL}`)
	}
	if (!config.CERTIFICATE_ID) {
		config.CERTIFICATE_ID = question('Please enter a valid AWS Certificate ID: ')
		await exec(`snapctl set certificate-id ${config.CERTIFICATE_ID}`)
	}
	return config
}

module.exports = {
	checkConfig
}
