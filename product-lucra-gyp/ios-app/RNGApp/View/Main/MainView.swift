import SwiftUI

struct MainView: View {
    @EnvironmentObject var session: SessionManager

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
