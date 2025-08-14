//
//  SessionManager.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

import Combine
import Foundation
import LucraSDK
import SwiftUI

class SessionManager: ObservableObject {
    
    @Published var client: LucraClient
    @Published var user: User? {
        didSet { saveUser() }
    }
    
    @Published private(set) var lucraUser: SDKUser?
    @Published var flow: LucraFlow?
    private var cancellables = Set<AnyCancellable>()

    init() {
        self.client = LucraClient(config: .init(environment: .init(apiURL: "api-rng.sandbox.lucrasports.com",
                                                                   apiKey: "coXydksUigTnn87Z6e45tabTSOaTBj0l",
                                                                   environment: .sandbox,
                                                                   urlScheme: ""),
                                                appearance: .init(universalTheme: .init(primary: Color.primaryColor,
                                                                                        secondary: Color.secondaryColor))))
        
        if let data = UserDefaults.standard.data(forKey: "rng_user"),
           let u = try? JSONDecoder().decode(User.self, from: data) {
            self.user = u
        }
        
        subscribeToUser()
        subscribeToDeeplinks()
        subscribeToEvents()
    }
    
    func setFlow(flow: LucraFlow) {
        self.flow = flow
    }

    func login(email: String, password: String) async throws {
        var u = try await APIService.shared.login(email: email, password: password)
        
        /// Check for account linking, if a lucra user exists, link the account
        if let lucraUser {
            let bindings = try await APIService.shared.getBinding(userId: u.id)
            u.externalId = bindings.first?.externalId
        }
        
        await MainActor.run { self.user = u }
    }

    func signup(data: APIService.SignupData) async throws {
        let u = try await APIService.shared.signup(data: data)
        await MainActor.run { self.user = u }
    }

    func logout() {
        user = nil
    }

    private func saveUser() {
        if let u = user, let data = try? JSONEncoder().encode(u) {
            UserDefaults.standard.set(data, forKey: "rng_user")
        } else {
            UserDefaults.standard.removeObject(forKey: "rng_user")
        }
    }
    
    private func subscribeToUser() {
        client.$user.sink { lucraUser in
            self.lucraUser = lucraUser
            
            if let _ = lucraUser {
                self.checkForBinding()
            }
            
        }
        .store(in: &cancellables)
    }
    
    private func checkForBinding() {
        Task {
            /// Make sure we only do this step when the user is logged in - both a User and LucraUser need to be valid.
            if let _ = lucraUser, let user = self.user, user.externalId == nil {
                /// Check for existing binding first
                if let existingBinding = try await APIService.shared.getBinding(userId: user.id).first {
                    await MainActor.run {
                        self.user?.externalId = existingBinding.externalId
                    }
                } else {
                    /// If no bindings exist, create one and update it
                    let binding = try await APIService.shared.updateBinding(data: .init(externalId: "\(user.id)", type: "LUCRA"), userId: user.id)
                    await MainActor.run {
                        self.user?.externalId = binding.externalId
                    }
                    
                }
            }
            
            /// Check if KYC is needed and then pass info to KYC
            if let lucraUser = lucraUser, lucraUser.accountStatus == .unverified {
                try await client.configure(user: .init(username: lucraUser.username,
                                                       avatarURL: lucraUser.avatarURL,
                                                       phoneNumber: lucraUser.phoneNumber,
                                                       email: user?.email,
                                                       firstName: user?.fullName.components(separatedBy: " ").first,
                                                       lastName: user?.fullName.components(separatedBy: " ").last,
                                                       address: address(),
                                                       dateOfBirth: user?.birthday?.toDate()))
            }
        }
    }
    
    private func subscribeToDeeplinks() {
        client.registerDeeplinkProvider { deeplink in
            let rngDeeplink = "rng://matchupId=\(deeplink)"
            return rngDeeplink
        }
    }
    
    /// Dismiss the flow when a matchup is Started.
    private func subscribeToEvents() {
        client.$event.sink { event in
            switch event {
            case .gamesMatchupStarted(let id):
                self.flow = nil
            default:
                break
            }
        }.store(in: &cancellables)
    }
}

extension SessionManager {
    func address() -> Address? {
        if let user = user {
            /// Need to separate address into components
            return Address(address: user.address, addressCont: nil, city: nil, state: nil, zip: nil)
        }
        return nil
    }
}


extension String {
    func toDate() -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX") // consistent parsing
        formatter.timeZone = TimeZone(secondsFromGMT: 0)     // prevent timezone shifts
        return formatter.date(from: self)
    }
}
