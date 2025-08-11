# RNG & Lucra GYP functionality

This directory contains the baseline RNG product plus the Lucra SDK GYP experience. All apps and services in this project communicate with a standalone server hosted at <http://playrng-lucra-gyp.us-east-1.elasticbeanstalk.com>. The S3 bucket for this product is `rng-lucra-gyp-product`.

It includes:

- `web-app` – functioning web app interacting with the API
- `api` – backend API serving the apps
- `android-app` – Android client pointing to the remote server
- `ios-app` – iOS client pointing to the remote server

This setup allows developers to explore the core product experience without any Lucra-specific components.
