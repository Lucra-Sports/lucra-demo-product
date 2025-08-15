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
                    let raw = url.absoluteString.replacingOccurrences(of: "rng://", with: "")
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
