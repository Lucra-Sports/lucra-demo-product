import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 20) {
                Text("RNG")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                Text("Welcome back!")
                    .foregroundColor(.white.opacity(0.8))
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
//                    .keyboardType(.emailAddress)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                SecureField("Password", text: $password)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                Button(action: login) {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Login").bold()
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(16)
                NavigationLink("Sign up", destination: SignupView())
                    .foregroundColor(.white)
            }
            .padding()
        }
    }

    func login() {
        Task {
            isLoading = true
            do {
                try await session.login(email: email, password: password)
            } catch {
                print("Login failed:", error)
            }
            isLoading = false
        }
    }
}
