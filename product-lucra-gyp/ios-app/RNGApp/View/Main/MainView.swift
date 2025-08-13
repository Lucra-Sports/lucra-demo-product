
import SwiftUI
import LucraSDK

struct MainView: View {
    @EnvironmentObject var session: SessionManager

    var body: some View {
        NavigationStack {
            if session.user != nil {
                DashboardView()
                    .toolbar(.hidden, for: .navigationBar)
            } else {
                LoginView()
            }
        }
        .lucraFlow($session.flow, client: session.client)
    }
}

#Preview {
    MainView()
        .environmentObject(SessionManager())
}
