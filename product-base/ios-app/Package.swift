// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "IOSApp",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .executable(name: "IOSApp", targets: ["IOSApp"])
    ],
    targets: [
        .executableTarget(
            name: "IOSApp",
            path: "Sources/IOSApp"
        )
    ]
)
