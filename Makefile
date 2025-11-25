# Makefile for Kanban.md
# Node.js version: 22.12.0

# Load .env file if exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: build check clean install publish publish-patch publish-minor publish-major

build:
	@echo "Building extension and webview..."
	npm run build
	@echo "Build complete. Press F5 in VSCode to debug."

check:
	@echo "Running checks..."
	npm run check-types
	npm run lint
	@echo "All checks passed."

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf out/
	rm -f *.vsix
	@echo "Clean complete."

install:
	@echo "Installing dependencies..."
	npm install
	@echo "Installation complete."

publish:
	@echo "Publishing to VSCode Marketplace..."
	vsce publish -p $(VSCE_TOKEN)
	@echo "Published successfully!"

publish-patch:
	@echo "Publishing patch version..."
	vsce publish patch -p $(VSCE_TOKEN)
	@echo "Published successfully!"

publish-minor:
	@echo "Publishing minor version..."
	vsce publish minor -p $(VSCE_TOKEN)
	@echo "Published successfully!"

publish-major:
	@echo "Publishing major version..."
	vsce publish major -p $(VSCE_TOKEN)
	@echo "Published successfully!"
