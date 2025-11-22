# Makefile for Markdown Kanban
# Node.js version: 22.12.0

.PHONY: build check clean install

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
