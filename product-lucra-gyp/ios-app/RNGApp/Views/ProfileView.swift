import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var session: SessionManager
    @Environment(\.dismiss) var dismiss
    
    @State private var stats = Stats(totalNumbersGenerated: 0, bestNumber: 0)
    
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var phoneNumber: String = ""

    var body: some View {
        ZStack {
            LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                if let user = session.user {
                    
                    VStack(spacing: 16) {
                        Text(user.fullName)
                            .font(.title)
                            .foregroundColor(.white)
                        
                        Text(user.email)
                            .foregroundColor(.white.opacity(0.8))
                        
                        if let user = session.lucraUser {
                            Text("Lucra Username: \(user.username ?? "")")
                                .font(.subheadline)
                                .foregroundColor(.white)
                            
                            metadata
                        } else {
                            Text("Not logged into Lucra")
                                .rngStyle()
                            
                            Group {
                                VStack(alignment: .leading) {
                                    Text("First Name")
                                    
                                    TextField("First Name", text: $firstName)
                                        .foregroundColor(.black)
                                }
                                
                                VStack(alignment: .leading) {
                                    Text("Last Name")
                                    
                                    TextField("Last Name", text: $lastName)
                                        .foregroundColor(.black)
                                }
                                
                                VStack(alignment: .leading) {
                                    Text("Phone Number")
                                    
                                    TextField("Phone Number", text: $phoneNumber)
                                        .foregroundColor(.black)
                                }
                            }
                            .rngStyle()
                            .padding(.horizontal, 50)
                            
                            configureButton
                        }
                        
                        if let externalId = user.externalId {
                            VStack {
                                Text("RNG ExternalID")
                                    .font(.subheadline)
                                    .foregroundColor(.white)
                                
                                Text(externalId)
                                    .rngStyle()
                            }
                            
                        }
                    }
                    
                    statsSection
                    
                    numberHistoryButton
                    
                    logoutButton
                }
            }
            .padding(.top, 30)
        }
        .keyboardToolbar()
        .onAppear { load() }
        .navigationBarBackButtonHidden(true)
        .overlay(alignment: .topLeading) {
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "arrow.left")
                        .foregroundColor(.white)
                }
                Spacer()
            }
            .padding(.top, 50)
            .padding(.leading, 20)
        }
    }
    
    @ViewBuilder
    private var numberHistoryButton: some View {
        NavigationLink("Number History", destination: HistoryView())
            .padding()
        .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
            .cornerRadius(12)
            .foregroundColor(.white)
    }
    
    @ViewBuilder
    private var statsSection: some View {
        HStack {
            VStack {
                Text("\(stats.totalNumbersGenerated)")
                Text("Generated")
            }
            .rngStyle()
            
            VStack {
                Text("\(stats.bestNumber)")
                Text("Best")
            }
            .rngStyle()
        }
    }
    
    @ViewBuilder
    private var metadata: some View {
        if let metadata = session.lucraUser?.metadata {
            Text("Metadata")
                .font(.headline)
                .foregroundColor(.white)
            
            ForEach(Array(metadata.enumerated()), id: \.element.key) { index, element in
                HStack {
                    Text(element.key)
                        .rngStyle()
                    
                    Text(element.value)
                        .rngStyle()
                }
            }
        }
    }
    
    @ViewBuilder
    private var configureButton: some View {
        Button("Configure Client") {
            configureClient()
        }
        .fancyRngStyle()
    }
    
    @ViewBuilder
    private var logoutButton: some View {
        Button("Logout") {
            session.logout()
            dismiss()
        }
        .fancyRngStyle()
    }

    private func load() {
        guard let id = session.user?.id else { return }
        
        let name = session.user?.fullName.components(separatedBy: " ")
        
        firstName = name?.first ?? ""
        lastName = name?.last ?? ""
        phoneNumber = session.lucraUser?.phoneNumber ?? ""
        
        Task {
            if let s = try? await APIService.shared.getStats(userId: id) {
                stats = s
            }
        }
    }
    
    private func configureClient() {
        Task {
            try await session.client.configure(user: .init(username: session.user?.fullName,
                                                           avatarURL: nil,
                                                           phoneNumber: phoneNumber,
                                                           email: session.user?.email ?? "",
                                                           firstName: firstName,
                                                           lastName: lastName,
                                                           address: nil,
                                                           dateOfBirth: nil,
                                                           metadata: ["external_id": session.user?.externalId ?? ""]))
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(SessionManager())
}
