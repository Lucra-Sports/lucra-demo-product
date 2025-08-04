import SwiftUI

struct ContentView: View {
    @EnvironmentObject var session: SessionManager

    var body: some View {
        NavigationStack {
            if session.user == nil {
                LoginView()
            } else {
                DashboardView()
            }
        }
    }
}

#Preview {
    ContentView().environmentObject(SessionManager())
}
