import SwiftUI

@main
struct IOSApp: App {
    @StateObject private var session = SessionManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(session)
        }
    }
}
