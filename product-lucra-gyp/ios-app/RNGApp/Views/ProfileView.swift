import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var session: SessionManager
    @Environment(\.dismiss) var dismiss
    @State private var stats = Stats(totalNumbersGenerated: 0, bestNumber: 0)
//    @State private var linkedAccount: Bindings?

    var body: some View {
        ZStack {
            LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 20) {
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.white)
                    }
                    Spacer()
                }
                .padding()
                
                if let user = session.user {
                    
                    VStack(spacing: 8) {
                        Text(user.fullName)
                            .font(.title)
                            .foregroundColor(.white)
                        
                        Text(user.email)
                            .foregroundColor(.white.opacity(0.8))
                        
                        if let user = session.lucraUser {
                            Text("Lucra Username: \(user.username ?? "")")
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                        
                        if let externalId = user.externalId {
                            Text("Linked Account: \(externalId)")
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                    }
                    
                    HStack {
                        VStack {
                            Text("\(stats.totalNumbersGenerated)")
                            Text("Generated")
                        }
                        .padding()
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                        
                        VStack {
                            Text("\(stats.bestNumber)")
                            Text("Best")
                        }
                        .padding()
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                    }
                    NavigationLink("Number History", destination: HistoryView())
                        .padding()
                    .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                    Button("Logout") {
                        session.logout()
                        dismiss()
                    }
                    .padding()
                    .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
                    .cornerRadius(12)
                    .foregroundColor(.white)
                }
                Spacer()
            }
        }
        .onAppear { load() }
        .navigationBarBackButtonHidden(true)
    }

    func load() {
        guard let id = session.user?.id else { return }
        Task {
            if let s = try? await APIService.shared.getStats(userId: id) {
                await MainActor.run { stats = s }
            }
            if let b = try? await APIService.shared.getBinding(userId: id) {
                await MainActor.run { print(b) }
            }
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(SessionManager())
}
