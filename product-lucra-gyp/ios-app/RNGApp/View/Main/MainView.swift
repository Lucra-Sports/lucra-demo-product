
import SwiftUI
import LucraSDK

struct MainView: View {
    @EnvironmentObject var session: SessionManager

    var body: some View {
        NavigationStack {
            if session.user == nil {
                LoginView()
            } else {
                DashboardView()
                    .toolbar(.hidden, for: .navigationBar)
            }
        }
    }
}

#Preview {
    MainView()
        .environmentObject(SessionManager())
}
