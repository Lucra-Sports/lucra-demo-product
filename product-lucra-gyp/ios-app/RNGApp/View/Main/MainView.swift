
import SwiftUI
import LucraSDK

struct MainView: View {
    @EnvironmentObject var session: SessionManager
    @EnvironmentObject var client: LucraClient

    var body: some View {
        NavigationStack {
            if session.user != nil {
                DashboardView()
            } else {
                LoginView()
            }
        }
    }
}

#Preview {
    MainView()
        .environmentObject(SessionManager())
}
