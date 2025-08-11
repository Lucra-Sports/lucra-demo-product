# Lucra Demo Product

This repository showcases three variations of the RNG product and how Lucra features layer onto the base experience.

## Folder overview

| Folder | Description | Server URL |
| --- | --- | --- |
| `product-base` | Baseline RNG product with no Lucra integration. Use this to explore the core experience. | http://playrng.us-east-1.elasticbeanstalk.com |
| `product-lucra-gyp` | Base product plus the Lucra SDK "GYP" (Games You Play) integration. Demonstrates how GYP blends into the existing product. | http://playrng-lucra-gyp.us-east-1.elasticbeanstalk.com |
| `product-lucra-tournaments` | Base product with the Lucra Tournaments SDK added, illustrating tournament play. | http://playrng-lucra-tournaments.us-east-1.elasticbeanstalk.com |

Each directory includes a `web-app`, `api`, `android-app`, and `ios-app` that point to their respective servers. The variations let you see how additional Lucra functionality mixes naturally into the product.
