# lucra-demo-product

This directory contains the baseline RNG product experience before any Lucra SDK integration. All apps and services in this project communicate with a standalone server hosted at <http://playrng.us-east-1.elasticbeanstalk.com>. The S3 bucket for this product is `rng-base-product`.

It includes:

- `web-app` – functioning web app interacting with the API
- `api` – backend API serving the apps
- `android-app` – Android client pointing to the remote server
- `ios-app` – iOS client pointing to the remote server

This setup allows developers to explore the core product experience without any Lucra-specific components.
