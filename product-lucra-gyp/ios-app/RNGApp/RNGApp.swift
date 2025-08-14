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
        ///Deeplink handler does not appear to parse the url as expected
//        let prefix = "rng://matchupId="
//        
//        //"https//www.lucrasports.com/referral?code=9df7eb14-b1fc-4c51-9331-45d142a78df0&referredByDisplayName=ImprovedNarwhal_0105&gamesMatchupId=37559943-1f36-429e-8f07-97dee86d2ac3&isInfluencer=false
//        
//        // Remove the prefix and get the raw original URL string
//        guard let raw = url.absoluteString.removingPercentEncoding,
//              raw.hasPrefix(prefix) else {
//            return
//        }
//        
//        let originalURLString = String(raw.dropFirst(prefix.count))
//        
//        // Convert back to a URL
//        guard let originalURL = URL(string: originalURLString) else {
//            return
//        }
//        
//        let flow = session.client.handleDeeplink(url: originalURL)
        
        /// Deeplinking works if you manually extract the URL but that means we are not using the deeplink handler directly
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let matchupId = components?.queryItems?.first(where: { $0.name == "gamesMatchupId" })?.value
        
        session.flow = .gamesMatchupDetails(matchupId: matchupId ?? "")
    }}
