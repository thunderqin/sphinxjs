autod:
	@npm install autod --dev-save
	@./node_modules/.bin/autod -w
	@npm install

auto-test:
	@npm run test
