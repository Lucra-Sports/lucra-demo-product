# iOS App

This directory contains a SwiftUI-based iOS application that mirrors the
Next.js web app found in `../web-app`.  It reuses the same API endpoints
provided by the Express server in `../api` and follows the same navigation
flow (auth, dashboard, history and profile pages).

The project is distributed as a Swift Package so it can be opened in Xcode
on macOS.  To run it, open `Package.swift` in Xcode and build the `IOSApp`
target.  The app expects the API server to be running locally on port 4000.

> **Note:** SwiftUI is not available in this Linux environment so the package
> cannot be built here, but the sources are valid for building on macOS.
