import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionManager
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?

    var body: some View {
        VStack(spacing: 16) {
            Text("Login").font(.largeTitle)
            TextField("Email", text: $email).textInputAutocapitalization(.never).textFieldStyle(.roundedBorder)
            SecureField("Password", text: $password).textFieldStyle(.roundedBorder)
            if let error = error { Text(error).foregroundColor(.red) }
            Button("Sign In") { login() }
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }

    private func login() {
        APIService.shared.login(email: email, password: password) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let user):
                    session.user = user
                case .failure:
                    error = "Login failed"
                }
            }
        }
    }
}

#Preview {
    LoginView().environmentObject(SessionManager())
}
