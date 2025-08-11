# RNG & Lucra Tournaments functionality

This directory contains the baseline RNG product plus the Lucra Tournaments SDK integration. All apps and services in this project communicate with a standalone server hosted at <http://playrng-lucra-tournaments.us-east-1.elasticbeanstalk.com>. The S3 bucket for this product is `rng-lucra-tournaments-product`.

It includes:

- `web-app` – functioning web app interacting with the API
- `api` – backend API serving the apps
- `android-app` – Android client pointing to the remote server
- `ios-app` – iOS client pointing to the remote server
