import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var session: SessionManager
    @State private var userCopy: User
    @State private var message: String?

    init() {
        if let user = SessionManager().user {
            _userCopy = State(initialValue: user)
        } else {
            _userCopy = State(initialValue: User(id: 0, full_name: "", email: "", address: nil, city: nil, state: nil, zip_code: nil, birthday: nil))
        }
    }

    var body: some View {
        Form {
            Section(header: Text("Profile")) {
                TextField("Full Name", text: $userCopy.full_name)
                TextField("Email", text: $userCopy.email)
                TextField("Address", text: Binding($userCopy.address, replacingNilWith: ""))
                TextField("City", text: Binding($userCopy.city, replacingNilWith: ""))
                TextField("State", text: Binding($userCopy.state, replacingNilWith: ""))
                TextField("Zip", text: Binding($userCopy.zip_code, replacingNilWith: ""))
                TextField("Birthday", text: Binding($userCopy.birthday, replacingNilWith: ""))
            }
            if let message = message {
                Section { Text(message) }
            }
            Button("Save") { save() }
        }
        .navigationTitle("Profile")
        .onAppear {
            if let user = session.user { userCopy = user }
        }
    }

    private func save() {
        guard let id = session.user?.id else { return }
        APIService.shared.updateProfile(userId: id, user: userCopy) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let updated):
                    session.user = updated
                    message = "Saved"
                case .failure:
                    message = "Failed to save"
                }
            }
        }
    }
}

// Helper to bind optional strings
extension Binding where Value == String? {
    init(_ source: Binding<String?>, replacingNilWith nilValue: String) {
        self.init(
            get: { source.wrappedValue ?? nilValue },
            set: { source.wrappedValue = $0 }
        )
    }
}

#Preview {
    ProfileView().environmentObject(SessionManager())
}
