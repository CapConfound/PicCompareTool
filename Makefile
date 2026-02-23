.PHONY: run stop install logs build dist

LOG := .dev.log

run:
	@lsof -ti:3001 -ti:5173 | xargs kill -9 2>/dev/null; true
	@npm run dev > $(LOG) 2>&1 &
	@echo "Started. Run 'make logs' to follow output."

stop:
	@lsof -ti:3001 -ti:5173 | xargs kill -9 2>/dev/null; true
	@echo "Stopped."

logs:
	@tail -f $(LOG)

install:
	npm run install:all

build:
	npm run build

dist:
	npm run dist
