default:
    @just --list

dev:
    npm run dev

# Dev server exposed on the LAN (view from laptop/phone on the same network)
dev-net:
    npm run dev -- --host

build:
    npm run build

preview:
    npm run preview

# Build and deploy dist/ to Cloudflare Pages production
deploy:
    npm run deploy
