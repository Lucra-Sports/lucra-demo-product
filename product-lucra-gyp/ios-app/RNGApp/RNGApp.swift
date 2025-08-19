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
                    // Specific to RNG, the lucra link is simply appended to rng://, iOS removes the colon for some reason, we're adding it back here
                    if raw.hasPrefix("https//") {
                           raw = raw.replacingOccurrences(of: "https//", with: "https://")
                       }
                    if let decoded = raw.removingPercentEncoding,
                       let realURL = URL(string: decoded) {
                        handleIncomingURL(realURL)
                    }
                }
        }
    }
    
    private func handleIncomingURL(_ url: URL) {
        session.flow = session.client.handleDeeplink(url: url)
    }}
