
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
    }
}

#Preview {
    MainView()
        .environmentObject(SessionManager())
}
