import SwiftUI

@main
struct RNGApp: App {
    @StateObject private var session = SessionManager()

    var body: some Scene {
        WindowGroup {
            MainView()
                .environmentObject(session)
        }
    }
}
