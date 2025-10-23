// swift-tools-version: 5.8
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let version = "4.0.0"

let hostedPackageURL = "https://lucra-sdk.s3.amazonaws.com/ios/spm/\(version)"

let package = Package(
    name: "LucraSDK",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "LucraSDK", targets: ["LucraSDK", "LucraCore"])
    ],
    dependencies: [
        .package(url: "https://github.com/zendesk/support_sdk_ios", .upToNextMajor(from: "8.0.0")),
        .package(url: "https://github.com/auth0/Auth0.swift.git", .upToNextMajor(from: "2.0.0"))
    ],
    targets: [
        .target(
            name: "LucraCore",
            dependencies: [
                "LucraSDK",
                "MobileIntelligence",
                "GeoComplySDK",
                .product(name: "Auth0", package: "Auth0.swift"),
                .product(name: "ZendeskSupportSDK", package: "support_sdk_ios")
            ],
            path: "LucraSDKTarget"
        ),
        .binaryTarget(
            name: "LucraSDK",
            url: "\(hostedPackageURL)/LucraSDK.xcframework.zip",
            checksum: "c158ff5586f507d97efaf39f3a665f7296b625701093d5041b6ba8ed7081eaff"
        ),
        .binaryTarget(
            name: "MobileIntelligence",
            url: "\(hostedPackageURL)/MobileIntelligence.xcframework.zip",
            checksum: "831277a00f4583600cb57ffbc4a3ee843c03a0c994fa7209cbbc4d7d967acb11"
        ),
        .binaryTarget(
            name: "GeoComplySDK",
            url: "\(hostedPackageURL)/GeoComplySDK.xcframework.zip",
            checksum: "ddb54014d8326f158ca49bae54c716f7328fd229f14917802b1fc597e2c3732c"
        )
    ]
)
