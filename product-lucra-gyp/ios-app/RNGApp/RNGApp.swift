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
                    handleIncomingURL(url)
                }
        }
    }
    
    private func handleIncomingURL(_ url: URL) {
        let prefix = "rng://matchupId="
        
        // Remove the prefix and get the raw original URL string
        guard let raw = url.absoluteString.removingPercentEncoding,
              raw.hasPrefix(prefix) else {
            return
        }
        
        let originalURLString = String(raw.dropFirst(prefix.count))
        
        // Convert back to a URL
        guard let originalURL = URL(string: originalURLString) else {
            return
        }
        
        let flow = session.client.handleDeeplink(url: originalURL)
        session.flow = flow
    }}
