default:
    @just --list

dev:
    npm run dev

build:
    npm run build

preview:
    npm run preview

# Build and deploy dist/ to Cloudflare Pages production
deploy:
    npm run deploy
