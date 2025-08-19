import SwiftUI
import LucraSDK

@main
struct RNGApp: App {
    @StateObject private var session = SessionManager()
    
    var body: some Scene {
        WindowGroup {
            MainView()
                .lucraFlow($session.flow, client: session.client)
                .environmentObject(session)
                .onOpenURL { url in
                    var raw = url.absoluteString.replacingOccurrences(of: "rng://", with: "")
                    
                    if let decoded = raw.removingPercentEncoding {
                        var fixed = decoded
                        // Specific to RNG: iOS drops the colon after https, add it back
                        if fixed.hasPrefix("https//") {
                            fixed = fixed.replacingOccurrences(of: "https//", with: "https://")
                        }
                        if let realURL = URL(string: fixed) {
                            handleIncomingURL(realURL)
                        } else {
                            print("Invalid incoming URL: \(fixed)")
                        }
                    }
                }
        }
    }
    
    private func handleIncomingURL(_ url: URL) {
        session.flow = session.client.handleDeeplink(url: url)
    }}
